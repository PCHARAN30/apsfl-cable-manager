const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const Customer = require("../models/Customer");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Add planMonths × 30 days to a base date
 */
const calcValidTill = (baseDate, planMonths = 1) => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + planMonths * 30);
  return d;
};

/**
 * Normalise an imported row into { name, phone, cafNumber }
 * Handles different column name conventions used by APSFL exports.
 */
const normaliseRow = (row) => {
  const get = (...keys) => {
    for (const k of keys) {
      const found = Object.keys(row).find(
        (rk) => rk.trim().toLowerCase() === k.toLowerCase()
      );
      if (found && row[found] !== undefined && String(row[found]).trim() !== "") {
        return String(row[found]).trim();
      }
    }
    return "";
  };

  const name = get("name", "customer name", "customername", "subscriber name");
  const phone = get("phone", "mobile", "mobile number", "contact", "phone number");
  const address = get("address", "addr", "location", "area", "full address");
  const cafNumber = get(
    "caf", "cafnumber", "caf number", "caf no", "caf_number", "caf id"
  );

  return { name, phone, address, cafNumber };
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/** GET /api/customers  — list with optional search + status filter */
exports.getCustomers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 100 } = req.query;
    const query = {};

    if (status && ["PAID", "UNPAID", "PARTIAL"].includes(status.toUpperCase())) {
      query.status = status.toUpperCase();
    }

    if (search) {
      const re = new RegExp(search, "i");
      query.$or = [{ name: re }, { cafNumber: re }, { phone: re }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [customers, total] = await Promise.all([
      Customer.find(query).lean().sort({ name: 1 }).skip(skip).limit(parseInt(limit)),
      Customer.countDocuments(query),
    ]);

    res.json({ success: true, total, page: parseInt(page), data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/customers/:id */
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** POST /api/customers  — create single customer manually */
exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, address, cafNumber, planAmount, notes } = req.body;
    if (!name || !cafNumber) {
      return res.status(400).json({ success: false, message: "Name and CAF Number are required" });
    }

    const existing = await Customer.findOne({ cafNumber: cafNumber.toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "CAF Number already exists" });
    }

    const customer = await Customer.create({ name, phone, address, cafNumber, planAmount, notes });
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/customers/:id  — update customer details */
exports.updateCustomer = async (req, res) => {
  try {
    const updates = (({ name, phone, address, planAmount, notes }) => ({ name, phone, address, planAmount, notes }))(req.body);
    const customer = await Customer.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).lean();
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** DELETE /api/customers/:id */
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    res.json({ success: true, message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** POST /api/customers/import  — bulk import from CSV/XLSX/TXT */
exports.importCustomers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];

    if (ext === ".csv" || ext === ".txt") {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
          .on("data", (row) => rows.push(row))
          .on("end", resolve)
          .on("error", reject);
      });
    } else if (ext === ".xlsx" || ext === ".xls") {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    }

    // Cleanup temp file
    fs.unlink(filePath, () => {});

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "File is empty or could not be parsed" });
    }

    let imported = 0;
    let skipped = 0;
    let errors = [];

    for (const row of rows) {
      const { name, phone, address, cafNumber } = normaliseRow(row);
      if (!name || !cafNumber) {
        errors.push({ row, reason: "Missing name or CAF number" });
        skipped++;
        continue;
      }

      try {
        await Customer.updateOne(
          { cafNumber: cafNumber.toUpperCase() },
          { $setOnInsert: { name, phone, address, cafNumber: cafNumber.toUpperCase() } },
          { upsert: true }
        );
        const wasNew = await Customer.findOne({ cafNumber: cafNumber.toUpperCase() }).lean();
        if (wasNew) imported++;
      } catch (e) {
        if (e.code === 11000) {
          skipped++; // duplicate
        } else {
          errors.push({ cafNumber, reason: e.message });
          skipped++;
        }
      }
    }

    // Re-count actual imports
    res.json({
      success: true,
      message: `Import complete`,
      total: rows.length,
      imported,
      skipped,
      errors: errors.slice(0, 20), // return first 20 errors only
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

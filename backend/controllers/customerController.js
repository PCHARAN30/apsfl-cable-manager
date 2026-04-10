const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const Customer = require("../models/Customer");
const Payment = require("../models/Payment");
const { calcValidTill } = require("../utils/dateUtils");
const Settings = require("../models/Settings");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize PON Number to consistently format as 'PON-X'
 */
const normalizePon = (pon) => {
  if (pon === undefined || pon === null) return null;
  let str = String(pon).trim().toUpperCase();
  if (str === "") return null;
  str = str.replace(/^(PON[-\s]*)+/i, '').trim(); // Strip 'PON', 'PON-', or 'PON ' from start
  if (str === "") return null;
  return `PON-${str}`;
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
  const area = get("zone", "area", "ward", "village", "city");
  const ponNumber = get("pon", "pon number", "pon_number", "pon id");
  const cafNumber = get(
    "caf", "cafnumber", "caf number", "caf no", "caf_number", "caf id"
  );
  const planName = get("plan", "package", "plan name", "package name");
  const connectionDateRaw = get("connection date", "join date", "date of connection", "connectiondate", "joindate");
  let connectionDate = null;
  if (connectionDateRaw) {
    const parsed = new Date(connectionDateRaw);
    if (!isNaN(parsed)) connectionDate = parsed;
  }

  return { name, phone, address, area, cafNumber, connectionDate, ponNumber, planName };
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/** GET /api/customers  — list with optional search + status filter */
exports.getCustomers = async (req, res) => {
  try {
    const { search, status, pon, page = 1, limit = 100 } = req.query;
    const query = {};

    if (status && ["PAID", "UNPAID", "PARTIAL"].includes(status.toUpperCase())) {
      query.status = status.toUpperCase();
    }

    if (pon) {
      query.ponNumber = pon;
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
    let { name, phone, address, area, cafNumber, planName, notes, connectionDate, ponNumber, planAmount } = req.body;
    if (!connectionDate) connectionDate = null; // Prevent CastError for empty string
    ponNumber = normalizePon(ponNumber);
    
    if (!name || !cafNumber) {
      return res.status(400).json({ success: false, message: "Name and CAF Number are required" });
    }

    if (ponNumber) {
      if (!/^[a-zA-Z0-9-]+$/.test(ponNumber)) {
        return res.status(400).json({ success: false, message: "PON Number must be alphanumeric (e.g., PON2, 2)" });
      }
      const count = await Customer.countDocuments({ ponNumber });
      if (count >= 128) {
        return res.status(400).json({ success: false, message: "PON is full (128 connections reached)" });
      }
    }

    const existing = await Customer.findOne({ cafNumber: cafNumber.toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "CAF Number already exists" });
    }

    const settings = await Settings.findOne();
    const dynamicPlans = settings?.plans || [];

    if (dynamicPlans.length === 0) {
      return res.status(400).json({ success: false, message: "No packages defined in Settings. Please add a package first." });
    }

    const customPlan = dynamicPlans.find(p => p.name === planName);
    if (planName && !customPlan) {
      return res.status(400).json({ success: false, message: "Selected package is invalid. Please choose a package from Settings." });
    }
    
    const defaultPlan = dynamicPlans.find(p => p.isDefault) || dynamicPlans[0];
    const selectedPackage = customPlan 
      ? { name: customPlan.name, price: customPlan.amount } 
      : { name: defaultPlan.name, price: defaultPlan.amount };

    const customer = await Customer.create({ name, phone, address, area, cafNumber, planName: selectedPackage.name, planAmount: selectedPackage.price, packageDetails: selectedPackage, notes, connectionDate, ponNumber });
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/customers/:id  — update customer details */
exports.updateCustomer = async (req, res) => {
  try {
    const updates = (({ name, phone, address, area, planName, notes, connectionDate, ponNumber, cafNumber, billingStartDate }) => ({ name, phone, address, area, planName, notes, connectionDate, ponNumber, cafNumber, billingStartDate }))(req.body);
    if ('connectionDate' in req.body && !updates.connectionDate) updates.connectionDate = null;
    if ('billingStartDate' in req.body && !updates.billingStartDate) updates.billingStartDate = null;
    if ('ponNumber' in req.body) updates.ponNumber = normalizePon(updates.ponNumber);
    
    if (updates.planName) {
      const settings = await Settings.findOne();
      const dynamicPlans = settings?.plans || [];
      const customPlan = dynamicPlans.find(p => p.name === updates.planName);
      if (!customPlan) {
        return res.status(400).json({ success: false, message: "Selected package is invalid. Please choose a package from Settings." });
      }
      updates.planName = customPlan.name;
      updates.planAmount = customPlan.amount;
      updates.packageDetails = { name: customPlan.name, price: customPlan.amount };
    }

    const existingCustomer = await Customer.findById(req.params.id);
    if (!existingCustomer) return res.status(404).json({ success: false, message: "Customer not found" });

    // PON capacity check if PON is being modified
    if (updates.ponNumber && existingCustomer.ponNumber !== updates.ponNumber) {
      if (!/^[a-zA-Z0-9-]+$/.test(updates.ponNumber)) {
        return res.status(400).json({ success: false, message: "PON Number must be alphanumeric (e.g., PON2, 2)" });
      }
      const count = await Customer.countDocuments({ ponNumber: updates.ponNumber });
      if (count >= 128) {
        return res.status(400).json({ success: false, message: "PON is full (128 connections reached)" });
      }
    }

    // Generate Auto-Note for tracked changes
    const trackableFields = ['name', 'phone', 'address', 'area', 'planName', 'ponNumber', 'cafNumber', 'connectionDate', 'billingStartDate'];
    const changedFields = [];

    for (const field of trackableFields) {
      if (updates[field] !== undefined) {
        let oldVal = existingCustomer[field];
        let newVal = updates[field];
        
        // Handle date formatting for accurate comparison
        if (field === 'connectionDate' || field === 'billingStartDate') {
          oldVal = oldVal ? new Date(oldVal).toDateString() : '';
          newVal = newVal ? new Date(newVal).toDateString() : '';
        } else {
          oldVal = oldVal ? String(oldVal) : '';
          newVal = newVal ? String(newVal) : '';
        }

        if (oldVal !== newVal) {
          const displayNames = { planName: 'package', ponNumber: 'PON number', cafNumber: 'CAF number', connectionDate: 'connection date', billingStartDate: 'billing reset date' };
          changedFields.push(displayNames[field] || field);
        }
      }
    }

    if (changedFields.length > 0) {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-IN");
      const timeStr = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
      const autoNote = `[System: ${changedFields.join(', ')} updated on ${dateStr} at ${timeStr}]`;
      
      // Safely append to frontend notes or existing db notes
      const baseNotes = updates.notes !== undefined ? String(updates.notes) : String(existingCustomer.notes || '');
      const lines = baseNotes.split('\n');
      const userNotes = lines.filter(line => !line.trim().startsWith('[System:'));
      const systemLogs = lines.filter(line => line.trim().startsWith('[System:'));
      
      const recentLogs = systemLogs.slice(-4); // Keep only the last 4 system logs
      recentLogs.push(autoNote); // Add the new one to make it 5 max
      
      updates.notes = userNotes.join('').trim() === '' ? recentLogs.join('\n') : userNotes.join('\n') + '\n' + recentLogs.join('\n');
    }

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
    
    // Safe cascading delete for data integrity
    await Payment.deleteMany({ customer: req.params.id });
    
    res.json({ success: true, message: "Customer and associated payments deleted" });
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
    
    const settings = await Settings.findOne();
    const dynamicPlans = settings?.plans || [];

    for (const row of rows) {
      let { name, phone, address, area, cafNumber, connectionDate, ponNumber, planName } = normaliseRow(row);
      ponNumber = normalizePon(ponNumber);
      if (!name || !cafNumber) {
        errors.push({ row, reason: "Missing name or CAF number" });
        skipped++;
        continue;
      }

      const customPlan = dynamicPlans.find(p => p.name === planName);
      const defaultPlan = dynamicPlans.find(p => p.isDefault) || dynamicPlans[0];
      
      if (!customPlan && !defaultPlan) {
        errors.push({ row, reason: "No packages defined in Settings" });
        skipped++;
        continue;
      }

      const selectedPackage = customPlan 
        ? { name: customPlan.name, price: customPlan.amount } 
        : { name: defaultPlan.name, price: defaultPlan.amount };

      try {
        const result = await Customer.updateOne(
          { cafNumber: cafNumber.toUpperCase() },
          { $setOnInsert: { 
            name, phone, address, area, cafNumber: cafNumber.toUpperCase(),
            planName: selectedPackage.name, planAmount: selectedPackage.price, packageDetails: selectedPackage,
            ...(connectionDate && { connectionDate }),
            ...(ponNumber && { ponNumber })
          } },
          { upsert: true }
        );
        
        if (result.upsertedCount > 0) {
          imported++;
        } else {
          skipped++;
        }
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

/** POST /api/customers/bulk-delete  — bulk delete customers */
exports.bulkDeleteCustomers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No IDs provided" });
    }
    // Safe cascading delete
    await Payment.deleteMany({ customer: { $in: ids } });
    await Customer.deleteMany({ _id: { $in: ids } });
    
    res.json({ success: true, message: "Customers and associated payments deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/customers/pon-stats  — get aggregation of PON capacity */
exports.getPonStats = async (req, res) => {
  try {
    const stats = await Customer.aggregate([
      { 
        $match: { ponNumber: { $ne: null, $ne: "" } } 
      },
      { 
        $group: { _id: "$ponNumber", used: { $sum: 1 } } 
      },
      { 
        $project: { _id: 0, ponNumber: "$_id", used: 1, available: { $subtract: [128, "$used"] } } 
      },
      { $sort: { ponNumber: 1 } }
    ]);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

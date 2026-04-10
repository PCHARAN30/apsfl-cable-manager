require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const Customer = require("../models/Customer");

const normalizePon = (pon) => {
  if (!pon) return null;
  let str = String(pon).trim().toUpperCase();
  if (str === "") return null;
  str = str.replace(/^PON[-\s]*/i, "").trim();
  if (str === "") return null;
  return `PON-${str}`;
};

const fixPonFormat = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI_LOCAL ||
      "mongodb://localhost:27017/apsfl_customer_db?directConnection=true";

    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    // Find all customers that have a ponNumber
    const customers = await Customer.find({
      ponNumber: { $exists: true, $ne: null, $ne: "" },
    });

    console.log(`📋 Found ${customers.length} customers with PON numbers`);

    let fixed = 0;
    for (const customer of customers) {
      const normalized = normalizePon(customer.ponNumber);
      if (normalized && normalized !== customer.ponNumber) {
        console.log(
          `  Fixing: "${customer.ponNumber}" → "${normalized}" (${customer.name})`
        );
        customer.ponNumber = normalized;
        await customer.save();
        fixed++;
      }
    }

    console.log(`\n✅ Done! Fixed ${fixed} PON numbers.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

fixPonFormat();
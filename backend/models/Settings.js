const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const settingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      trim: true,
      default: "CableSync",
    },
    plans: {
      type: [planSchema],
      default: [],
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
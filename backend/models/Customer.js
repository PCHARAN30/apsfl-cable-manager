const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    cafNumber: {
      type: String,
      required: [true, "CAF number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    // --- Network / Hardware ---
    ponNumber: {
      type: String,
      trim: true,
      default: null,
    },

    // --- Connection Date ---
    connectionDate: {
      type: Date,
      default: null,
    },

    // --- Plan & Amount ---
    planAmount: {
      type: Number,
      default: 300, // default monthly plan amount in ₹
    },
    planMonths: {
      type: Number,
      default: 1, // how many months paid at once
    },

    // --- Payment Status ---
    status: {
      type: String,
      enum: ["PAID", "UNPAID", "PARTIAL"],
      default: "UNPAID",
    },
    partialAmountPaid: {
      type: Number,
      default: 0, // amount paid if status = PARTIAL
    },
    carryOver: {
      type: Number,
      default: 0, // balance carried forward from partial payment
    },

    // --- Dates ---
    lastPaymentDate: {
      type: Date,
      default: null,
    },
    validTill: {
      type: Date,
      default: null,
    },

    // --- Operator notes ---
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Virtual: days remaining
customerSchema.virtual("daysRemaining").get(function () {
  if (!this.validTill) return 0;
  const today = new Date();
  const diff = Math.ceil((this.validTill - today) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
});

customerSchema.set("toJSON", { virtuals: true });
customerSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Customer", customerSchema);

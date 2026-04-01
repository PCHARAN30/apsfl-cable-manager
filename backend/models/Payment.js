const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    cafNumber: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    planMonths: {
      type: Number,
      default: 1,
    },
    paymentType: {
      type: String,
      enum: ["FULL", "PARTIAL"],
      default: "FULL",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    validFrom: {
      type: Date,
    },
    validTill: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);

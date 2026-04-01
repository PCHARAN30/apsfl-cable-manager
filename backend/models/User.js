const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  this.password = crypto.createHash("sha256").update(this.password).digest("hex");
  next();
});

userSchema.methods.matchPassword = function (enteredPassword) {
  const hashed = crypto.createHash("sha256").update(enteredPassword).digest("hex");
  return hashed === this.password;
};

module.exports = mongoose.model("User", userSchema);
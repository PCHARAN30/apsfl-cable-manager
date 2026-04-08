const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    let mongoURI;

    // Auto-detect environment and assign the correct URI
    if (process.env.NODE_ENV === "production") {
      mongoURI = process.env.MONGO_URI_ATLAS;
      console.log("🌍 Using MongoDB Atlas (Production)");
    } else {
      mongoURI = process.env.MONGO_URI_LOCAL || "mongodb://127.0.0.1:27017/apsfl_cable_manager";
      console.log("💻 Using Local MongoDB (Development)");
    }

    if (!mongoURI) {
      throw new Error("MongoDB URI is not defined in environment variables.");
    }

    await mongoose.connect(mongoURI);

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ DB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

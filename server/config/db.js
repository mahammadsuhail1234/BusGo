
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.mongourl;
  if (!uri) {
    console.error("MongoDB connection failed: Set MONGODB_URI in server/.env to your MongoDB connection string.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);

    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

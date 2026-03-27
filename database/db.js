import mongoose from "mongoose";

export const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME,
    });
    console.log("✅ Database connected");
  } catch (err) {
    console.log("❌ DB ERROR:", err.message);
    process.exit(1); // stop app if DB fails
  }
};

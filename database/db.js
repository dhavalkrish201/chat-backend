import mongoose from "mongoose";

export const dbConnection = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME,
    })
    .then(() => {
      console.log("Database connected");
    })
    .catch((err) => {
      console.log(`Error Connecting to database: ${err.message || err}`);
    });
};

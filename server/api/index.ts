import app from "../src/app";
import { connectDB } from "../src/config/db";

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection failure in serverless handler:", err);
  }
  return app(req, res);
}

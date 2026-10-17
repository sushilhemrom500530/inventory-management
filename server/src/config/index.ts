import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const envSchema = z.object({
  DATABASE_URL: z.string({
    message: "DATABASE_URL is required",
  }),
  PORT: z.string().transform(Number).default(5000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  JWT_SECRET_KEY: z.string({
    message: "JWT_SECRET_KEY is required",
  }),
  JWT_ACCESS_TOKEN_EXPIRESIN: z.string({
    message: "JWT_ACCESS_TOKEN_EXPIRESIN is required",
  }),
  JWT_REFRESH_TOKEN_EXPIRESIN: z.string({
    message: "JWT_REFRESH_TOKEN_EXPIRESIN is required",
  }),

  CONTACT_MAIL: z.string({
    message: "CONTACT_MAIL is required",
  }),
  NODEMAILER_GMAIL: z.string().optional(),
  NODEMAILER_PASSWORD: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  UPLOAD_FOLDER: z.string().optional(),
  MAX_FILE_SIZE: z.string().transform(Number).optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().optional(),

  SUPPORT_EMAIL: z.string().optional(),
  SUPPORT_PHONE: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_NAME: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

export const {
  DATABASE_URL,
  PORT,
  NODE_ENV,
  JWT_SECRET_KEY,
  JWT_ACCESS_TOKEN_EXPIRESIN,
  JWT_REFRESH_TOKEN_EXPIRESIN,
  CONTACT_MAIL,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  NODEMAILER_GMAIL,
  NODEMAILER_PASSWORD,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  UPLOAD_FOLDER,
  MAX_FILE_SIZE,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_BUCKET_NAME,

  REDIS_URL,

  CLOUDINARY_API_SECRET,
  CLOUDINARY_API_KEY,
  CLOUDINARY_NAME,
} = parsedEnv.data;

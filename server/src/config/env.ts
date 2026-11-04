import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { z } from "zod";

// Locate the single root .env file
const possibleEnvPaths = [
  path.resolve(__dirname, "../../../.env"),
  path.resolve(process.cwd(), "../.env"),
  path.resolve(process.cwd(), ".env"),
];

const envPath =
  possibleEnvPaths.find((p) => fs.existsSync(p)) || possibleEnvPaths[0];

dotenv.config({ path: envPath });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/safetech_billing"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  REFRESH_TOKEN_SECRET: z.string().optional(),
  CLIENT_URL: z.string().optional().default("http://localhost:5173"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z
    .string()
    .optional()
    .default("Safe Tech Billing <billing@safetech.so>"),
  SMS_GATEWAY_URL: z.string().optional(),
  SMS_GATEWAY_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().optional().default("SafeTech"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.format());
  throw new Error("Invalid environment configuration");
}

export const env = parsedEnv.data;

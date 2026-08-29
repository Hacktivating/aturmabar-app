// import { defineConfig } from "drizzle-kit";
// import * as dotenv from "dotenv";

// dotenv.config();

// export default defineConfig({
//   schema: "./src/db/schema.ts",
//   out: "./drizzle",
//   dialect: "postgresql",
//   dbCredentials: {
//     url: process.env.DATABASE_URL!,
//   },
// });

import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const activeEnv = process.env.ACTIVE_DB_ENV || "local";
const dbUrl = activeEnv === "neon" 
  ? process.env.DATABASE_URL_NEON! 
  : process.env.DATABASE_URL_LOCAL!;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
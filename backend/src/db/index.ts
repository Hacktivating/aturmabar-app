// import { neon } from '@neondatabase/serverless';
// import { drizzle } from 'drizzle-orm/neon-http';
// import * as schema from './schema';
// import * as dotenv from "dotenv";

// dotenv.config();

// const sql = neon(process.env.DATABASE_URL!);
// export const db = drizzle(sql, { schema });

import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzleLocal } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from "dotenv";

dotenv.config();

const activeEnv = process.env.ACTIVE_DB_ENV || 'local';

const initializeDb = () => {
  if (activeEnv === 'neon') {
    // Preserved Cloud Driver
    const sql = neon(process.env.DATABASE_URL_NEON!);
    return drizzleNeon(sql, { schema });
  } else {
    // Local Docker Driver
    const queryClient = postgres(process.env.DATABASE_URL_LOCAL!);
    return drizzleLocal(queryClient, { schema });
  }
};

export const db = initializeDb();
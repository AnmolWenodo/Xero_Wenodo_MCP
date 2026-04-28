import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE,
  port: 1433,

  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function connectDB() {
  try {
    pool = await sql.connect(config);
    
  } catch (err) {
    console.error("❌ DB Connection failed:", err);
    process.exit(1); // crash app if DB fails
  }
}

export function getDb() {
  if (!pool) {
    throw new Error("DB not connected. Call connectDB() first.");
  }
  return pool;
}

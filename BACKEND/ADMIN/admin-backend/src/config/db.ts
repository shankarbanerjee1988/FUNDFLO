import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

class Database {
  private static instance: Sequelize;

  private constructor() {} // Prevent direct instantiation

  public static getInstance(): Sequelize {
    if (!Database.instance) {
      console.log("✅ Creating new database instance with connection pool...");

      const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

      if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {
        throw new Error("❌ Missing required database environment variables!");
      }

      Database.instance = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
        host: DB_HOST,
        port: Number(DB_PORT),
        dialect: "postgres",
        logging: false, // Set to true for debugging

        // ✅ Connection Pool Configuration
        pool: {
          max: 10, // Maximum connections in the pool
          min: 2,  // Minimum connections in the pool
          acquire: 30000, // Max time (ms) to acquire a connection before throwing an error
          idle: 10000, // Max time (ms) a connection can be idle before being released
        },
      });
    } else {
      console.log("🔄 Using existing database instance...");
    }

    return Database.instance;
  }

  public static async connect(): Promise<void> {
    try {
      await Database.getInstance().authenticate();
      console.log("✅ Database connected successfully with connection pool!");
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      process.exit(1);
    }
  }
}

// ✅ Export a single instance of Sequelize for all models
export const sequelize: Sequelize = Database.getInstance();

export default Database;
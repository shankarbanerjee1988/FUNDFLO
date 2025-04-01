const { Pool } = require("pg");
const Sequelize = require("sequelize");
const db = require("./db.config");
const nodeEnv = process.env.NODE_ENV || "";
console.log("nodeEnv...", nodeEnv);

let DbConnect = (function () {
  let pgInstance;
  let sqInstance;

  function createInstanceUsingPg() {
    let ssl = { rejectUnauthorized: false };
    if (db.DB_HOST === 'localhost' || db.DB_HOST === '127.0.0.1') {
      ssl = {};
    }
    const dbCreds = {
      user: db.DB_USER,
      host: db.DB_HOST,
      database: db.DB_NAME,
      password: db.DB_PASS,
      port: 5432,
      dialect: db.dialect,
      ...((db.DB_HOST === 'localhost' || db.DB_HOST === '127.0.0.1') ? {} : { ssl: { rejectUnauthorized: false } }),
      pool: {
        max: db.pool.max,
        min: db.pool.min,
        acquire: db.pool.acquire,
        idle: db.pool.idle,
      },
    };
    const pool = new Pool(dbCreds);
    return pool;
  }

  function createInstanceUsingSequelize() {
    let dialectOpt = { ssl: { rejectUnauthorized: false } };
    if (db.DB_HOST === 'localhost' || db.DB_HOST === '127.0.0.1') {
      dialectOpt = {};
    }
    const dbCreds = {
      host: db.DB_HOST,
      port: db.DB_PORT,
      dialect: db.dialect,
      dialectOptions: dialectOpt,
      pool: {
        max: db.pool.max,
        min: db.pool.min,
        acquire: db.pool.acquire,
        idle: db.pool.idle,
      },
      define: {
        timestamps: false,
        freezeTableName: true,
      },
      logging: nodeEnv === "local"
    };
    const pool = new Sequelize(db.DB_NAME, db.DB_USER, db.DB_PASS, dbCreds);
    return pool;
  }

  return {
    getInstancePG: function () {
      if (!pgInstance) {
             pgInstance = createInstanceUsingPg();
        // Object.freeze(pgInstance);
      }

      return pgInstance;
    },
    getInstanceSQ: function () {
      if (!sqInstance) {
        sqInstance = createInstanceUsingSequelize();
        // Object.freeze(sqInstance);
      }

      return sqInstance;
    },
  };
})();

let pool = DbConnect.getInstancePG();
let sequelize = DbConnect.getInstanceSQ();

module.exports = {
  pool,
  sequelize,
  Op: Sequelize.Op
};

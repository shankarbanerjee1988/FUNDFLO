module.exports = {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,
  dialect: "postgres",
  pool: {
    max: 6,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
};

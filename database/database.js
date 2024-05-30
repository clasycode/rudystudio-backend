require("dotenv").config();

const { Sequelize } = require("sequelize");
const DB_URL = process.env.DB_URL;

if (!DB_URL) {
  console.error("DB_URL is not set!");
  process.exit(1);
} else {
  console.log(`DB_URL is set to ${DB_URL}`);
}

module.exports = new Sequelize(DB_URL, {
  dialect: "postgres",
  protocol: "postgres",
});

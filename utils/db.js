const Sequelize = require("sequelize");

const config = {
  host: process.env.DB_HOSTNAME,
  dialect: "mysql" /* one of 'mysql' | 'postgres' | 'sqlite' | 
    'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */,

  define: {
    timestamps: false,

    // If don't want createdAt
    createdAt: false,

    // If don't want updatedAt
    updatedAt: false,
  },
};

if (process.env.ENV == "prod") {
  config.logging = false;
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  config
);

module.exports = sequelize;

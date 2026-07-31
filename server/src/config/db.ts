import { Sequelize } from "sequelize";
import { env } from "./env.js";

export const sqlize = new Sequelize(env.MYSQL_URL, {
  dialect: "mysql",
  logging: false,
  dialectOptions: { charset: "utf8mb4" },
  timezone: "+08:00",
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

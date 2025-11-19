import { Sequelize } from "sequelize";
import "dotenv/config";

export const sqlize = new Sequelize(process.env.MYSQL_URL!, {
  dialect: "mysql",
  logging: false,
  dialectOptions: { charset: "utf8mb4" },
});

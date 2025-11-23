import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import { sqlize } from "../config/db.js";

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;
  declare username: string;
  declare email: string;
  declare password: string;
  declare refreshTokenHash: string | null;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    refreshTokenHash: { type: DataTypes.STRING, allowNull: true }, 
  },
  { sequelize: sqlize, modelName: "user", tableName: "users", timestamps: true }
);

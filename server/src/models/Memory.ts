import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import { sqlize } from "../config/db.js";

export class Memory extends Model<
  InferAttributes<Memory>,
  InferCreationAttributes<Memory>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare content: string;
  declare importance: number; // 1~5
  declare sourceConversationId: number | null;
  declare sourceMessageId: number | null;
  declare lastUsedAt: CreationOptional<Date>;
}

Memory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    importance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    sourceConversationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "conversations", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    sourceMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "messages", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: sqlize,
    modelName: "memory",
    tableName: "memories",
    indexes: [
      {
        name: "memories_user_content_unique",
        unique: true,
        fields: [
          "userId",
          {
            name: "content",
            length: 191,
          },
        ],
      },
    ],
  }
);

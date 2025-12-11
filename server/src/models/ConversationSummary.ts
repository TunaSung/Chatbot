import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import { sqlize } from "../config/db.js";

export class ConversationSummary extends Model<
  InferAttributes<ConversationSummary>,
  InferCreationAttributes<ConversationSummary>
> {
  declare id: CreationOptional<number>;
  declare conversationId: number;
  declare summary: string;
  declare messageCountAtLastSummary: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ConversationSummary.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "conversations", key: "id" },
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    messageCountAtLastSummary: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: sqlize,
    modelName: "conversation_summary",
    tableName: "conversation_summaries",
  }
);

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
  },
  {
    sequelize: sqlize,
    modelName: "conversation_summary",
    tableName: "conversation_summaries",
  }
);

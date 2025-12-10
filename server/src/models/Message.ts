import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ForeignKey,
} from "sequelize";
import { sqlize } from "../config/db.js";
import { Conversation } from "./Conversation.js";

export class Message extends Model<
  InferAttributes<Message>,
  InferCreationAttributes<Message>
> {
  declare id: CreationOptional<number>;
  declare conversationId: ForeignKey<Conversation["id"]>;
  declare role: "user" | "assistant" | "system";
  declare content: string;
}

Message.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "conversations", key: "id" },
      onDelete: "CASCADE",
    },
    role: {
      type: DataTypes.ENUM("user", "assistant", "system"),
      allowNull: false,
    },
    content: { type: DataTypes.TEXT("long"), allowNull: false },
  },
  {
    sequelize: sqlize,
    modelName: "message",
    tableName: "messages",
    timestamps: true,
    indexes: [
      {
        fields: ["conversationId", "id"],
      },
    ],
  }
);

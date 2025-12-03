import { User } from "./User.js";
import { Conversation } from "./Conversation.js";
import { Message } from "./Message.js";
import { Memory } from "./Memory.js";
import { ConversationSummary } from "./ConversationSummary.js";
import type { CreateOptions } from "sequelize";

/**
 * User
 * ↓
 * Conversation, 
 * Memory
 */
User.hasMany(Conversation, { foreignKey: "userId" });
Conversation.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Memory, { foreignKey: "userId" });
Memory.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE", });

/**
 * Conversation
 * ↓
 * Message, 
 * Memory,
 * ConversationSummary
 */
Conversation.hasMany(Message, {
  foreignKey: "conversationId",
  onDelete: "CASCADE",
});
Message.belongsTo(Conversation, {
  foreignKey: "conversationId",
  onDelete: "CASCADE",
});

Conversation.hasMany(Memory, {
  foreignKey: "sourceConversationId",
});
Memory.belongsTo(Conversation, {
  foreignKey: {
    name: "sourceConversationId",
    allowNull: true,
  },
  onDelete: "SET NULL", 
});

Conversation.hasOne(ConversationSummary, {
  foreignKey: "conversationId",
  onDelete: "CASCADE",
});

ConversationSummary.belongsTo(Conversation, {
  foreignKey: "conversationId",
});

/**
 * Message
 * ↓
 * Memory
 */
Message.hasMany(Memory, {
  foreignKey: "sourceMessageId",
});
Memory.belongsTo(Message, {
  foreignKey: {
    name: "sourceMessageId",
    allowNull: true,
  },
  onDelete: "SET NULL", // 同上
});

/**
 * sequelize 會自己傳入該筆 msg
 */
Message.afterCreate(async (msg: Message, options: CreateOptions) => {
  const convId = msg.conversationId;
  if (!convId) return;

  const conv = await Conversation.findByPk(convId, {
    transaction: options.transaction ?? null,
  });
  if (!conv) {
    return;
  }

  conv.changed("updatedAt", true);
  await conv.save({ transaction: options.transaction ?? null });
});

export { User, Conversation, Message, Memory, ConversationSummary };

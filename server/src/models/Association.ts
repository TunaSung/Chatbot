import { User } from "./User.js";
import { Conversation } from "./Conversation.js";
import { Message } from "./Message.js";
import type { CreateOptions } from "sequelize";

User.hasMany(Conversation, { foreignKey: "userId" });
Conversation.belongsTo(User, { foreignKey: "userId" });

Conversation.hasMany(Message, {
  foreignKey: "conversationId",
  onDelete: "CASCADE",
});
Message.belongsTo(Conversation, { foreignKey: "conversationId" });

// sequelize 會自己傳入該筆 msg，
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

export { User, Conversation, Message };

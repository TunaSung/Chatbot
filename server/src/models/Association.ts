import { User } from "./User.js";
import { Conversation } from "./Conversation.js";
import { Message } from "./Message.js";

User.hasMany(Conversation, { foreignKey: "userId" });
Conversation.belongsTo(User, { foreignKey: "userId" });

Conversation.hasMany(Message, { foreignKey: "conversationId", onDelete: "CASCADE" });
Message.belongsTo(Conversation, { foreignKey: "conversationId" });

export { User, Conversation, Message };

export type Message = {
  id: number;
  conversationId: number;
  role: "user" | "assistant" | "system";
  content: string;
  updatedAt: string;
  createdAt: string;
};

export type Result = {
  conversationId: number;
  messages: Message[];
};

export type SendMsgRep = {
  message: string;
  result: Result;
};

export type Conversation = {
  id: number;
  title: string;
  updatedAt: string;
};

export type FetchConversationsRep = {
  message: string;
  convs: Conversation[];
};

export type FetchMessagesRep = {
  message: string;
  messages: Message[];
};

export type DeleteConvRep = {
  message: string;
  conversationId: number;
};

export type EditTileRep = {
  message: string;
  conversationId: number;
};

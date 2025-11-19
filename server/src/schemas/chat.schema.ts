import { z } from "zod";

/**
 * for chat.service
 */
export const chatMessageSchema = z.object({
  id: z.number().int().positive(),
  conversationId: z.number().int().positive(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
});

const handleChatSchema = z.object({
  conversationId: z.number().int().positive(),
  messages: z.array(chatMessageSchema).min(2),
});

export type HandleChat = z.infer<typeof handleChatSchema>;

/**
 * for chat.handler
 */
export const postChatSchema = z.object({
  body: z
    .object({
      message: z.string().min(1),
      conversationId: z.number().int().positive().optional(),
    })
    .strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict(),
});
export type postChatBody = z.infer<typeof postChatSchema>["body"];

export const getMessagesParamsSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

export const deleteConversationParamsSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

export const editTitleSchema = z.object({
  body: z
    .object({
      title: z.string().min(1),
      id: z.number().int().positive().optional(),
    })
    .strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict(),
});
export type EditTitleBody = z.infer<typeof editTitleSchema>["body"];

import api from "./api";
import type { SendMsgRep, FetchConversationsRep, FetchMessagesRep, DeleteConvRep, EditTileRep } from "../types/chat.type";
import { getErrorMessage } from "../utils/service";

export const sendMessage = async (
  message: string,
  conversationId?: number
): Promise<SendMsgRep> => {
  try {
    const res = await api.post("/chat", {
      message,
      conversationId
    })
    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error, "Send msg failed"))
  }
}

export const getConversations = async (): Promise<FetchConversationsRep> => {
  try {
    const res = await api.get("/chat/conversations")
    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error, "Fetch Conversations failed"))
  }
}

export const getMessages = async(
  conversationId: number
): Promise<FetchMessagesRep> => {
  try {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`)
    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error, "Fetch Msgs failed"))
  }
}

export const deleteConv = async(
  conversationId: number
): Promise<DeleteConvRep> => {
  try {
    const res = await api.delete(`/chat/conversations/${conversationId}/delete`)
    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error, "Delete Conv failed"))
  }
}

export const editTile = async(
  title: string,
  id: number
): Promise<EditTileRep> => {
  try {
    const res = await api.post(`/chat/conversations/update`, {title, id})
    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error, "Update Title failed"))
  }
}

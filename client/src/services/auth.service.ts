import api, { apiNoAuth } from "./api";
import type { SignInResp, SignUpResp } from "../types/auth.type";
import { getErrorMessage } from "../utils/service";
import {
  saveTokenToStorage,
  clearTokenFromStorage,
  getAccessToken,
  getRefreshToken,
} from "./token";

export const saveToken = (token: string, refreshToken?: string): void => {
  saveTokenToStorage(token, refreshToken);
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

export const clearToken = (): void => {
  clearTokenFromStorage();
  delete api.defaults.headers.common["Authorization"];
};

export const setAuthHeader = (): void => {
  const token = getAccessToken();
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
};

// service
export const signUp = async (
  username: string,
  email: string,
  password: string
): Promise<SignUpResp> => {
  try {
    const res = await api.post<SignUpResp>("/auth/signup", {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Sign up failed"));
  }
};

export const signIn = async (
  email: string,
  password: string
): Promise<SignInResp> => {
  try {
    const res = await apiNoAuth.post<SignInResp>("/auth/signin", {
      email: email.trim().toLowerCase(),
      password,
    });
    const { token, refreshToken } = res.data;
    saveToken(token, refreshToken);
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Sign in failed"));
  }
};

// 手動 refresh
export const refreshToken = async (): Promise<Pick<SignInResp, "token" | "refreshToken">> => {
  const rt = getRefreshToken();
  if (!rt) throw new Error("Missing refresh token");

  try {
    const res = await apiNoAuth.post("/auth/refresh", { refreshToken: rt });
    const { token, refreshToken: newRT } = res.data as {
      token: string;
      refreshToken: string;
    };
    saveToken(token, newRT);
    return { token, refreshToken: newRT };
  } catch (error) {
    clearToken();
    throw new Error(getErrorMessage(error, "Refresh failed"));
  }
};

// 登出
export const logoutRemote = async (): Promise<void> => {
  const rt = getRefreshToken();
  try {
    if (rt) {
      await apiNoAuth.post("/auth/logout", { refreshToken: rt });
    }
  } finally {
    clearToken();
  }
};

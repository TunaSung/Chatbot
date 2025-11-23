import axios, { AxiosError,type  AxiosRequestConfig } from "axios";
import { getAccessToken, getRefreshToken, saveTokenToStorage, clearTokenFromStorage } from "./token";

const Base = import.meta.env.VITE_API_URL || "";

// 有 auth header 的一般 API
const api = axios.create({
  baseURL: Base + "/api",
  withCredentials: false,
});

// 不帶 auth header 的 API（專門拿來 refresh/logout）
export const apiNoAuth = axios.create({
  baseURL: Base + "/api",
  withCredentials: false,
});

// init header
const bootToken = getAccessToken();
if (bootToken) {
  api.defaults.headers.common["Authorization"] = `Bearer ${bootToken}`;
}

// request interceptor：每次送出前補 token
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// refresh single-flight queues
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}
function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function requestRefreshToken() {
  const rt = getRefreshToken();
  if (!rt) throw new Error("No refresh token");

  const res = await apiNoAuth.post("/auth/refresh", { refreshToken: rt });
  // backend 回 { message, token, refreshToken, user }
  const { token, refreshToken } = res.data as { token: string; refreshToken: string };
  return { token, refreshToken };
}

// response interceptor：401 自動續期
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (!original || status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const url = original.url ?? "";
    // auth endpoints 不做 refresh 避免無限迴圈
    if (url.includes("/auth/signin") || url.includes("/auth/signup") || url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    original._retry = true;

    // 如果正在 refresh，排隊等新 token
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;

    try {
      const { token: newToken, refreshToken: newRT } = await requestRefreshToken();

      // 更新 storage + axios header
      saveTokenToStorage(newToken, newRT);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      onRefreshed(newToken);

      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newToken}`;

      return api(original);
    } catch (refreshErr) {
      // refresh 失敗：清 token，交給前端導回登入頁（或 UI 顯示）
      clearTokenFromStorage();
      delete api.defaults.headers.common["Authorization"];
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

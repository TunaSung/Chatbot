export const saveTokenToStorage = (token: string, refreshToken?: string) => {
  localStorage.setItem("token", token);
  localStorage.setItem("tokenSaveAt", Date.now().toString());
  if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
};

export const clearTokenFromStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("tokenSaveAt");
};

export const getAccessToken = () => localStorage.getItem("token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");

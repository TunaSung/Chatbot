export type SignUpResp = {
  message: string;
  user: Record<string, unknown>;
};

export type SignInResp = {
  message: string;
  token: string;
  refreshToken: string;
  user?: Record<string, unknown>;
};

export type RefreshTokenResp = {
  token: string;
};

export type ForgetPasswordResp = {
  message: string;
  refreshToken: string;
};

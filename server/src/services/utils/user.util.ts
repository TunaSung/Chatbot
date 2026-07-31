type PrivateUserFields = {
  password: string;
  refreshTokenHash: string | null;
};

export function omitPrivateUserFields<T extends PrivateUserFields>(
  user: T
): Omit<T, keyof PrivateUserFields> {
  const { password, refreshTokenHash, ...safeUser } = user;
  void password;
  void refreshTokenHash;
  return safeUser;
}

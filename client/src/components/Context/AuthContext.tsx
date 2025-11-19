import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { saveToken, clearToken } from "../../services/auth.service";
import { getConversations } from "../../services/chat.service";
import type { Conversation } from "../../types/chat.type";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  conv: Conversation[] | [];
  refreshConvs: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [conv, setConv] = useState<Conversation[]>([]);

  const refreshConvs = useCallback(async () => {
    try {
      const res = await getConversations(); // { message, convs }
      setConv(res.convs || []);
      console.log("fetch conversation success");
    } catch (error) {
      console.log("fetch conversation failed");
    }
  }, []);

  useEffect(() => {
    const fetchConv = async () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);

      if (!token) return;

      await refreshConvs();
    };
    fetchConv();
  }, [refreshConvs]);

  const login = useCallback(
    async (token: string) => {
      saveToken(token);
      setIsAuthenticated(true);
      await refreshConvs();
    },
    [refreshConvs]
  );

  const logout = useCallback(async () => {
    clearToken();
    setIsAuthenticated(false);
    setConv([]);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      login,
      logout,
      conv,
      refreshConvs,
    }),
    [isAuthenticated, login, logout, conv, refreshConvs]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

import { User } from "../types/user.interface";
import {
  login as loginFunction,
  logout as logoutFunction,
  register as registerFunction,
  verify2FA,
} from "../api/auth";
import { fetchUserMe } from "../api/user";
import { RegisterInfo } from "../types/registration-form";
import { LoginResponse } from "../types/loginResponse";

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  register: (data: RegisterInfo) => Promise<User>;
  twoFactorAuthenticate: (challengeId: string, code: string) => Promise<User>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await fetchUserMe();
        setUser(me);
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await loginFunction({ email, password });

    if (!response.requires2fa) {
      setUser(response.user);
    }
    return response;

  };

  const register = async (data: RegisterInfo) => {
    const response = await registerFunction(data);

    setUser(response.user);
    return response.user;
  };

  const logout = async () => {
    await logoutFunction();
    setUser(null);
  };


  const twoFactorAuthenticate = async (challengeId: string, code: string) => {
    const response = await verify2FA(challengeId, code);
    setUser(response);
    return response;
  };

  return (
    <UserContext.Provider
      value={{
        setUser,
        isLoading,
        user,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        twoFactorAuthenticate
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

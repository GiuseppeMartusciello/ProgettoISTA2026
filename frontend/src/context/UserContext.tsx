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
} from "../api/auth";
import { fetchUserMe } from "../api/user";
import { RegisterInfo } from "../types/registration-form";

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (data: RegisterInfo) => Promise<User>;
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
    const user = await loginFunction({ email, password });

    setUser(user);
    return user;
  };

  const register = async (data: RegisterInfo) => {
    const user = await registerFunction(data);

    setUser(user);
    return user;
  };

  const logout = async () => {
    await logoutFunction();
    setUser(null);
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

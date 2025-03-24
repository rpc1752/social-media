// TypeScript declarations for the useAuth hook
import { User } from "firebase/auth";

export interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<User>;
  logout: () => Promise<void>;
  error: string;
  loading: boolean;
}

export const useAuth: () => AuthContextType;

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element;

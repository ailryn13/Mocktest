"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface User {
  name: string;
  email: string;
  role: string;
  token: string;
  departmentId?: number;
  departmentName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("userName");
    const role = localStorage.getItem("userRole");
    const email = localStorage.getItem("userEmail") ?? "";
    const departmentId = localStorage.getItem("userDepartmentId");
    const departmentName = localStorage.getItem("userDepartmentName");

    if (token && name && role) {
      setUser({ 
        token, 
        name, 
        email, 
        role,
        departmentId: departmentId ? Number(departmentId) : undefined,
        departmentName: departmentName || undefined
      });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch<{ 
      token: string; 
      roles: string[]; 
      fullName: string;
      departmentId?: number;
      departmentName?: string;
    }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );

    // Extract primary role from roles array
    const primaryRole = data.roles && data.roles.length > 0 ? data.roles[0] : "STUDENT";

    localStorage.setItem("token", data.token);
    localStorage.setItem("userName", data.fullName);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userRole", primaryRole);
    if (data.departmentId) localStorage.setItem("userDepartmentId", data.departmentId.toString());
    if (data.departmentName) localStorage.setItem("userDepartmentName", data.departmentName);

    const loggedInUser: User = {
      token: data.token,
      name: data.fullName,
      email,
      role: primaryRole,
      departmentId: data.departmentId,
      departmentName: data.departmentName,
    };
    setUser(loggedInUser);

    // Redirect based on role (Case insensitive + support MODERATOR fallback)
    const roleUpper = primaryRole.toUpperCase();
    
    if (roleUpper === "SUPER_ADMIN") {
      router.push("/super-admin");
    } else if (roleUpper === "ADMIN") {
      router.push("/admin");
    } else if (roleUpper === "MEDIATOR" || roleUpper === "MODERATOR") {
      router.push("/mediator");
    } else if (roleUpper === "STUDENT") {
      router.push("/student");
    } else {
      router.push("/");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userDepartmentId");
    localStorage.removeItem("userDepartmentName");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, verifyFlowAccess } from "../lib/authService";

interface AuthContextType {
  user: AuthUser | null;
  isUnlocked: boolean;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = "solarithm_flow_auth_session";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored) as AuthUser;
        }
      } catch (err) {
        console.warn("Failed reading auth session from storage", err);
      }
    }
    return null;
  });

  const isUnlocked = user !== null;

  const login = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const res = await verifyFlowAccess(email);
    if (res.authorized && res.user) {
      setUser(res.user);
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(res.user));
      } catch (e) {
        console.warn("Failed saving auth session", e);
      }
      return { success: true };
    }

    return {
      success: false,
      error: res.error || "Access Denied: Admin or Owner clearance required.",
    };
  };

  const logout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.warn("Failed removing auth session", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isUnlocked, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      isUnlocked: true,
      login: async () => ({ success: false, error: "Auth provider not initialized" }),
      logout: () => {},
    };
  }
  return context;
}

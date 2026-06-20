import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  subscribeToAuthChanges,
  getCurrentUserProfile,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (authUser) => {
      setAuthUser(authUser);

      if (!authUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
        setError(null);
      } catch (err) {
        console.error("Failed to refresh user profile:", err);
        setUserProfile(null);
        setError(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (!authUser) {
      setUserProfile(null);
      return null;
    }

    try {
      const profile = await getCurrentUserProfile();
      setUserProfile(profile);
      return profile;
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
      return null;
    }
  };

  const value = useMemo(
    () => ({
      authUser,
      userProfile,
      loading,
      error,
      setError,
      setUserProfile,
      refreshUserProfile,
    }),
    [authUser, userProfile, loading, error]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

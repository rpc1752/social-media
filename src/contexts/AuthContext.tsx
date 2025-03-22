import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { AuthContextType, User } from "../types";

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            // If the user document doesn't exist, create it
            const userData: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName:
                firebaseUser.displayName || firebaseUser.email!.split("@")[0],
              photoURL: firebaseUser.photoURL || undefined,
            };
            await setDoc(doc(db, "users", firebaseUser.uid), userData);
            setUser(userData);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error in auth state change:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      setError(null);
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName,
        photoURL: firebaseUser.photoURL || undefined,
      };
      await setDoc(doc(db, "users", firebaseUser.uid), userData);
      setUser(userData);
    } catch (err) {
      console.error("Error signing up:", err);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { user: firebaseUser } = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        setUser(userDoc.data() as User);
      }
    } catch (err) {
      console.error("Error signing in:", err);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();

      // Add scopes for Google Sign-in
      provider.addScope("profile");
      provider.addScope("email");
      provider.addScope("openid");

      // Force account selection even when one account is available
      provider.setCustomParameters({
        prompt: "select_account",
      });

      console.log("Starting Google Sign-in...");
      console.log("Firebase Config:", {
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 8) + "...",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      });

      // Verify Firebase Auth is initialized
      if (!auth) {
        throw new Error("Firebase Auth is not initialized");
      }

      // Verify Google provider is available
      if (!GoogleAuthProvider) {
        throw new Error("Google Auth Provider is not available");
      }

      const result = await signInWithPopup(auth, provider);
      console.log("Google Sign-in successful:", result.user);

      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      if (!userDoc.exists()) {
        const userData: User = {
          uid: result.user.uid,
          email: result.user.email!,
          displayName: result.user.displayName!,
          photoURL: result.user.photoURL || undefined,
        };
        await setDoc(doc(db, "users", result.user.uid), userData);
        setUser(userData);
      } else {
        setUser(userDoc.data() as User);
      }
    } catch (err) {
      console.error("Error in Google Sign-in:", err);
      if (err instanceof Error) {
        // Handle specific error cases
        if (err.message.includes("popup-closed-by-user")) {
          setError("Sign-in cancelled. Please try again.");
        } else if (err.message.includes("configuration-not-found")) {
          const errorMessage = `Google Sign-in configuration error. Please verify:
1. Google Sign-in is enabled in Firebase Auth
2. OAuth consent screen is configured in Google Cloud Console
3. localhost is added to authorized domains
4. Identity Toolkit API is enabled
5. Project ID matches between Firebase and Google Cloud Console
Current Project ID: ${import.meta.env.VITE_FIREBASE_PROJECT_ID}`;
          setError(errorMessage);
          console.error(errorMessage);
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to sign in with Google. Please try again.");
      }
      throw err;
    }
  };

  const signOutUser = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Error signing out:", err);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signInWithGoogle,
    signUp,
    signOut: signOutUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

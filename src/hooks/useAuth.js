import { useState, useEffect, createContext, useContext } from "react";
import {
	onAuthStateChanged,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	updateProfile,
} from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => {
	return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
	const [currentUser, setCurrentUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const signup = async (email, password, displayName) => {
		try {
			setError("");
			console.log("Attempting to create user with:", { email, displayName });

			// Step 1: Create user with Firebase Authentication
			let userCredential;
			try {
				userCredential = await createUserWithEmailAndPassword(
					auth,
					email,
					password
				);
				console.log("User created successfully:", userCredential.user.uid);
			} catch (err) {
				console.error("Error during user creation:", err.code, err.message);
				handleFirebaseAuthError(err);
				throw err;
			}

			// Step 2: Update profile with display name
			try {
				console.log("Updating profile with display name:", displayName);
				await updateProfile(userCredential.user, { displayName });
			} catch (err) {
				console.error("Error updating profile:", err);
				setError("Failed to update profile: " + err.message);
				// Continue despite this error as the user account is created
			}

			// Step 3: Create user document in Firestore
			try {
				console.log("Creating user document in Firestore");
				const userData = {
					displayName,
					email,
					photoURL: "",
					createdAt: serverTimestamp(),
					bio: "",
					userId: userCredential.user.uid,
				};

				await setDoc(doc(db, "users", userCredential.user.uid), userData);
				console.log("User document created successfully");
			} catch (err) {
				console.error("Error creating Firestore document:", err);
				setError(
					"Account created but profile data could not be saved. Please try logging in."
				);
				// Continue as the auth user is created, even if Firestore document fails
			}

			return userCredential.user;
		} catch (err) {
			console.error("Signup process failed:", err);
			// If no specific error was set, set a generic one
			if (!error) {
				setError("Failed to create account: " + err.message);
			}
			throw err;
		}
	};

	const handleFirebaseAuthError = (err) => {
		// Provide more user-friendly error messages
		if (err.code === "auth/email-already-in-use") {
			setError(
				"This email is already registered. Please try logging in instead."
			);
		} else if (err.code === "auth/invalid-email") {
			setError("The email address is not valid.");
		} else if (err.code === "auth/operation-not-allowed") {
			setError(
				"Email/password accounts are not enabled. Please contact support."
			);
		} else if (err.code === "auth/weak-password") {
			setError("The password is too weak. Please use a stronger password.");
		} else if (err.code === "auth/network-request-failed") {
			setError("Network error. Please check your internet connection.");
		} else {
			setError(`Failed to create account: ${err.message}`);
		}
	};

	const login = async (email, password) => {
		try {
			setError("");
			const userCredential = await signInWithEmailAndPassword(
				auth,
				email,
				password
			);
			return userCredential.user;
		} catch (err) {
			setError(err.message);
			throw err;
		}
	};

	const logout = () => {
		return signOut(auth);
	};

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				// Get user data from Firestore
				const docRef = doc(db, "users", user.uid);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					setCurrentUser({ ...user, ...docSnap.data() });
				} else {
					setCurrentUser(user);
				}
			} else {
				setCurrentUser(null);
			}
			setLoading(false);
		});

		return unsubscribe;
	}, []);

	const value = {
		currentUser,
		login,
		signup,
		logout,
		error,
		loading,
	};

	return (
		<AuthContext.Provider value={value}>
			{!loading && children}
		</AuthContext.Provider>
	);
};

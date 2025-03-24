// Simple test script to verify Firebase configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// This script can be used to test Firebase connectivity
const main = () => {
	try {
		// Log env variables for debugging
		console.log("API Key:", import.meta.env.VITE_FIREBASE_API_KEY);
		console.log("Auth Domain:", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
		console.log("Project ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);

		const firebaseConfig = {
			apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
			authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
			projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
			storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
			messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
			appId: import.meta.env.VITE_FIREBASE_APP_ID,
			measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
		};

		console.log("Initializing with config:", firebaseConfig);

		const app = initializeApp(firebaseConfig);
		const auth = getAuth(app);

		console.log("Firebase initialized successfully!", app.name);
		console.log("Auth instance:", !!auth);

		return { app, auth };
	} catch (error) {
		console.error("Firebase initialization failed:", error);
		throw error;
	}
};

// Export for use in browser console
window.testFirebase = main;

export default main;

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Check if all required environment variables are present
const requiredEnvVars = [
	"VITE_FIREBASE_API_KEY",
	"VITE_FIREBASE_AUTH_DOMAIN",
	"VITE_FIREBASE_PROJECT_ID",
	"VITE_FIREBASE_STORAGE_BUCKET",
	"VITE_FIREBASE_MESSAGING_SENDER_ID",
	"VITE_FIREBASE_APP_ID",
];

requiredEnvVars.forEach((varName) => {
	if (!import.meta.env[varName]) {
		console.error(`Missing required environment variable: ${varName}`);
	}
});

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase - fixed export structure
let auth, db, storage;

try {
	const app = initializeApp(firebaseConfig);
	auth = getAuth(app);
	db = getFirestore(app);
	storage = getStorage(app);

	// Enable local emulators for development if needed
	if (
		import.meta.env.DEV &&
		import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true"
	) {
		connectAuthEmulator(auth, "http://localhost:9099");
		connectFirestoreEmulator(db, "localhost", 8080);
		connectStorageEmulator(storage, "localhost", 9199);
		console.log("Using Firebase emulators for development");
	}

	console.log("Firebase initialized successfully");
} catch (error) {
	console.error("Error initializing Firebase:", error);
	throw error; // Re-throw to make the error visible
}

export { auth, db, storage };

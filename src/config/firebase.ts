import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if configuration is complete
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId ||
  !firebaseConfig.storageBucket ||
  !firebaseConfig.messagingSenderId ||
  !firebaseConfig.appId
) {
  console.error("Firebase Config is incomplete:", firebaseConfig);
  throw new Error(
    "Firebase configuration is incomplete. Please check your environment variables."
  );
}

console.log(
  "Firebase Config loaded successfully with project ID:",
  firebaseConfig.projectId
);
console.log("Storage bucket:", firebaseConfig.storageBucket);

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
console.log("Firebase app initialized successfully");

// Initialize services
const auth: Auth = getAuth(app);
auth.useDeviceLanguage(); // Set language to device/browser preference
console.log("Firebase auth initialized");

const db: Firestore = getFirestore(app);
console.log("Firestore initialized");

// Initialize storage with specific settings
const storage: FirebaseStorage = getStorage(app);
console.log("Firebase storage initialized");

export { auth, db, storage };

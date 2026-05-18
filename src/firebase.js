import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDPrulOdDNHzcP0dV5iHqeO4tZgIxLku6E",
  authDomain: "magen-dvorim-adom-5024e.firebaseapp.com",
  projectId: "magen-dvorim-adom-5024e",
  storageBucket: "magen-dvorim-adom-5024e.firebasestorage.app",
  messagingSenderId: "889209956809",
  appId: "1:889209956809:web:5ecdb8f966d455eb4ee018"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services 
export const auth = getAuth(app);
export const db = getFirestore(app);
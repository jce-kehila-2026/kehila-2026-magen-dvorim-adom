import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDPrulOdDNHzcP0dV5iHqeO4tZgIxLku6E",
  authDomain: "magen-dvorim-adom-5024e.firebaseapp.com",
  projectId: "magen-dvorim-adom-5024e",
  storageBucket: "magen-dvorim-adom-5024e.firebasestorage.app",
  messagingSenderId: "889209956809",
  appId: "1:889209956809:web:5ecdb8f966d455eb4ee018",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
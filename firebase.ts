
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCjGbHbOEgwc0y_vWuhWpvezsTEmIAXGus",
  authDomain: "studypilot-3f762.firebaseapp.com",
  projectId: "studypilot-3f762",
  storageBucket: "studypilot-3f762.firebasestorage.app",
  messagingSenderId: "70964590610",
  appId: "1:70964590610:web:af3712daa977f589cd80cb",
  measurementId: "G-4BGYM8589V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

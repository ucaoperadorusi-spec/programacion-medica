import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAqGVwfj4OARdq6klc9-JesZyZ4TWrnav4",
  authDomain: "h-ii-pucallpa.firebaseapp.com",
  projectId: "h-ii-pucallpa",
  storageBucket: "h-ii-pucallpa.firebasestorage.app",
  messagingSenderId: "986111583818",
  appId: "1:986111583818:web:14fa7e8800ddd036a328b3",
  measurementId: "G-N6C72652EP"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;git push origin main
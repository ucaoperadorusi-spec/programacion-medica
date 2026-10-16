import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAQCN6GCzkiTeAxpN6_FiSbOXaVBQEQFSo",
  authDomain: "programacion-medica-81784.firebaseapp.com",
  projectId: "programacion-medica-81784",
  storageBucket: "programacion-medica-81784.firebasestorage.app",
  messagingSenderId: "95989179251",
  appId: "1:95989179251:web:4b679e190392c3b26a9b06",
  measurementId: "G-N002Z8THS7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
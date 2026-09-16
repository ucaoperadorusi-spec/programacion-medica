import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAQcN6GCzkiTeAxpN6_FiSbOXaVBQEQfSo",
  authDomain: "programacion-medica-81784.firebaseapp.com",
  projectId: "programacion-medica-81784",
  storageBucket: "programacion-medica-81784.firebasestorage.app",
  messagingSenderId: "95989179251",
  appId: "1:95989179251:web:4b679e190392c3b26a9b06",
  measurementId: "G-N002Z8THS7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
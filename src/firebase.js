import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCZr03yDPTPhWQrHfV9m9FUNNTLQCmJrE",
  authDomain: "pro-emergencia.firebaseapp.com",
  projectId: "pro-emergencia",
  storageBucket: "pro-emergencia.firebasestorage.app",
  messagingSenderId: "13096864397",
  appId: "1:13096864397:web:b42f1dc0c348f14e8f30c4",
  measurementId: "G-HKM6W88K6X"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
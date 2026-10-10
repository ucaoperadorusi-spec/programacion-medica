import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZr03yDPTPhWQrwHfV9m9FUNNTlQCmJrE",
  authDomain: "pro-emergencia.firebaseapp.com",
  projectId: "pro-emergencia",
  storageBucket: "pro-emergencia.firebasestorage.app",
  messagingSenderId: "13096864397",
  appId: "1:13096864397:web:150da13060c128d98f30c4",
  measurementId: "G-QJZ3TJWE03"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDcirEtrZe4Ckk_pQ93ZR3dECX_CzYGtDk",
  authDomain: "extremestudio.firebaseapp.com",
  projectId: "extremestudio",
  storageBucket: "extremestudio.firebasestorage.app",
  messagingSenderId: "655604641682",
  appId: "1:655604641682:web:6b2e9fe7ebc1014f98db4b",
  measurementId: "G-EEEJ4ZD7VS"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

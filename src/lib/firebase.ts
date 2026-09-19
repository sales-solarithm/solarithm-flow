// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration for Solarithm Flow / Salary Studio
export const firebaseConfig = {
  apiKey: "AIzaSyBMQYHq8sqI9eiDEqiImNAjiRrCuLJoTMQ",
  authDomain: "solarithm-master.firebaseapp.com",
  projectId: "solarithm-master",
  storageBucket: "solarithm-master.firebasestorage.app",
  messagingSenderId: "560851710395",
  appId: "1:560851710395:web:14f29e7ab994666870d49e"
};

// Initialize Firebase (safely reuse instance across hot reloads)
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore Database
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export default app;

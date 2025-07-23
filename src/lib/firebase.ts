// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "jobmatch-ai-m0vfq",
  appId: "1:683798418249:web:910f59bcc13c29505f4098",
  storageBucket: "jobmatch-ai-m0vfq.firebasestorage.app",
  apiKey: "AIzaSyCQJoZQ1hJp_jOhAIY9vG7dX_VLRgIduP8",
  authDomain: "jobmatch-ai-m0vfq.firebaseapp.com",
  messagingSenderId: "683798418249",
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };

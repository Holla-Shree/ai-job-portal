
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

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

// Enable offline persistence, but handle errors gracefully
if (typeof window !== 'undefined') {
    try {
        enableIndexedDbPersistence(db)
            .catch((err) => {
                if (err.code == 'failed-precondition') {
                    // Multiple tabs open, persistence can only be enabled
                    // in one tab at a a time.
                    console.warn('Firestore persistence failed: multiple tabs open.');
                } else if (err.code == 'unimplemented') {
                    // The current browser does not support all of the
                    // features required to enable persistence
                    console.warn('Firestore persistence not available in this browser.');
                }
            });
    } catch (e) {
        console.error("Error enabling Firestore persistence:", e);
    }
}


export { app, db };

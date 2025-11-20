
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "studio-8032858002-f6cbf",
  appId: "1:577729465600:web:50e627ef49874158d3b7e5",
  storageBucket: "studio-8032858002-f6cbf.firebasestorage.app",
  apiKey: "AIzaSyD1bdATBTBi-QJTP0j1pTbzO2342ogENws",
  authDomain: "studio-8032858002-f6cbf.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "577729465600",
  databaseURL: "https://budget-app-3dfc3-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// The Firebase Realtime Database SDK includes offline support by default.
// It automatically handles temporary network interruptions and resyncs data
// once connectivity is restored. No explicit `enablePersistence` call is needed here.



import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const baseConfig = {
  projectId: "studio-8032858002-f6cbf",
  appId: "1:577729465600:web:50e627ef49874158d3b7e5",
  apiKey: "AIzaSyD1bdATBTBi-QJTP0j1pTbzO2342ogENws",
  authDomain: "studio-8032858002-f6cbf.firebaseapp.com",
};

const SHARD_1_URL = "https://budget-app-3dfc3-default-rtdb.asia-southeast1.firebasedatabase.app";
// Fallback to exactly same URL if secondary isn't provided
const SHARD_2_URL = process.env.NEXT_PUBLIC_FIREBASE_DB_SHARD_2 || SHARD_1_URL; 

export function getDbForClient(clientId: string) {
    if (!clientId) clientId = "default-client";
    
    // Simple hashing based on first character to determine shard
    const shardIndex = clientId.charCodeAt(0) % 2; 
    const appName = `shard-${shardIndex}`;
    const dbUrl = shardIndex === 0 ? SHARD_1_URL : SHARD_2_URL;

    let app;
    const existingApps = getApps();
    if (!existingApps.some(a => a.name === appName)) {
        app = initializeApp({ ...baseConfig, databaseURL: dbUrl }, appName);
    } else {
        app = getApp(appName);
    }

    return getDatabase(app);
}

// Fallback for legacy imports where context isn't used
let defaultApp;
if (!getApps().length) {
    defaultApp = initializeApp({ ...baseConfig, databaseURL: SHARD_1_URL });
} else {
    defaultApp = getApp();
}
export const db = getDatabase(defaultApp);

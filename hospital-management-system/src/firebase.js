import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARB6QiHUBSdB327a3_hg5bRunbYQr7PGQ",
  authDomain: "hmsproject-df549.firebaseapp.com",
  projectId: "hmsproject-df549",
  storageBucket: "hmsproject-df549.firebasestorage.app",
  messagingSenderId: "508087560588",
  appId: "1:508087560588:web:0adb6d5de06257ab864ea9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);


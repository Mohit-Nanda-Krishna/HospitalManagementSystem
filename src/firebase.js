import { deleteApp, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  setPersistence,
  signOut,
} from "firebase/auth";
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
export { firebaseConfig };

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Failed to enable Firebase auth persistence", error);
});

export async function createDoctorAuthAccount(email, password) {
  const secondaryApp = initializeApp(firebaseConfig, `doctor-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password
    );

    await signOut(secondaryAuth);
    return credential.user;
  } finally {
    await deleteApp(secondaryApp);
  }
}


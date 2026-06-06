import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDJOVd5643h_uTIDfm3ClGpddUG16P948",
  authDomain: "pro-bolso.firebaseapp.com",
  projectId: "pro-bolso",
  storageBucket: "pro-bolso.firebasestorage.app",
  messagingSenderId: "583418514687",
  appId: "1:583418514687:web:a0419c574ea9deddff10ca",
  measurementId: "G-WSCTS9YKH0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

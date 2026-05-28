import { initializeApp } from "firebase/app";
import {
  getDatabase,
  get,
  onValue,
  push,
  ref as databaseRef,
  remove,
  serverTimestamp,
  set,
  update
} from "firebase/database";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref as storageReference,
  uploadBytes
} from "firebase/storage";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

// Cole aqui as credenciais do projeto Firebase antes de publicar.
export const firebaseConfig = {
  apiKey: "AIzaSyB9lnc5c2_pusV_I8wDhxqkER87-Y10JYc",
  authDomain: "missao-5s.firebaseapp.com",
  databaseURL: "https://missao-5s-default-rtdb.firebaseio.com",
  projectId: "missao-5s",
  storageBucket: "missao-5s.firebasestorage.app",
  messagingSenderId: "77611909008",
  appId: "1:77611909008:web:cc87fbbe2a76d0a6e5c32d",
  measurementId: "G-3TK8S594J"
};

const requiredConfigKeys = [
  "apiKey",
  "authDomain",
  "databaseURL",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId"
];

export function isFirebaseConfigured() {
  return requiredConfigKeys.every((key) => String(firebaseConfig[key] || "").trim().length > 0);
}

export const app = isFirebaseConfigured() ? initializeApp(firebaseConfig) : null;
export const db = app ? getDatabase(app) : null;
export const storage = app ? getStorage(app) : null;
export const auth = app ? getAuth(app) : null;

export {
  databaseRef as ref,
  deleteObject,
  get,
  getDownloadURL,
  onAuthStateChanged,
  onValue,
  push,
  remove,
  serverTimestamp,
  set,
  signInWithEmailAndPassword,
  signOut,
  storageReference as storageRef,
  update,
  uploadBytes
};

import { auth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "../firebase.js";

export function watchAdminAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export async function loginAdmin(email, password) {
  if (!auth) {
    throw new Error("Firebase ainda não configurado.");
  }

  return signInWithEmailAndPassword(auth, email, password);
}

export async function logoutAdmin() {
  if (!auth) {
    return;
  }

  await signOut(auth);
}

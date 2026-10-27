// Firebase client configuration. Web config is public by design; secure data with Firestore Rules.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC1w8tUDW6XTfkPceprjj1kJed9CM5r6YA",
  authDomain: "enitan-collection-7e541.firebaseapp.com",
  projectId: "enitan-collection-7e541",
  storageBucket: "enitan-collection-7e541.firebasestorage.app",
  messagingSenderId: "652278502258",
  appId: "1:652278502258:web:7e3058b2f96570c728c3eb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export { app, auth, db };

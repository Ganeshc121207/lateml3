import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDzS7Buy0KNn2PYALbuChKzcokZPDdmWAY",
  authDomain: "mathlearn-46684.firebaseapp.com",
  projectId: "mathlearn-46684",
  storageBucket: "mathlearn-46684.firebasestorage.app",
  messagingSenderId: "124644359976",
  appId: "1:124644359976:web:26ce5e87c1adf69acc5a1d",
  measurementId: "G-RR483LP55F"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
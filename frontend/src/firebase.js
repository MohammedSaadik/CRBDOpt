import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDZyXaXp2-mzcIK-3VcODF4ra3tnqjXfwM",
    authDomain: "crbdopti.firebaseapp.com",
    projectId: "crbdopti",
    storageBucket: "crbdopti.firebasestorage.app",
    messagingSenderId: "115672731395",
    appId: "1:115672731395:web:ebbef8be65845b09532336",
    measurementId: "G-8D6LN79JKT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, analytics };

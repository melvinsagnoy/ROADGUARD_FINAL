import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';  // Import for Realtime Database

const firebaseConfig = {
  apiKey: "AIzaSyCWONfxbxfZNYY7dhidjXlMinotfwP3spk",
  authDomain: "languard-18ec2.firebaseapp.com",
  projectId: "languard-18ec2",
  storageBucket: "languard-18ec2.appspot.com",
  messagingSenderId: "423510387855",
  appId: "1:423510387855:web:3da7651ab53807779fd4fa",
  measurementId: "G-QXPE8MN55Q",
  databaseURL: "https://languard-18ec2-default-rtdb.firebaseio.com",  // Realtime Database URL
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with Async Storage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const firestore = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Initialize Realtime Database
const database = getDatabase(app);

export { auth, firestore, storage, database };
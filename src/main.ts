import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9DwJc8CHgKeko0S_1IRHAiovxn0OR3Fs",
  authDomain: "id3-audio-converter.firebaseapp.com",
  projectId: "id3-audio-converter",
  storageBucket: "id3-audio-converter.appspot.com",
  messagingSenderId: "452887383340",
  appId: "1:452887383340:web:8198f4c2683ef372377089",
  measurementId: "G-H4BSGJDH6N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);

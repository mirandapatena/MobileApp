import firebase from "@firebase/app";
import "@firebase/auth";
import "@firebase/database";
import "@firebase/storage"

var config = {
  apiKey: "AIzaSyBgzYBdUhkg4o-015KSPN0BYX9YrctNdG0",
  authDomain: "emergencyresponsesystem-57dc4.firebaseapp.com",
  databaseURL: "https://emergencyresponsesystem-57dc4.firebaseio.com",
  projectId: "emergencyresponsesystem-57dc4",
  storageBucket: "emergencyresponsesystem-57dc4.appspot.com",
  messagingSenderId: "583480520859"
};
let app = firebase.initializeApp(config);
export const db = app.database();
export const fire2 = firebase.initializeApp(config, 'Secondary');

export default app;
// export default app;

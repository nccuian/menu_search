const firebase = require('firebase');
require('firebase/firestore');

firebase.initializeApp({
  apiKey: 'AIzaSyBE-af-mUb5dAZgPHrpW24umM-I5ne4dWw',
  authDomain: 'menu-search-79bd9.firebaseapp.com',
  projectId: 'menu-search-79bd9'
});

// Initialize Cloud Firestore through Firebase
const db = firebase.firestore();

// Disable deprecated features
db.settings({
  timestampsInSnapshots: true
});

module.exports = db;
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAv69ST8kfulsnpKoB3Qv-d5tWvwE6s1sk",
  authDomain: "checkers-online-503ca.firebaseapp.com",
  databaseURL: "https://checkers-online-503ca-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "checkers-online-503ca",
  storageBucket: "checkers-online-503ca.appspot.com",
  messagingSenderId: "35572184263",
  appId: "1:35572184263:web:914b2908b9d398778d7ae2",
  measurementId: "G-WSLS7RSWKB"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app); 

const reviewForm = document.getElementById("reviewForm");
reviewForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const fullName = document.getElementById("fullName").value;
  const message = document.getElementById("message").value;
  const reviewId = Date.now().toString();
  set(ref(db, "reviews/" + reviewId), {
    fullName: fullName,
    message: message,
    createdAt: serverTimestamp()
  })
    .then(() => {
      alert("Отзыв отправлен!");
      reviewForm.reset();
    })
    .catch((error) => {
      console.error("Ошибка:", error);
      alert("Ошибка при отправке!");
    });
});


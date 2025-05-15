import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getDatabase, ref, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-database.js";

// Конфигурация Firebase (замените на свою!)
const firebaseConfig = {
  apiKey: "AIzaSyAv69ST8kfulsnpKoB3Qv-d5tWvwE6s1sk",
  authDomain: "checkers-online-503ca.firebaseapp.com",
  databaseURL: "https://checkers-online-503ca-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "checkers-online-503ca",
  storageBucket: "checkers-online-503ca.firebasestorage.app",
  messagingSenderId: "35572184263",
  appId: "1:35572184263:web:914b2908b9d398778d7ae2",
  measurementId: "G-WSLS7RSWKB"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Отправка формы
const reviewForm = document.getElementById("reviewForm");
reviewForm.addEventListener("submit", (e) => {
  e.preventDefault(); // Отменяем перезагрузку страницы

  const fullName = document.getElementById("fullName").value;
  const message = document.getElementById("message").value;

  // Генерируем уникальный ID для записи
  const reviewId = Date.now().toString();

  // Записываем данные в Firebase
  set(ref(db, "reviews/" + reviewId), {
    fullName: fullName,
    message: message,
    createdAt: serverTimestamp() // Дата и время на сервере
  })
    .then(() => {
      alert("Отзыв отправлен!");
      reviewForm.reset(); // Очищаем форму
    })
    .catch((error) => {
      console.error("Ошибка:", error);
      alert("Ошибка при отправке!");
    });
});
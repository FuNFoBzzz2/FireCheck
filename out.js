import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

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

const logoutBtn = document.getElementById('logout-btn');
logoutBtn.addEventListener('click', (e) => {
    const auth = getAuth();
    e.preventDefault();
    signOut(auth).then(() => {
        localStorage.clear();
        sessionStorage.clear();
        alert("Вы успешно вышли из системы");
        window.location.href = "./sign.html"; // Перенаправляем на страницу входа
    }).catch((error) => {
        // Произошла ошибка
        console.error("Ошибка при выходе:", error);
        alert("Не удалось выйти: " + error.message);
    });
});
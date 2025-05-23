import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
const auth = getAuth(app);
const db = getDatabase(app);

document.getElementById('submit-sign').addEventListener('click', async (event) => {
    event.preventDefault();
    const email = document.getElementById('mail').value;
    const password = document.getElementById('password').value;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Обновляем статус пользователя в базе данных
        await update(ref(db, 'users/' + user.uid), {
            Online: true,
        });
        // Сохраняем UID в localStorage
        localStorage.setItem('currentUserUID', user.uid);
        // Перенаправляем на домашнюю страницу
        window.location.href = "./home.html";
    } catch (error) {
        // Обработка ошибок авторизации
        let errorMessage;
        switch(error.code) {
            case 'auth/invalid-email':
                errorMessage = "Неверный формат email";
                break;
            case 'auth/user-not-found':
                errorMessage = "Пользователь не найден";
                break;
            case 'auth/wrong-password':
                errorMessage = "Неверный пароль";
                break;
            case 'auth/too-many-requests':
                errorMessage = "Слишком много попыток. Попробуйте позже";
                break;
            default:
                errorMessage = "Ошибка авторизации";
        }
        alert(errorMessage);
    }
});

// Проверка авторизации при загрузке страницы
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Если пользователь уже авторизован, перенаправляем на home.html
        window.location.href = "./home.html";
    }
});
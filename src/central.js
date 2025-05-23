import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, onDisconnect, onValue, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const auth = getAuth(app);

// Обработка выхода
document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});
async function handleLogout() {
    const user = auth.currentUser;
    if (user) {
        try {
            await update(ref(db, 'users/' + user.uid), {
                Online: false,
            });
            await signOut(auth);
            localStorage.removeItem('currentUserUID');
            window.location.href = "./sign.html";
        } catch (error) {
            alert("Ошибка при выходе: " + error.message);
        }
    }
}

// Проверяем состояние аутентификации
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = ref(db, 'users/' + user.uid);
        try {
            await update(userRef, {
                Online: true,
            });
            onDisconnect(userRef).update({
                Online: false,
            });
            await loadUserData(userRef);
        } catch (error) {
            console.error("Ошибка при обновлении статуса:", error);
        }
        
    }else {
            // Пользователь не авторизован - перенаправляем на страницу входа
            window.location.href = "./sign.html";
    }
});

async function loadUserData(userRef) {
    try {
        const snapshot = await get(userRef);
        const userData = snapshot.val();
    
        if (userData) {
            const nameElement = document.getElementById('TextName');
            const emailElement = document.getElementById('TextEmail');
            const statsElement = document.getElementById('TextWL');
            nameElement.textContent = userData.name || 'Не указано';
            if (userData.visible_mail) {
                emailElement.textContent = userData.email || 'Не указано';
            } else {
                const emailGroup = emailElement.closest('.form-group');
                emailGroup.style.display = 'none';
            }
            statsElement.textContent = `${userData.wins || 0} / ${userData.loses || 0}`;
        }
    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
    }
}
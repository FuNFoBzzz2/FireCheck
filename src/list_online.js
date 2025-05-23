// Инициализация Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onDisconnect, onValue, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// Функция для отслеживания онлайн пользователей
function trackOnlineUsers() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Пользователь вошел в систему
      const userRef = ref(db, 'onlineUsers/' + user.uid);
      // Установите пользователя как онлайн
      set(userRef, {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        lastActive: serverTimestamp()
      });
      // Удалите запись при отключении
      onDisconnect(userRef).remove();
    } else {
      // Анонимный вход (если нужно)
      signInAnonymously(auth);
    }
  });
    // Отслеживание всех онлайн пользователей
  const onlineUsersRef = ref(db, 'onlineUsers');
  onValue(onlineUsersRef, (snapshot) => {
    const users = snapshot.val() || {};
    updateOnlineUsersList(users);
  });
}
// Обновление списка онлайн пользователей в UI
function updateOnlineUsersList(users) {
  const usersList = document.getElementById('online-users-list');
  usersList.innerHTML = '';
  
  Object.keys(users).forEach(uid => {
    const user = users[uid];
    const userElement = document.createElement('div');
    userElement.textContent = user.displayName;
    usersList.appendChild(userElement);
  });
  // Обновляем счетчик
  document.getElementById('online-count').textContent = Object.keys(users).length;
}
// Инициализация при загрузке страницы
window.addEventListener('load', () => {
  trackOnlineUsers();
});
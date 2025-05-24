import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, remove, onDisconnect, onValue, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

document.getElementById('home-button').addEventListener('click', (e) => {
    e.preventDefault();
    handlegohome();
});
async function handlegohome(){
    const user = auth.currentUser;
    if (user) {
        try {
            window.location.href = "./home.html";
        } catch (error) {
            alert("Ошибка при выходе: " + error.message);
        }
    }
}
document.getElementById('del-button').addEventListener('click', (e) => {
    e.preventDefault();
    deleteAc();
});
async function deleteAc(){
    const user = auth.currentUser;
    if (!confirm('Вы уверены, что хотите удалить аккаунт? Все ваши данные будут безвозвратно удалены.')) {
        return;
    }
    const password = prompt('Для подтверждения удаления аккаунта введите ваш пароль:');
    if (!password) {
        return;
    }
    try {
        // Создаем credential для реавторизации
        const credential = EmailAuthProvider.credential(user.email, password);
        // Реавторизуем пользователя
        await reauthenticateWithCredential(user, credential);
        // Удаляем данные из Realtime Database
        const userRef = ref(db, 'users/' + user.uid);
        await remove(userRef);
        // Удаляем аккаунт из Authentication
        await deleteUser(user);
        // Перенаправляем на страницу входа
        alert('Ваш аккаунт был успешно удален.');
        window.location.href = './sign.html';
    } catch (error) {
        console.error('Ошибка при удалении аккаунта:', error);
    }
};
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
        if (snapshot.exists()) {
            const userData = snapshot.val();
            document.getElementById('TextName').value = userData.name || 'Не указано';
            document.getElementById('TextEmail').value = userData.email || 'Не указано';
            document.getElementById('mailVisible').checked = userData.mailVisible || true;
        }else {
            console.log("Данные пользователя не найдены");
        }
    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
    }
}
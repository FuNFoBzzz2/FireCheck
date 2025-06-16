import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, remove, onDisconnect, onValue, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
document.getElementById('button-save').addEventListener('click', (e) => {
    e.preventDefault();
    saveUser();
});
async function saveUser() {
    const user = auth.currentUser;
    if (!user) {
        alert("Пользователь не авторизован!");
        return;
    }
    const newName = document.getElementById('TextName').value;
    const newEmail = document.getElementById('TextEmail').value;
    const Pas1 = document.getElementById('pass-first').value;
    const Pas2 = document.getElementById('pass-second').value;
    const mailVisible = document.getElementById('mailVisible').checked;
    try {
        // Проверка имени
        if (newName.length < 3) {
            alert("Имя должно содержать не менее 3 символов!");
            return;
        }
        const emailChanged = newEmail.trim().toLowerCase() !== user.email?.trim().toLowerCase();
        const passwordChanged = Pas1 === Pas2 && Pas1.length >= 6;
        if (emailChanged || passwordChanged) {
            const password = prompt('Для подтверждения изменения аккаунта введите ваш пароль:');
            if (!password) return;
            try {
                const credential = EmailAuthProvider.credential(user.email, password);
                await reauthenticateWithCredential(user, credential);
            } catch (error) {
                alert("Неверный пароль! Изменения не сохранены.");
                return;
            }
            if (passwordChanged) {
                try {
                    await updatePassword(user, Pas1);
                    document.getElementById('pass-first').value = "";
                    document.getElementById('pass-second').value = "";
                    alert("Пароль успешно изменен!");
                } catch (error) {
                    alert("Ошибка при изменении пароля: " + error.message);
                    return;
                }
            }
            if (emailChanged) {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                    alert("Введите корректный email! Пример: user@example.com");
                    return;
                }
                try {
                    const signInMethods = await fetchSignInMethodsForEmail(auth, newEmail);
                    if (signInMethods.length > 0) {
                        alert("Этот email уже используется другим аккаунтом!");
                        return;
                    }
                    await updateEmail(user, newEmail);
                    await update(ref(db, 'users/' + user.uid), { email: newEmail });
                    alert("Email успешно изменен!");
                } catch (error) {
                    alert("Ошибка при изменении email: " + error.message);
                    return;
                }
            }
        }
        const updates = {
            name: newName,
            visible_mail: mailVisible
        };
        await update(ref(db, 'users/' + user.uid), updates);
        alert('Данные успешно сохранены!');
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert(`Ошибка: ${error.message}`);
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
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        const userRef = ref(db, 'users/' + user.uid);
        await onDisconnect(userRef).cancel();
        await deleteUser(user);
        await remove(userRef);
        alert('Ваш аккаунт был успешно удален.');
        window.location.href = './index.html';
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
        window.location.href = "./index.html";
    }
});

async function loadUserData(userRef) {
    try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const userData = snapshot.val();
            document.getElementById('TextName').value = userData.name || 'Не указано';
            document.getElementById('TextEmail').value = userData.email || 'Не указано';
            document.getElementById('mailVisible').checked = userData.visible_mail;
        }else {
            console.log("Данные пользователя не найдены");
        }
    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
    }
}
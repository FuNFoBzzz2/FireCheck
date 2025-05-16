import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const auth = getAuth();

const logoutBtn = document.getElementById('logout-btn');
logoutBtn.addEventListener('click', (e) => {
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
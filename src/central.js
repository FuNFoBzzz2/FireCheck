import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, remove, get, set, onDisconnect, onValue, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
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
let currentInvitationRef = null;

const settButton = document.getElementById('sett-button');
if (settButton) {
    if (settButton) {
    settButton.addEventListener('click', (e) => {
        e.preventDefault();
        handlegoset();
    });
}
}
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
}
async function handlegoset(){
    const user = auth.currentUser;
    if (user) {
        try {
            window.location.href = "./settings.html";
        } catch (error) {
            alert("Ошибка при выходе: " + error.message);
        }
    }
}

async function handleLogout() {
    const user = auth.currentUser;
    if (user) {
        try {
            await update(ref(db, 'users/' + user.uid), {
                Online: false,
            });
            await signOut(auth);
            localStorage.removeItem('currentUserUID');
            window.location.href = "./index.html";
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
            await checkInvitations(user);
            setupInvitationListener(user);
        } catch (error) {
            console.error("Ошибка при обновлении статуса:", error);
        }
        
    }else {
            // Пользователь не авторизован - перенаправляем на страницу входа
            window.location.href = "./index.html";
    }
});
function setupInvitationListener(user) {
    return onValue(ref(db, 'letter'), () => {
        checkInvitations(user);
    });
}
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
async function checkInvitations(user) {
    if (!user) return;
    const invitationsRef = ref(db, 'letter');
    const snapshot = await get(invitationsRef);
    const inviteContainer = document.querySelector('.invite-container');
    if (!snapshot.exists()) {
        inviteContainer.style.display = 'none';
        currentInvitationRef = null;
        return;
    }
    let hasInvitation = false;
    // Преобразуем snapshot в массив для обработки
    const invitations = [];
    snapshot.forEach((childSnapshot) => {
        invitations.push({
            key: childSnapshot.key,
            ...childSnapshot.val()
        });
    });
    for (const invitation of invitations) {
        if (invitation.to === user.uid) {
            hasInvitation = true;
            currentInvitationRef = ref(db, `letter/${invitation.key}`);
            try {
                const inviterRef = ref(db, `users/${invitation.from}`);
                const inviterSnapshot = await get(inviterRef);
                const inviterData = inviterSnapshot.val();
                if (inviterData) {
                    document.getElementById('Player_Name').textContent = inviterData.name || 'Без имени';
                    document.getElementById('Player_Email').textContent = 
                        inviterData.visible_mail ? (inviterData.email || 'Не указана') : 'Скрыта';
                    document.getElementById('Player_WL').textContent = 
                        `${inviterData.wins || 0} / ${inviterData.loses || 0}`;
                    document.getElementById('accept_play').onclick = async (e) => {
                        e.preventDefault();
                        try {
                        window.location.href = `./party`;
                        }catch (error) {
                            console.error("Ошибка при отклонении приглашения:", error);
                            alert("Не удалось отклонить приглашение");
                        }
                    };
                    const declineBtn = document.getElementById('button_delinvite');
                    declineBtn.replaceWith(declineBtn.cloneNode(true));
                    document.getElementById('button_delinvite').onclick = async (e) => {
                        e.preventDefault();
                        try {
                            await remove(currentInvitationRef);
                            inviteContainer.style.display = 'none';
                            currentInvitationRef = null;
                        } catch (error) {
                            console.error("Ошибка при отклонении приглашения:", error);
                            alert("Не удалось отклонить приглашение");
                        }
                    };
                }
            } catch (error) {
                console.error("Ошибка загрузки данных приглашающего:", error);
            }
            break; // Обрабатываем только первое найденное приглашение
        }
    }
    inviteContainer.style.display = hasInvitation ? 'block' : 'none';
}
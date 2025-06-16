import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, update, set, onDisconnect, onValue, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
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

async function loadOnlinePlayers() {
    const currentUser = auth.currentUser;
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
        const playersList = document.getElementById('players-list');
        const noPlayers = document.getElementById('no-players');
        playersList.innerHTML = '';
        const playersData = snapshot.val();
        let onlinePlayersCount = 0;
        
        for (const userId in playersData) {
            const player = playersData[userId];
            if (userId === currentUser.uid || !player.Online) continue;
            onlinePlayersCount++;
            
            const playerElement = document.createElement('div');
            playerElement.className = 'player-card';
            playerElement.innerHTML = `
                <div class="player-content">
                    <div class="list-group">
                        <div class="Image"></div>
                        <div class="greenfn"></div>
                        <div class="left-form">
                            <div class="form-group">
                                <label class="form-label">Имя</label>
                                <span class="form-value">${player.name || 'Без имени'}</span>
                            </div>
                            ${player.visible_mail ? `
                            <div class="form-group">
                                <label class="form-label">Электронная почта</label>
                                <span class="form-value">${player.email || 'Не указана'}</span>
                            </div>
                            ` : ''}
                            <div class="form-group">
                                <label class="form-label">Побед / Поражений</label>
                                <span class="form-value">${player.wins || 0} / ${player.loses || 0}</span>
                            </div>
                        </div>
                        <button class="invite-btn" data-user-id="${userId}">Пригласить</button>
                    </div>
                </div>
            `;
            playersList.appendChild(playerElement);
        }
        // Добавляем обработчики для всех кнопок приглашения
        document.querySelectorAll('.invite-btn').forEach(btn => {
            btn.addEventListener('click', sendInvitation);
        });
        if (onlinePlayersCount === 0) {
            noPlayers.style.display = 'block';
            playersList.innerHTML = '<div class="no-players-msg">Пользователей онлайн нет</div>';
        } else {
            noPlayers.style.display = 'none';
        }
    }, {
        onlyOnce: false
    });
}
async function sendInvitation(event) {
    const opponentId = event.target.getAttribute('data-user-id');
    const currentUser = auth.currentUser;
    if (!currentUser || !opponentId) return;
    try {
        // Создаем запись о приглашении
        const invitationRef = ref(db, `letter/`+opponentId);
        await set(invitationRef, {
            from: currentUser.uid,
            to: opponentId
        });
        const room = ref(db, `room/`+currentUser.uid);
        await set(room, {
                color: Math.random() < 0.5 ? 'white' : 'black',
                turn: "white",
                blackpiece: [],
                whitepiece: []
        });
        //alert('Приглашение отправлено!');
        window.location.href = "./party.html";
    } catch (error) {
        console.error("Ошибка при отправке приглашения:", error);
        alert('Не удалось отправить приглашение');
    }
}
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
            loadOnlinePlayers();
            await checkInvitations(user);
            setInterval(loadOnlinePlayers, 5000);
        } catch (error) {
            console.error("Ошибка при обновлении статуса:", error);
        }
    }else {
        window.location.href = "./index.html";
    }
});
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
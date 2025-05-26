import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, update, set, onDisconnect, onValue, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
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
let currentInvitationRef = null;

document.getElementById('leave').addEventListener('click', (e) => {
    e.preventDefault();
    handlegohome();
});

async function handlegohome(message = null) {
    const user = auth.currentUser;
    if (user) {
        try {
            if (currentInvitationRef) {
                await remove(currentInvitationRef);
            }
            if (message) {
                alert(message);
            }
            window.location.href = "./home.html";
        } catch (error) {
            alert("Ошибка при выходе: " + error.message);
        }
    } else {
        console.log("Пользователь не найден");
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
            writemodul(userRef);
            await checkInvitation(user);
            onValue(ref(db, 'letter'), (snapshot) => {
                if (!snapshot.exists()) {
                    handlegohome("Приглашение было отклонено другим игроком");
                    return;
                }
                let invitationExists = false;
                snapshot.forEach((childSnapshot) => {
                    const invitation = childSnapshot.val();
                    if (invitation.from === user.uid || invitation.to === user.uid) {
                        invitationExists = true;
                        currentInvitationRef = ref(db, `letter/${childSnapshot.key}`);
                    }
                });
                if (!invitationExists) {
                    handlegohome("Приглашение было отклонено другим игроком");
                }
            });
        } catch (error) {
            console.error("Ошибка при обновлении статуса:", error);
        }
    } else {
        window.location.href = "./sign.html";
    }
});
async function writemodul(userRef){
    try{
    const snapshot = await get(userRef);
    const userData = snapshot.val();
    document.getElementById('player_Name').textContent = userData.name;
    const emailElement = document.getElementById('player_Email')
    if(userData.visible_mail){
        emailElement.textContent = userData.email;
    } else{
        const emailGroup = emailElement.closest('.form-group');
        emailGroup.style.display = 'none';
    }
    document.getElementById('player_W/L').textContent = `${userData.wins} / ${userData.loses}`;
    }catch (error) {
        console.error("Ошибка загрузки данных пользователя:", error);
    }
}


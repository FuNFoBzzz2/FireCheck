import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onDisconnect, onValue, remove, serverTimestamp, query, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged, signInAnonymously, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

document.getElementById('submit-reg').addEventListener('click', async function(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('mail').value;
    const pas1 = document.getElementById('password-1').value;
    const pas2 = document.getElementById('password-2').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
        if(pas1.length>=6 && pas2.length>=6){
            if(pas1==pas2){
                if(name.length>=3){
                    try{
                        const signInMethods = await fetchSignInMethodsForEmail(auth, email);
                        if (signInMethods.length > 0) {
                            alert("Аккаунт с такой почтой уже существует!");
                            return;
                        }
                        const userCredential = await createUserWithEmailAndPassword(auth, email, pas1);
                        const user = userCredential.user;
                        await set(ref(db, 'users/' + user.uid), {
                            name: name,
                            email: email,
                            wins: 0,
                            loses: 0,
                            Online: true,
                            visible_mail: true
                        });
                        localStorage.setItem('currentUserUID', user.uid);
                        window.location.href = "./home.html";
                        alert("Аккаунт успешно создан");
                    } catch(error) {
                        alert(error.message);
                    };
                }else{
                    alert("Имя должо содержать не менее 3 символов!");
                }
            } else{
                alert("Пароли не совпадают!");
            }
        } else{
            alert("Пароль должен содержать не менее 6 символов!")
        } 
    }else{
        alert("Введите корректный email! Пример: user@example.com"); 
    }
});
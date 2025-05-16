import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/ui/6.0.1/firebase-ui-auth.js";

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


const submitreg = document.getElementById('submit-reg');
submitreg.addEventListener('click', function (event){
    event.preventDefault()
    const email = document.getElementById('mail').value;
    const pas1 = document.getElementById('password-1').value;
    const pas2 = document.getElementById('password-2').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
        if(pas1.length>6 || pas2.length>6){
            if(pas1==pas2){
                const auth = getAuth();
                createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    window.location.href = "./home.html";
                    alert("Creating Account");
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    alert(errorMessage);
                });
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
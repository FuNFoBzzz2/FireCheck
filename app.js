import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyAv69ST8kfulsnpKoB3Qv-d5tWvwE6s1sk",
    authDomain: "checkers-online-503ca.firebaseapp.com",
    databaseURL: "https://checkers-online-503ca-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "checkers-online-503ca",
    storageBucket: "checkers-online-503ca.firebasestorage.app",
    messagingSenderId: "35572184263",
    appId: "1:35572184263:web:914b2908b9d398778d7ae2",
    measurementId: "G-WSLS7RSWKB"
};

const app = initializeApp(firebaseConfig);

//import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-analytics.js";
//const analytics = getAnalytics(app);

// Проверяем, не блокируется ли Analytics перед инициализацией
if (typeof window.gtag === 'function') {
    import("https://www.gstatic.com/firebasejs/11.7.3/firebase-analytics.js")
        .then(({ getAnalytics }) => {
            const analytics = getAnalytics(app);
        })
        .catch(e => console.log("Analytics blocked:", e));
}
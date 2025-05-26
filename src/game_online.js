import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getDatabase, ref, get, update, set, onDisconnect, 
    onValue, remove, serverTimestamp, query, orderByChild, equalTo
    } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, onAuthStateChanged, signInAnonymously 
    } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
let gameRef = null;

const board = document.getElementById("board");
const rows = 8;
const cols = 8;
let selectedPiece = null;
let turn;
let turnmatch = "white";
let  blackpiece = [];
let  whitepiece = [];

document.getElementById('leave').addEventListener('click', (e) => {
    e.preventDefault();
    handlegohome();
});

async function handlegohome(message = null) {
    const user = auth.currentUser;
    if (user) {
        try {
            const invitationsRef = ref(db, 'letter');
            const snapshot = await get(invitationsRef);
            if (snapshot.exists()) {
                const deletePromises = [];
                snapshot.forEach((childSnapshot) => {
                    const invitation = childSnapshot.val();
                    if (invitation.from === user.uid) {
                        deletePromises.push(remove(ref(db, `letter/${childSnapshot.key}`)));
                    }
                });
                await Promise.all(deletePromises);
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
            // Только письмо
            
            const invitationsRef = ref(db, 'letter/'+user.uid);
            const invitgame = await get(invitationsRef);
            if (invitgame.exists()) {
                console.log("Письмо");
                const myInvitations = invitgame.val();
                gameRef = ref(db, `room/${myInvitations.from}`);
                await update(gameRef, {
                    oponent: user.uid
                });
                await remove(invitationsRef);
                setmadeoponent(myInvitations.from);
                setupGameListener(user);
                return;
            }
            // Комната 
            const gameRef1 = ref(db, `room/${user.uid}`);
            const gameSnapshot = await get(gameRef1);
            if (gameSnapshot.exists()) {
                console.log("Комната");
                const gamebase = gameSnapshot.val();
                //есть противника
                if (gamebase.oponent && gamebase.oponent !== "" && gamebase.oponent !== null) {
                    console.log("Есть противник");
                    gameRef = gameRef1;
                    setmadeoponent(gamebase.oponent);
                    setupGameListener(user);
                    return;
                } else {
                    console.log("Нет противника");
                    //нет противника
                    const opGroup = document.getElementById('oponent_class');
                    opGroup.style.display = 'none';

                    const allletterRef = ref(db, 'letter');
                    const alllettersSnapshot = await get(allletterRef);
                    //Есть письмо
                    if (alllettersSnapshot.exists()) {
                        console.log("Есть письмо");
                        let sendfil =false;
                        alllettersSnapshot.forEach((letterSnapshot) => {
                        const letterData = letterSnapshot.val();
                            if (letterData.from === user.uid) {
                                console.log("Скип");
                                return;
                            }
                        });
                        handlegohome("Выход: нет письма");
                    }else{
                        handlegohome("Приглашение было отклонено другим игроком: нет письма");
                    }
                }
            } else {
                console.log("Шиза");
                // Если комнаты нет
                setTimeout(async () => {
                    const allRoomsRef = ref(db, 'room');
                    const allRoomsSnapshot = await get(allRoomsRef);
                    if (allRoomsSnapshot.exists()) {
                        allRoomsSnapshot.forEach((roomSnapshot) => {
                            const roomData = roomSnapshot.val();
                            if (roomData.oponent === user.uid) {
                                // Нашли комнату где мы оппонент
                                gameRef = ref(db, `room/${roomSnapshot.key}`);
                                setmadeoponent(roomSnapshot.key);
                                setupGameListener(user);
                                return;
                            }
                        });
                    }
                    setmadeoponent(gamebase);
                    setupGameListener(user);
                }, 2000); // Даем 2 секунды на обработку приглашений
            }
        } catch (error) {
            console.error("Ошибка при обновлении статуса:", error);
        }
    } else {
        window.location.href = "./sign.html";
    }
});
async function setmadeoponent(opponentUid) {
    try {
        const opponentRef = ref(db, 'users/' + opponentUid);
        const snapshot = await get(opponentRef);
        if (snapshot.exists()) {
            const opponentData = snapshot.val();
            document.getElementById('op_Name').textContent = opponentData.name ;
            const opEmailElement = document.getElementById('op_Email');
            if (opponentData.visible_mail) {
                opEmailElement.textContent = opponentData.email || 'Не указано';
            } else {
                const emailGroup = opEmailElement.closest('.form-group');
                emailGroup.style.display = 'none';
            }
            document.getElementById('op_W/L').textContent = `${opponentData.wins || 0} / ${opponentData.loses || 0}`;
            const opGroup = document.getElementById('oponent_class');
            opGroup.style.display = 'block';
        } else {
            console.log("Данные оппонента не найдены");
        }
    } catch (error) {
        console.error("Ошибка при загрузке данных оппонента:", error);
    }
}
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
//Ш А Ш К И
 
function setupGameListener(user) {
    onValue(gameRef, (snapshot) => {
        const gameData = snapshot.val();
        if (!gameData) return;
        // Определяем цвет текущего игрока
        if(gameData.oponent==user.uid){
            turn = gameData.color === 'white' ? 'white' : 'black';
        }else{
            turn = gameData.color === 'white' ? 'black' : 'white';
            
        }
        turnmatch = gameData.turn;
        blackpiece = gameData.blackpiece || [];
        whitepiece = gameData.whitepiece || [];
        removedesk();
        if (blackpiece.length > 0 || whitepiece.length > 0) {
            collectboard();
        } else {
            initializeBoard();
            // Сохраняем начальное состояние в базу
            update(gameRef, {
                blackpiece: blackpiece,
                whitepiece: whitepiece
            });
        }
    });
}
    // Партия 

//Очищение доски
function removedesk(){
    const existcell = document.querySelectorAll('.cell');
    existcell.forEach(cell => {cell.parentElement.removeChild(cell);});
}
//Сборка доски
function collectboard(){
    //console.log("Your color is ", turn);
    if (turn === "white" ) {
        console.log("Сборка доски Белые");
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.classList.add((row + col) % 2 == 0 ? "white" : "black");
                cell.dataset.row = row;
                cell.dataset.col = col;
                const whitepi = whitepiece.find(([r, c, kg]) => r===row && c ===col)
                if(whitepi){
                    if(whitepi[2]=="false"){
                        addPiece(cell, "white", "false"); 
                    }else{addPiece(cell, "white", "true"); }
                }
                const blackpi = blackpiece.find(([r, c, kg]) => r===row && c ===col)
                if(blackpi){
                    if(blackpi[2]== "false"){
                        addPiece(cell, "black", "false"); 
                    }else{addPiece(cell, "black", "true");  }
                } 
                cell.addEventListener("click", onCellClick);
                board.appendChild(cell);
            } 
        }
    }
    else if(turn === "black"){
        console.log("Сборка доски Чёрные");
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.classList.add((row + col) % 2 == 0 ? "white" : "black");
                cell.dataset.row = row;
                cell.dataset.col = col;
                const whitePieces = whitepiece.find(([r, c, kg]) => ((rows-1)-row)===r && c ===((cols-1)-col))
                if(whitePieces){
                    if(whitePieces[2]=="false"){
                        addPiece(cell, "white", "false"); 
                    }else{addPiece(cell, "white", "true"); }
                }
                const blackPieces = blackpiece.find(([r, c, kg]) => r===((rows-1)-row) && c ===((cols-1)-col))
                if(blackPieces){
                    //console.log("blackpiece is read");
                    if(blackPieces[2]== "false"){
                        addPiece(cell, "black", "false"); 
                        //console.log("read good");
                    }else{addPiece(cell, "black", "true");  
                        //console.log("King read");
                    }
                } 
                cell.addEventListener("click", onCellClick);
                board.appendChild(cell);
            } 
        }
    }
}
//Создание доски
function initializeBoard() { 
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.classList.add((row + col) % 2 == 0 ? "white" : "black");
            cell.dataset.row = row;
            cell.dataset.col = col;
            if (turn === "white") {
                //console.log("Press w");
                if (row < 3 && (row + col) % 2 !== 0) {
                    addPiece(cell, "black", "false"); 
                    blackpiece.push([row, col]);
                } else if (row > 4 && (row + col) % 2 !== 0) {
                    addPiece(cell, "white", "false");
                    whitepiece.push([row, col]);
                }
            } 
            if (turn === "black") {
                //console.log("Press b");
                if (row < 3 && (row + col) % 2 !== 0) {
                    addPiece(cell, "white", "false");
                    whitepiece.push([row, col]);
                } else if (row > 4 && (row + col) % 2 !== 0) {
                    addPiece(cell, "black", "false");
                    blackpiece.push([row, col]);
                }
            }
        
            cell.addEventListener("click", onCellClick);
            board.appendChild(cell);
        }
    }
} 
//Добавление шашки
function addPiece(cell, color, kg) {
    const piece = document.createElement("div");
    piece.classList.add("piece", color);
    piece.dataset.color = color;
    if(kg==="false"){
        piece.dataset.king = "false";
    }else{
        piece.dataset.king = "true";
        piece.classList.add("king");
    }
    cell.appendChild(piece);
}
//Запись в позиций на доске
function PiecesPosition() {
    //console.log("Запись данных");
    blackpiece = [];
    whitepiece = [];
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const piece = cell.querySelector('.piece');
        if (piece) {
            const color = piece.dataset.color;
            if(turn ==="white"){
                if (color === 'black') {
                    if(piece.dataset.king=="false"){
                        blackpiece.push([row, col, "false"]);
                    }else{
                        //console.log("");
                        blackpiece.push([row, col, "true"]);
                    }
                } else if (color === 'white') {
                    if(piece.dataset.king=="false"){
                        whitepiece.push([row, col, "false"]);
                    }else{
                        whitepiece.push([row, col, "true"]);
                    }
                }
            } else if(turn ==="black"){
                if (color === 'black') {
                    if(piece.dataset.king=="false"){
                        blackpiece.push([(rows-1)-row, (cols-1)-col, "false"]);
                    }else{
                        blackpiece.push([(rows-1)-row, (cols-1)-col, "true"]);
                    }
                } else if (color === 'white') {
                    if(piece.dataset.king=="false"){
                        whitepiece.push([(rows-1)-row, (cols-1)-col, "false"]);
                    }else{
                        whitepiece.push([(rows-1)-row, (cols-1)-col, "true"]);
                    }
                }
            }
        }
    });
}
function onCellClick(e) {
    //console.log("Click"); 
    console.log("Ne proshlo", turnmatch ,"  - ==Match ", turn ,"  - ==turn "); 
    if(turnmatch==turn){
        //console.log("Yslovie", turnmatch ,"  - Match ", turn ,"  - turn "); 
    //removepoint()
    const cell = e.target.closest(".cell");
    if (!cell) return;
    const piece = cell.querySelector(".piece");
    if (selectedPiece && !piece) {
        const startRow = parseInt(selectedPiece.parentElement.dataset.row);
        const startCol = parseInt(selectedPiece.parentElement.dataset.col);

        const endRow = parseInt(cell.dataset.row);
        const endCol = parseInt(cell.dataset.col);
        if (selectedPiece.dataset.king == "false") {
            console.log(`Шашка выбрана`);
            if(canMoveRegular(selectedPiece, startRow, startCol, endRow, endCol, -1)){
                console.log(`Шашка ходит (${startRow}, ${startCol}) на (${endRow}, ${endCol})`);
                movePiece(selectedPiece, cell);
                selectedPiece = null;
            }
        } else {
            console.log(`Королева выбрана`);
            if(canMoveKing(selectedPiece, startRow, startCol, endRow, endCol)){
                console.log(`Королева ходит (${startRow}, ${startCol}) на (${endRow}, ${endCol})`);
                moveKing(selectedPiece, cell);
                selectedPiece = null;
            }
        }
    } 
    else if (piece && piece.dataset.color == turn) {
        if (checkAllPiece()) {
            if (possiblecapture(piece)) {
                if (piece.dataset.king == "false") {
                    selectedPiece = piece;
                    possiblemoves(selectedPiece, cell);
                } 
                else {
                    possiblemovesKing(piece);
                    selectedPiece = piece;
                }
            } 
        } else {
            if (piece.dataset.king == "false") {
                selectedPiece = piece;
                possiblemoves(selectedPiece, cell);
            } 
            else {
                possiblemovesKing(piece); 
                selectedPiece = piece;
            }
        }
    } 
}
}
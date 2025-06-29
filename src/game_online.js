import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getDatabase, ref, get, increment, update, set, onDisconnect, 
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
let roomListener = null;
let deletePromises = [];
let leaveListen = false;
let gameEnded = false;
document.getElementById('leave').addEventListener('click', async (e) => {
    e.preventDefault();
    console.log("Выход по кнопке");
    await handlegohome();
});
//Домой 
async function handlegohome(message = null) {
    // Проверяем, что игра еще не завершена
    if (typeof gameEnded !== 'undefined' && gameEnded) return;    
    const user = auth.currentUser;
    console.log("Выход");    
    if (user) {
        try {
            deletePromises = [];           
            if (!gameRef) {
                if (message) alert(message);
                window.location.href = "./home.html";
                return;
            }           
            const gamesnap = await get(gameRef);
            if (!gamesnap.exists()) {
                if (message) alert(message);
                window.location.href = "./home.html";
                return;
            }           
            const gameData = gamesnap.val();
            if (gameData && gameData.leave === 1) {
                gameEnded = true;
                leaveListen = true;
                console.log("Победа из-за выхода противника");
                if (!gameEnded) {
                    await update(ref(db, 'users/' + user.uid), {wins: increment(1)});
                    const opponentUid = gameData.oponent;
                    if (opponentUid) {
                        await update(ref(db, 'users/' + opponentUid), {loses: increment(1)});
                    }
                }               
                await remove(gameRef);               
                if (message) alert(message);
                window.location.href = "./home.html";
                return;
            }      
            // Если есть оппонент - спрашиваем подтверждение сдачи
            if (gameData && gameData.oponent) {
                const confirmSurrender = confirm('Вы уверены, что хотите сдаться?');                
                if (!confirmSurrender) {
                    return; // Отмена выхода
                }               
                gameEnded = true;
                leaveListen = true;
                const opponentUid = gameData.oponent;
                await update(ref(db, 'users/' + user.uid), {loses: increment(1)});
                await update(ref(db, 'users/' + opponentUid), {wins: increment(1)});
                await update(gameRef, {leave: 1});
                await new Promise(resolve => setTimeout(resolve, 500)); // Даем время на обновление
                await remove(gameRef);               
                if (message) alert(message);
                window.location.href = "./home.html";
                return;
            }
            const invitationsRef = ref(db, 'letter');
            const snapshot = await get(invitationsRef);            
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    if (childSnapshot.val().from === user.uid) {
                        deletePromises.push(remove(ref(db, `letter/${childSnapshot.key}`)));
                    }
                });
            }
            if (gameRef) {
                await remove(gameRef);
            }           
            // Ожидаем завершения всех удалений
            if (deletePromises.length > 0) {
                await Promise.all(deletePromises);
            }           
            if (message) {
                alert(message);
            }
            window.location.href = "./home.html";           
        } catch (error) {
            console.error("Ошибка при выходе:", error);
            alert("Ошибка при выходе: " + error.message);
        }
    } else {
        console.log("Пользователь не найден");
        window.location.href = "./index.html";
    }
}
let datop;
//Слушатель из БД
function setupRoomListener(user) {
    
    if (!gameRef) return;
    // Отписываемся от предыдущего слушателя, если он есть
    if (roomListener) {
        roomListener();
    }
    roomListener = onValue(gameRef, (snapshot) => {
        if(leaveListen){
            return;
        }
        const roomData = snapshot.val();
        datop = roomData;
        if (!roomData) {
            handlegohome("Комната была удалена");
            return;
        }
        if(roomData.leave==1){
            handlegohome("Противник сдался!");
            return;
        }
        // Обновляем состояние игры при изменениях
        if (roomData.oponent==user.uid) {
            setmadeoponent(gameRef.key);
            setupGameListener(user, roomData); // Обновляем состояние игры
        }else if (roomData.oponent) {
                    console.log("Есть противник");
                    setmadeoponent(roomData.oponent);
                    setupGameListener(user, roomData);
                }else {
            console.log("Ожидаем подключения оппонента...");
            document.getElementById('oponent_class').style.display = 'none';
        }
    }, {
        onlyOnce: false // Подписываемся на все изменения
    });
}
//Авторизационные параметры
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = ref(db, 'users/' + user.uid);
        try {
            await update(userRef, {
                Online: true,
            });
            onDisconnect(userRef).update({
                Online: false,
            }).then(async () => {
                if (!gameEnded && gameRef) {
                    const gameSnapshot = await get(gameRef);
                    if (gameSnapshot.exists()) {
                        const gameData = gameSnapshot.val();
                        if (gameData && gameData.oponent) {
                            const opponentUid = user.uid === gameData.oponent ? gameRef.key : gameData.oponent;                            
                            await update(ref(db, 'users/' + user.uid), {loses: increment(1)});
                            await update(ref(db, 'users/' + opponentUid), {wins: increment(1)});                           
                            gameEnded = true;
                            await remove(gameRef);
                        }
                    }
                }
            });
            writemodul(userRef);
            
            // проверка письма
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
                setupRoomListener(user);
                return;
            }
            // проверка своей комната 
            const gameRef1 = ref(db, `room/${user.uid}`);
            const gameSnapshot = await get(gameRef1);
            if (gameSnapshot.exists()) {
                console.log("Комната сущ");
                const gamebase = gameSnapshot.val();
                gameRef = gameRef1;
                setupRoomListener(user)
                } else {
                console.log("Подключённый");
                // если мы оппонент
                    const allRoomsRef = ref(db, 'room');
                    const allRoomsSnapshot = await get(allRoomsRef);
                    if (allRoomsSnapshot.exists()) {
                        allRoomsSnapshot.forEach((roomSnapshot) => {
                            const roomData = roomSnapshot.val();
                            if (roomData.oponent === user.uid) {
                                // Нашли комнату где мы оппонент
                                gameRef = ref(db, `room/${roomSnapshot.key}`);
                                setupRoomListener(user)
                                return;
                            }
                        });
                    }
            }
        } catch (error) {
            console.error("Ошибка при обновлении статуса:", error);
        }
    } else {
        window.location.href = "./index.html";
    }
});
//Модуль оппонента
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
//Модуль пользователя
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
let op;
//Слушатель New
function setupGameListener(user, gameData) {
    if (!gameData) return;
    
    // Определяем цвет текущего игрока
    turn = (user.uid === gameData.oponent) ? (gameData.color === 'white' ? 'black' : 'white') : gameData.color; 
    console.log("Цвет пользователя: ", turn);
    
    op = user.uid === gameData.oponent;
    turnmatch = gameData.turn;
    blackpiece = gameData.blackpiece || [];
    whitepiece = gameData.whitepiece || [];
    
    removedesk();
    
    if (blackpiece.length > 0 || whitepiece.length > 0) {
        console.log("Сборка доски из массива");
        collectboard(op);
    } else {
        console.log("Сборка доски с 0");
        initializeBoard();
        // Сохраняем начальное состояние в базу
        update(gameRef, {
            blackpiece: blackpiece,
            whitepiece: whitepiece,
            turn: turnmatch
        });
    }
}
// Партия 

//Очищение доски
function removedesk(){
    const existcell = document.querySelectorAll('.cell');
    existcell.forEach(cell => {cell.parentElement.removeChild(cell);});
}
//Сборка доски New
function collectboard(op) {
    if (!op) {
        console.log("Сборка доски пользователя цвета: ", turn);
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.classList.add((row + col) % 2 == 0 ? "white" : "black");
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const whitepi = whitepiece.find(([r, c, kg]) => r === row && c === col);
                if (whitepi) {
                    addPiece(cell, "white", whitepi[2]); 
                }
                
                const blackpi = blackpiece.find(([r, c, kg]) => r === row && c === col);
                if (blackpi) {
                    addPiece(cell, "black", blackpi[2]); 
                } 
                
                cell.addEventListener("click", onCellClick);
                board.appendChild(cell);
            } 
        }
    } else {
        console.log("Сборка доски оппонента с цветом: ", turn);
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.classList.add((row + col) % 2 == 0 ? "white" : "black");
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Для оппонента инвертируем только координаты, но не цвета шашек
                const whitePieces = whitepiece.find(([r, c, kg]) => r === (rows-1-row) && c === (cols-1-col));
                if (whitePieces) {
                    addPiece(cell, "white", whitePieces[2]); // Оставляем белый цвет
                }
                
                const blackPieces = blackpiece.find(([r, c, kg]) => r === (rows-1-row) && c === (cols-1-col));
                if (blackPieces) {
                    addPiece(cell, "black", blackPieces[2]); // Оставляем черный цвет
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
            const kg=false;
            if ((row + col) % 2 !== 0) { // Только черные клетки
                if (row < 3) { // Верхняя часть доски
                    if (turn === "white") {
                        addPiece(cell, "black", kg);
                        blackpiece.push([row, col, kg]);
                    } else {
                        addPiece(cell, "white", kg);
                        whitepiece.push([row, col, kg]);
                    }
                } 
                else if (row > 4) { // Нижняя часть доски
                    if (turn === "white") {
                        addPiece(cell, "white", kg);
                        whitepiece.push([row, col, kg]);
                    } else {
                        addPiece(cell, "black", kg);
                        blackpiece.push([row, col, kg]);
                    }
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
    if(!kg){
        piece.dataset.king = "false";
    }else{
        piece.dataset.king = "true";
        piece.classList.add("king");
    }
    cell.appendChild(piece);
}
//Запись в позиций на доске
function PiecesPosition(op) {
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
            if(!op){
                if (color === 'black') {
                    if(piece.dataset.king=="false"){
                        blackpiece.push([row, col, false]);
                    }else{
                        //console.log("");
                        blackpiece.push([row, col, true]);
                    }
                } else if (color === 'white') {
                    if(piece.dataset.king=="false"){
                        whitepiece.push([row, col, false]);
                    }else{
                        whitepiece.push([row, col, true]);
                    }
                }
            } else{
                if (color === 'black') {
                    if(piece.dataset.king=="false"){
                        blackpiece.push([(rows-1)-row, (cols-1)-col, false]);
                    }else{
                        blackpiece.push([(rows-1)-row, (cols-1)-col, true]);
                    }
                } else if (color === 'white') {
                    if(piece.dataset.king=="false"){
                        whitepiece.push([(rows-1)-row, (cols-1)-col, false]);
                    }else{
                        whitepiece.push([(rows-1)-row, (cols-1)-col, true]);
                    }
                }
            }
        }
    });
}
//Клик по доске (Дод)
function onCellClick(e) {
    console.log(turnmatch ,"  - ==цвет хода ", turn ,"  - ==цвет шашек"); 
    if (turnmatch !== turn) return;
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
            }
        } else {
            console.log(`Королева выбрана`);
            if(canMoveKing(selectedPiece, startRow, startCol, endRow, endCol)){
                console.log(`Королева ходит (${startRow}, ${startCol}) на (${endRow}, ${endCol})`);
                moveKing(selectedPiece, cell);
            }
        }
        return;
    } 
    if (piece && piece.dataset.color == turn) {
        if (checkAllPiece() || checkAllKings()) {
            const canCapture = piece.dataset.king === "false" ? possiblecapture(piece) : possibleKing(piece);
            if (canCapture) {
                selectedPiece = piece;
                if(piece.dataset.king === "false"){
                    possiblemoves(selectedPiece);
                } 
                else {
                    possiblemovesKing(piece)
                }
            } else {
                console.log("Вы должны выбрать фигуру, которая может брать");
                return;
            }
        } else {
            selectedPiece = piece;
            if (piece.dataset.king == "false") {
                possiblemoves(selectedPiece, cell);
            } 
            else {
                possiblemovesKing(piece); 
            }
        }
    } 
    
}
//проверка всех обычных шашек на взятие
function checkAllPiece() {
    const piece = document.querySelectorAll(`.piece[data-color="${turn}"]`);
    let canCapture = false;
    piece.forEach(piece => {
        const row = parseInt(piece.parentElement.dataset.row);
        const col = parseInt(piece.parentElement.dataset.col);
        for (let steprow of [-1, 1]) {
            for (let stepcol of [-1, 1]) {
                const newRow = row + steprow;
                const newCol = col + stepcol;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const cell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
                    const enemyPiece = cell.querySelector(".piece");
                    if (enemyPiece && enemyPiece.dataset.color != turn) {
                        const jumpRow = newRow + steprow;
                        const jumpCol = newCol + stepcol;
                        if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8) {
                            const jumpCell = document.querySelector(`.cell[data-row="${jumpRow}"][data-col="${jumpCol}"]`);
                            if (jumpCell && !jumpCell.querySelector(".piece")) {
                                canCapture = true; 
                                console.log(`Шашка на (${row}, ${col}) может захватить шашку на (${newRow}, ${newCol})`);
                            }
                        }
                    }
                }
            }
        }
    });
    return canCapture; 
}
//Проверка взятий для шашки
function possiblecapture(piece) {
    const Row = parseInt(piece.parentElement.dataset.row);
    const Col = parseInt(piece.parentElement.dataset.col);
    
    // Проверяем возможность захвата
    for (let steprow of [-2, 2]) { 
        for (let stepcol of [-2, 2]) { 
            const newRow = Row + steprow;
            const newCol = Col + stepcol;

            // Проверяем, находится ли новая клетка в пределах доски
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {     
                const Cell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
                const pieceCell = Cell.querySelector(".piece");

                // Проверяем, что целевая клетка пуста
                if (Cell && !pieceCell) { 
                    const middleRow = (Row + newRow) / 2;
                    const middleCol = (Col + newCol) / 2;
                    const middleCell = document.querySelector(`.cell[data-row="${middleRow}"][data-col="${middleCol}"]`);
                    const middlePiece = middleCell.querySelector(".piece");

                    // Проверяем, есть ли вражеская шашка в средней клетке
                    if (middlePiece && middlePiece.dataset.color !== piece.dataset.color) {
                        console.log(`Шашка (${Row}, ${Col}) съест шашку на (${newRow}, ${newCol})`);
                        return true;
                    }
                } 
            }   
        }
    }
    return false;
}
//Проверка определённого хода и взятия для шашки
function canMoveRegular(piece, startRow, startCol, endRow, endCol, direction) {
    if (Math.abs(endRow - startRow) == 1 &&
        Math.abs(endCol - startCol) == 1 &&
        endRow - startRow == direction) {
        //console.log('Верно');
        return true;
    }
    if (Math.abs(endRow - startRow) == 2 &&
        Math.abs(endCol - startCol) == 2 ){
            const middleRow = (startRow + endRow) / 2;
            const middleCol = (startCol + endCol) / 2;

            const middleCell = document.querySelector(`.cell[data-row="${middleRow}"][data-col="${middleCol}"]`);
            const middlePiece = middleCell.querySelector(".piece");
            if (middlePiece && middlePiece.dataset.color != turn) {
                return true;
            }
        }
    console.log('НЕ Верно ', startRow , " ", startCol, " ", endRow, " " ,endCol);
    return false;
    
}
//возможные ходы для шашки (точки)
function possiblemoves(piece){
    //дод
    removepoint();
    //console.log("Point");
    const Row = parseInt(piece.parentElement.dataset.row);
    const Col = parseInt(piece.parentElement.dataset.col);
    //const direction = piece.dataset.color == "white" ? -1 : 1;
    let enemyFound = false;
    for (let steprow of [-1, 1]) { 
        for (let stepcol of [-1, 1]) { 
            const newRow = Row + steprow;
            const newCol = Col + stepcol;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {     
                const Cell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
                const piece =Cell.querySelector(".piece");
                if(piece && piece.dataset.color!=turn){
                    const Cellpoint = document.querySelector(`.cell[data-row="${newRow+steprow}"][data-col="${newCol+stepcol}"]`);
                    if (Cellpoint && !Cellpoint.querySelector(".piece")){
                        enemyFound = true;
                        const point = document.createElement("div");
                        point.classList.add("point");
                        Cellpoint.appendChild(point);
                        continue
                    }
                } else if (Cell && !piece && newRow-Row ==-1 ) { 
                    const point = document.createElement("div");
                    point.classList.add("point");
                    Cell.appendChild(point);
                } 
            }   
        }
    }
    if (enemyFound){
        for (let stepi of [-1, 1]) {
            for (let stepj of [-1, 1]) {
                const centRow = Row + stepi;
                const centCol = Col + stepj;

                if (centRow >= 0 && centRow < 8 && centCol >= 0 && centCol < 8) {
                    const foundCell = document.querySelector(`.cell[data-row="${centRow}"][data-col="${centCol}"]`);
                    const foundPoints = foundCell.querySelectorAll('.point');
                    foundPoints.forEach(point => {
                        point.parentElement.removeChild(point);
                    });
                }
            }
        }
    }
}
//удаление точек
function removepoint(){
    const existingPoints = document.querySelectorAll('.point');
    existingPoints.forEach(point => {point.parentElement.removeChild(point);});
}
// Проверка всех Королей на взятия
function checkAllKings() {
    const kings = document.querySelectorAll(`.piece[data-color="${turn}"][data-king="true"]`);
    let canCapture = false;
    kings.forEach(king => {
        const row = parseInt(king.parentElement.dataset.row);
        const col = parseInt(king.parentElement.dataset.col);
        const directions = [
            { dr: 1, dc: 1 }, 
            { dr: -1, dc: 1 }, 
            { dr: 1, dc: -1 }, 
            { dr: -1, dc: -1 } 
        ];
        for (const dir of directions) {
            let foundEnemy = false;
            for (let step = 1; step < 8; step++) {
                const newRow = row + dir.dr * step;
                const newCol = col + dir.dc * step;
                if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
                const cell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
                const pieceInCell = cell.querySelector(".piece");
                if (!pieceInCell) {
                    if (foundEnemy) {
                        canCapture = true;
                        console.log(`Дамка на (${row}, ${col}) может взять шашку в направлении (${dir.dr}, ${dir.dc})`);
                        break;
                    }
                    continue;
                }
                if (pieceInCell.dataset.color === turn) break;
                if (pieceInCell.dataset.color !== turn && !foundEnemy) {
                    foundEnemy = true;
                    continue;
                }
                if (pieceInCell.dataset.color !== turn && foundEnemy) {
                    break; 
                }
            }
            if (canCapture) break;
        }
    });
    return canCapture;
}
//Проверка взятий для короны
function possibleKing(piece) {
    const Row = parseInt(piece.parentElement.dataset.row);
    const Col = parseInt(piece.parentElement.dataset.col);
    const mas = [
        { newa: 1, newb: 1 },
        { newa: -1, newb: 1 },
        { newa: 1, newb: -1 },
        { newa: -1, newb: -1 }];
    for (const combo of mas) {
        let foundEnemy = false;
        let foundEmptyAfterEnemy = false;
        const rowa = combo.newa;
        const colb = combo.newb;
        for (let a =1; a<7;a++){
            const newRow = Row + (rowa*a);
            const newCol = Col + (colb*a);
            if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;    
                const Cell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
                if (!Cell) break;
                const piece =Cell.querySelector(".piece");
                if (!piece) {
                    if (foundEnemy) {
                        return true;
                    }
                    continue;
                }
                if (piece.dataset.color === turn) break;
                if (piece.dataset.color !== turn) {
                    if (!foundEnemy) {
                    foundEnemy = true;
                    continue;
                } else {
                    break; 
                }
                }
            
        }
    }
    return false;
}
//Возможные ходы для короля (точки)
function possiblemovesKing(piece){
    removepoint();
    const Row = parseInt(piece.parentElement.dataset.row);
    const Col = parseInt(piece.parentElement.dataset.col);  
    let canCapture = false;
    const mas = [
        { newa: 1, newb: 1 },
        { newa: -1, newb: 1 },
        { newa: 1, newb: -1 },
        { newa: -1, newb: -1 }];
    for (const combo of mas) {
        const rowa = combo.newa;
        const colb = combo.newb;
        let foundEnemy = false;
        let foundEmptyAfterEnemy;
        // let skip = false; 
        for (let a =1; a<7;a++){
            //for (let b =0; b<7;b++){
            const newRow = Row + (rowa*a);
            const newCol = Col + (colb*a);
            //console.log("Новые переменные для шага" ,newRow, " ", newCol);
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {     
                const Cell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
                const piecenem =Cell.querySelector(".piece");
                if (!piecenem) {
                    if (foundEnemy) {
                        const point = document.createElement("div");
                        point.classList.add("point");
                        Cell.appendChild(point);
                        canCapture = true;
                    }
                    continue;                   
                }
                if(piecenem && piecenem.dataset.color!=turn && !foundEnemy){ 
                    foundEnemy = true;
                    continue;
                }
                if(piecenem && piecenem.dataset.color==turn){
                    break;
                } 
                if(piecenem && piecenem.dataset.color!=turn && foundEnemy){ 
                    break;
                }
            }
        }
    }
    if (!canCapture) {
        for (const combo of mas) {
            for (let step = 1; step < 7; step++) {
                const newRow = Row + combo.newa * step;
                const newCol = Col + combo.newb * step;
                
                if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
                
                const Cell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
                if (Cell.querySelector(".piece")) break;
                
                const point = document.createElement("div");
                point.classList.add("point");
                Cell.appendChild(point);
            }
        }
    }
}
//Проверка хода и взятия для Королевы
function canMoveKing(piece, startRow, startCol, endRow, endCol) {
    if (Math.abs(endRow - startRow) !== Math.abs(endCol - startCol)) {
        console.log("Ход по этой траектории невозможен");
        return false;
    }
    const rowDirection = endRow > startRow ? 1 : -1;
    const colDirection = endCol > startCol ? 1 : -1;
    let enemyCount = 0;
    let lastEnemyRow = -1;
    let lastEnemyCol = -1;
    for (let i = 1; i < Math.abs(endRow - startRow); i++) {
        const checkRow = startRow + i * rowDirection;
        const checkCol = startCol + i * colDirection;
        const cell = document.querySelector(`.cell[data-row="${checkRow}"][data-col="${checkCol}"]`);
        const pieceInCell = cell.querySelector(".piece");
        if (pieceInCell) {
            if (pieceInCell.dataset.color === turn) {
                return false;
            } else {
                enemyCount++;
                lastEnemyRow = checkRow;
                lastEnemyCol = checkCol; 
                if (enemyCount > 1) {
                    return false;
                }
            }
        }
    }
    const targetCell = document.querySelector(`.cell[data-row="${endRow}"][data-col="${endCol}"]`);
    if (targetCell.querySelector(".piece")) {
        return false;
    }
    if (enemyCount === 1) {
        const enemyToEndDistance = Math.max(
            Math.abs(endRow - lastEnemyRow),
            Math.abs(endCol - lastEnemyCol)
        );
        if (enemyToEndDistance < 1) {
            return false;
        }
    }
    if (enemyCount === 0 && possibleKing(piece)) {
        return false;
    }
    return true;
}
///asfd//sf
//Ход короля New
function moveKing(piece, targetCell) {
    const startRow = parseInt(piece.parentElement.dataset.row);
    const startCol = parseInt(piece.parentElement.dataset.col);
    const endRow = parseInt(targetCell.dataset.row);
    const endCol = parseInt(targetCell.dataset.col);
    
    removepoint();
    
    // Проверяем, можно ли сделать такой ход
    if (!canMoveKing(piece, startRow, startCol, endRow, endCol)) {
        console.log("Недопустимый ход для дамки");
        return;
    }
    
    const rowDir = endRow > startRow ? 1 : -1;
    const colDir = endCol > startCol ? 1 : -1;
    let capturedPiece = false;
    
    // Проверяем все клетки по пути
    for (let step = 1; step <= Math.abs(endRow - startRow); step++) {
        const currentRow = startRow + step * rowDir;
        const currentCol = startCol + step * colDir;
        
        // Пропускаем начальную и конечную клетки
        if (currentRow === startRow && currentCol === startCol) continue;
        if (currentRow === endRow && currentCol === endCol) continue;
        
        const currentCell = document.querySelector(`.cell[data-row="${currentRow}"][data-col="${currentCol}"]`);
        if (!currentCell) continue;
        
        const pieceInCell = currentCell.querySelector(".piece");
        if (pieceInCell) {
            if (pieceInCell.dataset.color === turn) {
                console.log("Нельзя перепрыгивать свои шашки");
                return;
            } else {
                currentCell.removeChild(pieceInCell);
                capturedPiece = true;
            }
        }
    }
    
    // Перемещаем дамку
    targetCell.appendChild(piece);
    
    // Проверяем, нужно ли продолжать взятие
    let mustContinueCapture = capturedPiece ? possibleKing(piece) : false;
    if (!mustContinueCapture) {
        selectedPiece = null;
        turnmatch = turnmatch === "white" ? "black" : "white";
        // Обновляем позиции и состояние игры
        PiecesPosition(op);
        update(gameRef, {
            blackpiece: blackpiece, 
            whitepiece: whitepiece, 
            turn: turnmatch
        });
    } else {
        selectedPiece = piece;
        possiblemovesKing(piece);
    }
    checkGameState();
}
//Ход шашки New
function movePiece(piece, targetCell) {
    const startRow = parseInt(piece.parentElement.dataset.row);
    const startCol = parseInt(piece.parentElement.dataset.col);
    const endRow = parseInt(targetCell.dataset.row);
    const endCol = parseInt(targetCell.dataset.col);
    removepoint();
    
    if (possiblecapture(piece)) {
        if (Math.abs(endRow - startRow) == 2 && Math.abs(endCol - startCol) == 2) {
            const middleCell = document.querySelector(`.cell[data-row="${(startRow + endRow) / 2}"][data-col="${(startCol + endCol) / 2}"]`);
            const middlePiece = middleCell.querySelector(".piece");
            middleCell.removeChild(middlePiece);
            targetCell.appendChild(piece);
            
            // Проверка на превращение в дамку с учетом цвета игрока
            if ((piece.dataset.color === "white" && endRow === 0) || 
                (piece.dataset.color === "black" && endRow === 0)) {
                piece.dataset.king = "true"; 
                piece.classList.add("king");
                console.log("Шашка превратилась в дамку");
            }
            
            if (piece.dataset.king === "true") {
                if (!possibleKing(piece)) {
                    selectedPiece = null;
                    turnmatch = turnmatch === "white" ? "black" : "white";
                }
            } else {
                if (!possiblecapture(piece)) {
                    selectedPiece = null;
                    turnmatch = turnmatch === "white" ? "black" : "white";
                } else {
                    selectedPiece = piece;
                    possiblemoves(piece);
                }
            }
        }
    } else {
        targetCell.appendChild(piece);
        
        // Проверка на превращение в дамку с учетом цвета игрока
        if ((piece.dataset.color === "white" && endRow === 0) || 
            (piece.dataset.color === "black" && endRow === 0)) {
            piece.dataset.king = "true";
            piece.classList.add("king");
            console.log("Шашка превратилась в дамку");
        }
        
        selectedPiece = null;
        turnmatch = turnmatch === "white" ? "black" : "white";
    }
    
    PiecesPosition(op);
    update(gameRef, {
        blackpiece: blackpiece, 
        whitepiece: whitepiece, 
        turn: turnmatch
    });
    checkGameState();
}
// Проверка завершения партии (Дод)
async function checkGameState() {
    if (gameEnded) return;
    let whiteCount = 0;
    let blackCount = 0;
    let whiteHasMoves = true;
    let blackHasMoves = true;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            const piece = cell.querySelector(".piece");
            if (piece) {
                if (piece.dataset.color === "white") {
                    whiteCount++;
                    if (!whiteHasMoves && hasValidMoves(piece)) {
                        whiteHasMoves = true;
                    }
                } else {
                    blackCount++;
                    if (!blackHasMoves && hasValidMoves(piece)) {
                        blackHasMoves = true;
                    }
                }
            }
        }
    }
    let winner = null;
    if (whiteCount === 0 || !whiteHasMoves) {
        alert("Чёрные выигрывают!");
        winner = "black";
    } else if (blackCount === 0 || !blackHasMoves) {
        alert("Белые выигрывают!");
        winner = "white";
    }
    if (winner) {
        try {
            gameEnded = true;
            const gameData = datop;
            if (!gameData || !gameData.oponent) return;
            const user = auth.currentUser;
            const opponentUid = datop.oponent === user.uid ? gameRef.key : datop.oponent;
            if (winner === turn) {
                await update(ref(db, `users/${user.uid}`), { wins: increment(1) });
                await update(ref(db, `users/${opponentUid}`), { loses: increment(1) });
            } else {
                await update(ref(db, `users/${user.uid}`), { loses: increment(1) });
                await update(ref(db, `users/${opponentUid}`), { wins: increment(1) });
            }
            await remove(gameRef);
            window.location.href = "./home.html";
        } catch (error) {
            console.error("Ошибка при обработке победы:", error);
            alert("Произошла ошибка при завершении игры");
        }
    }
}
function hasValidMoves(piece) {
    if (piece.dataset.king === "true") {
        return possibleKing(piece);
    } else {
        return possiblecapture(piece);
    }
}
//Удаление доски (Дод?)
function disableBoard() {
    document
      .querySelectorAll(".cell")
      .forEach((cell) => cell.removeEventListener("click", onCellClick));
}
PiecesPosition();
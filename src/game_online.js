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

document.getElementById('leave').addEventListener('click', async (e) => {
    e.preventDefault();
    console.log("Выход по кнопке");
    await handlegohome();
});
//Домой 
async function handlegohome(message = null) {
    const user = auth.currentUser;
    const leaveparam = true;
    console.log("Выход");
    if (user) {
        try {
            deletePromises = [];
            const gamesnap = await get(gameRef);
            if (!gamesnap.exists()) {
                if (message) alert(message);
                window.location.href = "./home.html";
                return;
            }
            const gameData = gamesnap.val();
            let shouldProcessExit = true;
            if(gameData && gameData.leave===1){
                leaveListen = true;
                console.log("Победа из-за выхода противника");
                await update(ref(db, 'users/' + user.uid), {wins: increment(1)});
                await remove(gameRef);
                shouldProcessExit = false;
            }
            if(shouldProcessExit){
                const invitationsRef = ref(db, 'letter');
                const snapshot = await get(invitationsRef);
                if (snapshot.exists()) {
                    snapshot.forEach((childSnapshot) => {
                        if (childSnapshot.val().from === user.uid) {
                            deletePromises.push(remove(ref(db, `letter/${childSnapshot.key}`)));
                            remove(gameRef);
                        }
                    });
                    //await Promise.all(deletePromises);
                }
                if(gameData.oponent){
                    if(confirm('Вы уверены, что хотите сдаться?')){
                        leaveListen = true;
                        await update(ref(db, 'users/' + user.uid), {loses: increment(1)});
                        await update(gameRef, {leave: 1});
                        await new Promise(resolve => setTimeout(resolve, 500));
                        await remove(gameRef);
                    }else {
                        return; 
                    }   
                }
                if (deletePromises.length > 0) {
                    await Promise.all(deletePromises);
                }
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
        window.location.href = "./sign.html";
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
 
function setupGameListener(user, gameData) {
        if (!gameData) return;
        // Определяем цвет текущего игрока
        // if(gameData.oponent==user.uid){
            // turn = gameData.color;
        turn = (user.uid === gameData.oponent) ? (gameData.color === 'white' ? 'black' : 'white') : gameData.color; 
        // }else{
        //     turn = gameData.color === 'white' ? 'black' : 'white';
        // }
        turnmatch = gameData.turn;
        blackpiece = gameData.blackpiece || [];
        whitepiece = gameData.whitepiece || [];
        removedesk();
        if (blackpiece.length > 0 || whitepiece.length > 0) {
            console.log("Сборка доски из массива");
            collectboard();
        } else {
            console.log("Сборка доски с 0");
            initializeBoard();
            // Сохраняем начальное состояние в базу
            update(gameRef, {
                blackpiece: blackpiece,
                whitepiece: whitepiece
            });
        }
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
    if (turn === "black" ) {
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
                    addPiece(cell, "white", whitepi[2]); 
                }
                const blackpi = blackpiece.find(([r, c, kg]) => r===row && c ===col)
                if(blackpi){
                    addPiece(cell, "black", blackpi[2]); 
                } 
                cell.addEventListener("click", onCellClick);
                board.appendChild(cell);
            } 
        }
    }
    else if(turn === "white"){
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
                    addPiece(cell, "white", whitePieces[2]); 
                }
                const blackPieces = blackpiece.find(([r, c, kg]) => r===((rows-1)-row) && c ===((cols-1)-col))
                if(blackPieces){
                    //console.log("blackpiece is read");
                    addPiece(cell, "black", blackPieces[2]);  
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
            if (turn === "white") {
                //console.log("Press w");
                if (row < 3 && (row + col) % 2 !== 0) {
                    addPiece(cell, "black", kg); 
                    blackpiece.push([row, col, kg]);
                } else if (row > 4 && (row + col) % 2 !== 0) {
                    addPiece(cell, "white", kg);
                    whitepiece.push([row, col, kg]);
                }
            } 
            if (turn === "black") {
                //console.log("Press b");
                if (row < 3 && (row + col) % 2 !== 0) {
                    addPiece(cell, "white", kg);
                    whitepiece.push([row, col, kg]);
                } else if (row > 4 && (row + col) % 2 !== 0) {
                    addPiece(cell, "black", kg);
                    blackpiece.push([row, col, kg]);
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
            } else if(turn ==="black"){
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
function onCellClick(e) {
    //console.log("Click"); 
    console.log(turnmatch ,"  - ==цвет хода ", turn ,"  - ==цвет шашек"); 
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
        const rowa = combo.newa;
        const colb = combo.newb;
        let enemypiece=0;
        for (let a =1; a<7;a++){
            const newRow = Row + (rowa*a);
            const newCol = Col + (colb*a);
            //console.log("Новые переменные для шага" ,newRow, " ", newCol);
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {     
                const Cell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
                const piece =Cell.querySelector(".piece");
                if(piece && piece.dataset.color!=turn){ 
                    // if(enemypiece==1){
                    //     break;
                    // }
                    //console.log("УЫР " ,(newRow+rowa), " ", (newCol+colb), " / ", (newRow), " ", (newCol)," ");
                    const Celler = document.querySelector(`.cell[data-row="${(newRow+rowa)}"][data-col="${(newCol+colb)}"]`);
                    let piecea = Celler.querySelector(".piece");
                    //Исправить
                    if(!piecea){
                        enemypiece = 1;
                        return true;
                    }                  
                }
                if(piece && piece.dataset.color==turn){
                    break;
                } 
                // const point = document.createElement("div");
                // point.classList.add("point");
                // Cell.appendChild(point);
                continue
            }
        }
    }
    return false;
}
//удаление точек
function removepoint(){
    const existingPoints = document.querySelectorAll('.point');
    existingPoints.forEach(point => {point.parentElement.removeChild(point);});
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
//Возможные ходы для короля (точки)
function possiblemovesKing(piece){
    removepoint();
    const Row = parseInt(piece.parentElement.dataset.row);
    const Col = parseInt(piece.parentElement.dataset.col);  
    let longenemy = 0;
    let enemyFound = false;
    const mas = [
        { newa: 1, newb: 1 },
        { newa: -1, newb: 1 },
        { newa: 1, newb: -1 },
        { newa: -1, newb: -1 }];
    for (const combo of mas) {
        const rowa = combo.newa;
        const colb = combo.newb;
        let enemypiece=0;
        // let skip = false; 
        for (let a =1; a<7;a++){
            //for (let b =0; b<7;b++){
            const newRow = Row + (rowa*a);
            const newCol = Col + (colb*a);
            //console.log("Новые переменные для шага" ,newRow, " ", newCol);
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {     
                const Cell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
                const piecenem =Cell.querySelector(".piece");
                if(piecenem && piecenem.dataset.color!=turn){ 
                    if(enemypiece==1){
                        break;
                    }
                    enemypiece = 1;
                    continue                        
                }
                if(piecenem && piecenem.dataset.color==turn){
                    break;
                } 
                const point = document.createElement("div");
                point.classList.add("point");
                Cell.appendChild(point);
                continue
            }
        }
    }
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

//Проверка хода и взятия для Королевы
function canMoveKing(piece, startRow, startCol, endRow, endCol) {
    const Cell = document.querySelector(`.cell[data-row="${endRow}"][data-col="${endCol}"]`);
    const point = Cell.querySelector(".point");
    let rowdir = 0;
    let coldir = 0;
    if (Cell.querySelector(".point")) {
        return true;
    }
    return false;
}
//Ход короля (Доделать)
function moveKing(piece, targetCell){
    const startRow = parseInt(piece.parentElement.dataset.row);
    const startCol = parseInt(piece.parentElement.dataset.col);
    const endRow = parseInt(targetCell.dataset.row);
    const endCol = parseInt(targetCell.dataset.col);
    //removepoint();
    const point = targetCell.querySelector(".point");
    let rowdir = 0;
    let coldir = 0;
    let war=0;
    if (point) {
        if(startRow>endRow){
            rowdir =-1;
        } else rowdir =1;
        if (startCol>endCol){
            coldir = -1
        } else coldir = 1;
        for(let i=1;i<7;i++){
            console.log(`Королева ходит (${startRow}, ${startCol}) на (${endRow}, ${endCol})`);
            const newRow = startRow + (rowdir*i);
            const newCol = startCol + (coldir*i);
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) { 
                console.log(`ESH`);  
                const Celldoc = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
                const piecego =Celldoc.querySelector(".piece");
                const pointgo =Celldoc.querySelector(".point");
                if(piecego && piecego.dataset.color!=turn){
                    Celldoc.removeChild(piecego);
                    war=1;
                }
                if(newRow==endRow && newCol==endCol){
                    console.log(`JR`);  
                    Celldoc.appendChild(piece);
                    if(!possibleKing(piece) && war==1){
                        removepoint();
                        console.log(`Удаление точек`);  
                    }else{
                        console.log(`123`);  
                        selectedPiece = null;
                        turn = turn == "white" ? "black" : "white";
                    }
                    checkGameState();
                    removepoint();
                    break;
                }  
                
            }
        }
    }
    PiecesPosition();
    update(gameRef, {
        blackpiece: blackpiece, 
        whitepiece: whitepiece, 
        turn: turnmatch
    });
    // socket.emit("movement", {
    //     blackpiece: blackpiece, 
    //     whitepiece: whitepiece, 
    //     turnmatch: turnmatch
    // });
    checkGameState();
}
//Ход шашки (Доделать)
function movePiece(piece, targetCell) {
    const startRow = parseInt(piece.parentElement.dataset.row);
    const startCol = parseInt(piece.parentElement.dataset.col);
    const endRow = parseInt(targetCell.dataset.row);
    const endCol = parseInt(targetCell.dataset.col);
    removepoint();
    if (possiblecapture(piece)){
        if (Math.abs(endRow - startRow) == 2 && Math.abs(endCol - startCol) == 2) {
            const middleCell = document.querySelector(`.cell[data-row="${(startRow + endRow) / 2}"][data-col="${(startCol + endCol) / 2}"]`);
            const middlePiece = middleCell.querySelector(".piece");
            middleCell.removeChild(middlePiece);
            targetCell.appendChild(piece);
            console.log("TEST color: ", piece.dataset.color , " row: ", endRow, " is King: ", piece.dataset.king);
            if ((endRow == 0) && piece.dataset.king == "false") { 
                piece.dataset.king = "true";
                piece.classList.add("king");
                console.log("King is true");
                //Доделать!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                if(!possibleKing(piece)){
                    selectedPiece = null;
                    turnmatch = turnmatch == "white" ? "black" : "white";
                }
            }
            else if(!possiblecapture(piece)){
                //possiblemoves(piece)
                selectedPiece = null;
                turnmatch = turnmatch == "white" ? "black" : "white";
            }
        } 
    }else {
        if (((piece.dataset.color == "white" && endRow == 0) ||
            (piece.dataset.color == "black" && endRow == 7)) && 
            piece.dataset.king == "false") {
            piece.dataset.king = "true";
            piece.classList.add("king");
            console.log("King is true");
        }
        console.log("FGSA");
        targetCell.appendChild(piece);
        selectedPiece = null;
        turnmatch = turnmatch == "white" ? "black" : "white";
    }
    PiecesPosition();
    update(gameRef, {
        blackpiece: blackpiece, 
        whitepiece: whitepiece, 
        turn: turnmatch
    });
    // socket.emit("movement", {
    //     blackpiece: blackpiece, 
    //     whitepiece: whitepiece, 
    //     turnmatch: turnmatch
    // });
    checkGameState();
    
}
function checkGameState() {
    let whiteCount = 0;
    let blackCount = 0;
    let whiteHasMoves = true;
    let blackHasMoves = true;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = document.querySelector(
          `.cell[data-row="${row}"][data-col="${col}"]`
        );
        const piece = cell.querySelector(".piece");
        if (piece) {
          if (piece.dataset.color === "white") {
            whiteCount++;
            if (!whiteHasMoves && hasValidMoves(piece)) {
              whiteHasMoves = true;
            }
          } else if (piece.dataset.color === "black") {
            blackCount++;
            if (!blackHasMoves && hasValidMoves(piece)) {
              blackHasMoves = true;
            }
          }
        }
      }
    }
    if (whiteCount === 0 || !whiteHasMoves) {
      alert("Чёрные выигрывают!");
      disableBoard();
    } else if (blackCount === 0 || !blackHasMoves) {
      alert("Белые выигрывают!");
      disableBoard();
    }
   }
function disableBoard() {
    document
     // Удаление обработчиков событий клика со всех клеток
      .querySelectorAll(".cell")
      .forEach((cell) => cell.removeEventListener("click", onCellClick));
}
PiecesPosition();
// update(gameRef, {
//         blackpiece: blackpiece, 
//         whitepiece: whitepiece, 
//         turn: turnmatch
//     });
// socket.emit("movement", {
//     blackpiece: blackpiece, 
//     whitepiece: whitepiece, 
//     turnmatch: turnmatch
// });
document.getElementById('leave').addEventListener('click', async (e) => {
    e.preventDefault();
    console.log("Выход по кнопке");
    window.history.back();
});
const board = document.getElementById("board");
const rows = 8;
const cols = 8;
let selectedPiece = null;
let turn = "white"; 
let blackPieces = [];
let whitePieces = [];

function initGame() {
    createBoard();
    setupPieces();
}
// Создание доски
function createBoard() {
    board.innerHTML = "";
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.classList.add((row + col) % 2 === 0 ? "white" : "black");
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener("click", onCellClick);
            board.appendChild(cell);
        }
    }
}
// Расстановка шашек
function setupPieces() {
    blackPieces = [];
    whitePieces = [];  
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if ((row + col) % 2 !== 0) { // Только черные клетки
                const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);               
                if (row < 3) { 
                    addPiece(cell, "black", false);
                    blackPieces.push({row, col, isKing: false});
                } 
                else if (row > 4) { 
                    addPiece(cell, "white", false);
                    whitePieces.push({row, col, isKing: false});
                }
            }
        }
    }
}

// Добавление шашки на клетку
function addPiece(cell, color, isKing) {
    const piece = document.createElement("div");
    piece.classList.add("piece", color);
    piece.dataset.color = color;
    piece.dataset.king = isKing ? "true" : "false";
    if (isKing) piece.classList.add("king");
    cell.appendChild(piece);
}

// Обраб клика 
function onCellClick(e) {
    const cell = e.target.closest(".cell");
    if (!cell) return; 
    const piece = cell.querySelector(".piece");  
    // Если выбрана шашка текущего игрока
    if (piece && piece.dataset.color === turn) {
        selectedPiece = {cell, piece};
        showPossibleMoves(cell, piece);
        return;
    } 
  // Если пытаемся сделать ход
    if (selectedPiece && !piece) {
        const fromCell = selectedPiece.cell;
        const fromPiece = selectedPiece.piece;
        const fromRow = parseInt(fromCell.dataset.row);
        const fromCol = parseInt(fromCell.dataset.col);
        const toRow = parseInt(cell.dataset.row);
        const toCol = parseInt(cell.dataset.col);
        
        if (isValidMove(fromRow, fromCol, toRow, toCol, fromPiece)) {
            makeMove(fromCell, cell, fromPiece);
        }
    }
}

// Проверка допустимости хода
function isValidMove(fromRow, fromCol, toRow, toCol, piece) {
    const isKing = piece.dataset.king === "true";
    const direction = piece.dataset.color === "white" ? -1 : 1; 
    // Для обычной шашки
    if (!isKing) {
        // Обычный ход
        if (Math.abs(toCol - fromCol) === 1 && 
            (toRow - fromRow) === direction && 
            !cellHasPiece(toRow, toCol)) {
            return true;
        }      
        // Ход с взятием
        if (Math.abs(toCol - fromCol) === 2 && 
            Math.abs(toRow - fromRow) === 2) {
            const midRow = (fromRow + toRow) / 2;
            const midCol = (fromCol + toCol) / 2;         
            if (cellHasOpponentPiece(midRow, midCol, piece.dataset.color) && 
                !cellHasPiece(toRow, toCol)) {
                return true;
            }
        }
    } 
    // Для дамки
    else {
        if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;     
        const rowStep = toRow > fromRow ? 1 : -1;
        const colStep = toCol > fromCol ? 1 : -1;
        let hasOpponent = false;
        let opponentRow = -1;
        let opponentCol = -1;    
        for (let i = 1; i < Math.abs(toRow - fromRow); i++) {
            const checkRow = fromRow + i * rowStep;
            const checkCol = fromCol + i * colStep;     
            if (cellHasPiece(checkRow, checkCol)) {
                if (cellHasOpponentPiece(checkRow, checkCol, piece.dataset.color)) {
                    if (hasOpponent) return false; // Больше одной шашки на пути
                    hasOpponent = true;
                    opponentRow = checkRow;
                    opponentCol = checkCol;
                } else {
                    return false; // Своя шашка на пути
                }
            }
        }   
        if (hasOpponent) {
            // Проверяем, что после шашки противника есть свободное место
            const afterOpponentRow = opponentRow + rowStep;
            const afterOpponentCol = opponentCol + colStep;
            
            if (afterOpponentRow !== toRow || afterOpponentCol !== toCol) {
                return false;
            }
        }    
        return !cellHasPiece(toRow, toCol);
    }
    return false;
}

// Выполнение хода
function makeMove(fromCell, toCell, piece) {
    const isKing = piece.dataset.king === "true";
    const fromRow = parseInt(fromCell.dataset.row);
    const fromCol = parseInt(fromCell.dataset.col);
    const toRow = parseInt(toCell.dataset.row);
    const toCol = parseInt(toCell.dataset.col); 
    // Удаляем шашку с исходной клетки
    fromCell.removeChild(piece);
    // Если это взятие, удаляем съеденную шашку
    if (Math.abs(toRow - fromRow) === 2) {
        const midRow = (fromRow + toRow) / 2;
        const midCol = (fromCol + toCol) / 2;
        const midCell = document.querySelector(`.cell[data-row="${midRow}"][data-col="${midCol}"]`);
        midCell.querySelector(".piece").remove();     
        // Обновляем массив шашек
        if (turn === "white") {
            blackPieces = blackPieces.filter(p => !(p.row === midRow && p.col === midCol));
        } else {
            whitePieces = whitePieces.filter(p => !(p.row === midRow && p.col === midCol));
        }
    }
    // Проверка на превращение в дамку
    let becameKing = false;
    if (!isKing && ((piece.dataset.color === "white" && toRow === 0) || 
                    (piece.dataset.color === "black" && toRow === 7))) {
        piece.dataset.king = "true";
        piece.classList.add("king");
        becameKing = true;
    }
    // Перемещаем шашку на новую клетку
    toCell.appendChild(piece); 
    // Обновляем массивы шашек
    updatePiecesArray(fromRow, fromCol, toRow, toCol, becameKing); 
    // Проверяем, нужно ли продолжать взятие
    if (Math.abs(toRow - fromRow) === 2 && canCaptureMore(toRow, toCol, piece)) {
        selectedPiece = {cell: toCell, piece};
        showPossibleMoves(toCell, piece);
    } else {
        selectedPiece = null;
        turn = turn === "white" ? "black" : "white";
        clearHighlights();
    } 
    checkGameEnd();
}

// Обновление массива шашек после хода
function updatePiecesArray(fromRow, fromCol, toRow, toCol, becameKing) {
    if (turn === "white") {
        const index = whitePieces.findIndex(p => p.row === fromRow && p.col === fromCol);
        if (index !== -1) {
            whitePieces[index] = {row: toRow, col: toCol, isKing: becameKing || whitePieces[index].isKing};
        }
    } else {
        const index = blackPieces.findIndex(p => p.row === fromRow && p.col === fromCol);
        if (index !== -1) {
            blackPieces[index] = {row: toRow, col: toCol, isKing: becameKing || blackPieces[index].isKing};
        }
    }
}

// Проверка, может ли шашка продолжить взятие
function canCaptureMore(row, col, piece) {
    if (piece.dataset.king === "true") {
        // Логика для дамки
        const directions = [
            {dr: 1, dc: 1}, {dr: 1, dc: -1}, 
            {dr: -1, dc: 1}, {dr: -1, dc: -1}
        ];     
        for (const dir of directions) {
            let foundOpponent = false;         
            for (let step = 1; step < 8; step++) {
                const checkRow = row + dir.dr * step;
                const checkCol = col + dir.dc * step;       
                if (checkRow < 0 || checkRow >= 8 || checkCol < 0 || checkCol >= 8) break;               
                if (cellHasPiece(checkRow, checkCol)) {
                    if (cellHasOpponentPiece(checkRow, checkCol, piece.dataset.color)) {
                        foundOpponent = true;
                    } else {
                        break;
                    }
                } else if (foundOpponent) {
                    return true;
                }
            }
        }
    } else {
        // Логика для обычной шашки
        const directions = [
            {row: row + 2, col: col + 2},
            {row: row + 2, col: col - 2},
            {row: row - 2, col: col + 2},
            {row: row - 2, col: col - 2}
        ];   
        for (const dir of directions) {
            if (isValidMove(row, col, dir.row, dir.col, piece)) {
                return true;
            }
        }
    } 
    return false;
}

// Проверка окончания игры
function checkGameEnd() {
    if (whitePieces.length === 0 || !hasValidMoves("white")) {
        alert("Чёрные выиграли!");
        initGame();
        return;
    }  
    if (blackPieces.length === 0 || !hasValidMoves("black")) {
        alert("Белые выиграли!");
        initGame();
        return;
    }
}

// Проверка, есть ли у игрока допустимые ходы
function hasValidMoves(color) {
    const pieces = color === "white" ? whitePieces : blackPieces; 
    for (const piece of pieces) {
        const cell = document.querySelector(`.cell[data-row="${piece.row}"][data-col="${piece.col}"]`);
        const pieceElement = cell.querySelector(".piece");     
        if (canCaptureMore(piece.row, piece.col, pieceElement)) {
            return true;
        }     
        if (piece.isKing) {
            // Проверка ходов дамки
            const directions = [
                {dr: 1, dc: 1}, {dr: 1, dc: -1}, 
                {dr: -1, dc: 1}, {dr: -1, dc: -1}
            ];         
            for (const dir of directions) {
                for (let step = 1; step < 8; step++) {
                    const toRow = piece.row + dir.dr * step;
                    const toCol = piece.col + dir.dc * step;                  
                    if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) break;                 
                    if (!cellHasPiece(toRow, toCol) && 
                        isValidMove(piece.row, piece.col, toRow, toCol, pieceElement)) {
                        return true;
                    }                 
                    if (cellHasPiece(toRow, toCol)) break;
                }
            }
        } else {
            // Проверка ходов обычной шашки
            const direction = color === "white" ? -1 : 1;
            const moves = [
                {row: piece.row + direction, col: piece.col + 1},
                {row: piece.row + direction, col: piece.col - 1}
            ];         
            for (const move of moves) {
                if (move.row >= 0 && move.row < 8 && move.col >= 0 && move.col < 8 && 
                    !cellHasPiece(move.row, move.col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Вспомогательные функции
function cellHasPiece(row, col) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    return cell && cell.querySelector(".piece");
}

function cellHasOpponentPiece(row, col, color) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    const piece = cell?.querySelector(".piece");
    return piece && piece.dataset.color !== color;
}

function showPossibleMoves(cell, piece) {
    clearHighlights(); 
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const isKing = piece.dataset.king === "true";
    if (isKing) {
        showKingMoves(row, col, piece.dataset.color);
    } else {
        showRegularMoves(row, col, piece.dataset.color);
    }
}

function showRegularMoves(row, col, color) {
    const direction = color === "white" ? -1 : 1;    
    // Проверка простых ходов
    for (const dc of [-1, 1]) {
        const newRow = row + direction;
        const newCol = col + dc;       
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && 
            !cellHasPiece(newRow, newCol)) {
            highlightCell(newRow, newCol);
        }
    }   
    // Проверка ходов с взятием
    for (const dc of [-2, 2]) {
        const newRow = row + (direction * 2);
        const newCol = col + dc;       
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && 
            !cellHasPiece(newRow, newCol)) {
            const midRow = row + direction;
            const midCol = col + (dc / 2);           
            if (cellHasOpponentPiece(midRow, midCol, color)) {
                highlightCell(newRow, newCol, true);
            }
        }
    }
}
function showKingMoves(row, col, color) {
    const directions = [
        {dr: 1, dc: 1}, {dr: 1, dc: -1}, 
        {dr: -1, dc: 1}, {dr: -1, dc: -1}
    ];   
    for (const dir of directions) {
        let hasOpponent = false;       
        for (let step = 1; step < 8; step++) {
            const newRow = row + dir.dr * step;
            const newCol = col + dir.dc * step;           
            if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;          
            if (cellHasPiece(newRow, newCol)) {
                if (cellHasOpponentPiece(newRow, newCol, color)) {
                    if (hasOpponent) break;
                    hasOpponent = true;
                } else {
                    break;
                }
            } else if (!hasOpponent || step > 1) {
                highlightCell(newRow, newCol, hasOpponent);
            }
        }
    }
}
function highlightCell(row, col, isCapture = false) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    const highlight = document.createElement("div");
    highlight.classList.add("highlight");
    if (isCapture) highlight.classList.add("capture");
    cell.appendChild(highlight);
}
function clearHighlights() {
    document.querySelectorAll(".highlight").forEach(el => el.remove());
}
initGame();
const board = document.getElementById("board");
const rows = 8;
const cols = 8;
let selectedPiece = null;
let turn = "white";
let  blackpiece = [];
let  whitekpiece = [];
function initializeBoard() { 
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.classList.add((row + col) % 2 == 0 ? "white" : "black");
            cell.dataset.row = row;
            cell.dataset.col = col;
            if (row < 3 && (row + col) % 2 !== 0) {
                addPiece(cell, "black");
            } else if (row > 4 && (row + col) % 2 !== 0) {
                addPiece(cell, "white");
            }
            cell.addEventListener("click", onCellClick);
            board.appendChild(cell);
        }
    }
} 

function addPiece(cell, color) {
    const piece = document.createElement("div");
    piece.classList.add("piece", color);
    piece.dataset.color = color;
    piece.dataset.king = "false";
    // piece.dataset.king = "true";
    // piece.classList.add("king");
    cell.appendChild(piece);
}

function onCellClick(e) {
    //removepoint()
    const cell = e.target.closest(".cell");
    if (!cell) return;
    const piece = cell.querySelector(".piece");
    if (selectedPiece && !piece) {
        const startRow = parseInt(selectedPiece.parentElement.dataset.row);
        const startCol = parseInt(selectedPiece.parentElement.dataset.col);

        const endRow = parseInt(cell.dataset.row);
        const endCol = parseInt(cell.dataset.col);
        const direction = selectedPiece.dataset.color == "white" ? -1 : 1;
        let movetry =true;
        if (selectedPiece.dataset.king == "false") {
            console.log(`Шашка выбрана`);
            if(canMoveRegular(selectedPiece, startRow, startCol, endRow, endCol, direction)){
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
                } else {
                    possiblemovesKing(piece);
                    selectedPiece = piece;
                }
            } 
        } else {
            if (piece.dataset.king == "false") {
                selectedPiece = piece;
                possiblemoves(selectedPiece, cell);
            } else {
                possiblemovesKing(piece); 
                selectedPiece = piece;
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
//Проверка ходов и взятий для шашки
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
function possibleKing(piece) {
    const Row = parseInt(piece.parentElement.dataset.row);
    const Col = parseInt(piece.parentElement.dataset.col);
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
        for (let a =1; a<7;a++){
            const newRow = Row + (rowa*a);
            const newCol = Col + (colb*a);
            //console.log("Новые переменные для шага" ,newRow, " ", newCol);
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {     
                const Cell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
                const piece =Cell.querySelector(".piece");
                if(piece && piece.dataset.color!=turn){ 
                    if(enemypiece==1){
                        break;
                    }
                    console.log("УЫР " ,(newRow+rowa), " ", (newCol+colb), " / ", (newRow), " ", (newCol)," ");
                    const Celler = document.querySelector(`.cell[data-row="${(newRow+rowa)}"][data-col="${(newCol+colb)}"]`);
                    const piecea = Celler.querySelector(".piece");
                    if(piecea){
                        return false;
                    }
                    enemypiece = 1;
                    continue                        
                }
                if(piece && piece.dataset.color==turn){
                    break;
                } 
                const point = document.createElement("div");
                point.classList.add("point");
                Cell.appendChild(point);
                continue
            }
        }
    }
    return true;
}
//удаление точек
function removepoint(){
    const existingPoints = document.querySelectorAll('.point');
    existingPoints.forEach(point => {point.parentElement.removeChild(point);});
}
//возможные ходы для шашки (точки)
function possiblemoves(piece){
    removepoint();
    const Row = parseInt(piece.parentElement.dataset.row);
    const Col = parseInt(piece.parentElement.dataset.col);
    const direction = piece.dataset.color == "white" ? -1 : 1;
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
                } else if (Cell && !piece && newRow-Row ==direction ) { 
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
    console.log("Метод запущен");
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
//Доделать
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
    checkGameState();
}

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
            if (((piece.dataset.color == "white" && endRow == 0) ||
                (piece.dataset.color == "black" && endRow == 7)) && piece.dataset.king == "false") {
                piece.dataset.king = "true";
                piece.classList.add("king");
                //Доделать!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // if(!possiblecapture(piece)){
            }
            else if(!possiblecapture(piece)){
                //possiblemoves(piece)
                selectedPiece = null;
                turn = turn == "white" ? "black" : "white";
            }
        } 
    }else {
        targetCell.appendChild(piece);
        selectedPiece = null;
        turn = turn == "white" ? "black" : "white";
    }
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
initializeBoard();
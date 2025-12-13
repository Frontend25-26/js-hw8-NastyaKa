const board = document.getElementById("board");

const rows = 8;
const cols = 8;
let blackPieces = 0;
let whitePieces = 0;
const move_i = [-1, -1, 1, 1];
const move_j = [-1, 1, -1, 1];
let lastClickedPiece = null;
let canSelect = [];
let mustKill = [];
let currentPlayer = "white";

function isInside(i, j) {
    return i >= 0 && j >= 0 && i < rows && j < cols;
}

function isEmpty(i, j) {
    return board.children[i].children[j].children.length === 0;
}

function getColorFromCell(cell) {
    return getColor(cell.dataset.i, cell.dataset.j);
}

function getColor(i, j) {
    return board.children[i].children[j].children[0].dataset.color;
}

function markSelected(i, j, canKill = false) {
    if (canKill) {
        mustKill.push([i, j]);
    } else {
        canSelect.push([i, j]);
    }
}

function addMoveClasses() {
    const arr = mustKill.length > 0 ? mustKill : canSelect.length > 0 ? canSelect : [];
    for (let [i, j] of arr) {
        board.children[i].children[j].classList.add("canChoose");
    }
}

function cleanSelected() {
    const arr = mustKill.length > 0 ? mustKill : canSelect.length > 0 ? canSelect : [];
    for (let [i, j] of arr) {
        board.children[i].children[j].classList.remove("canChoose");
    }
    canSelect = [];
    mustKill = [];
    lastClickedPiece = null;
}

function findMoves(cell) {
    for (let k = 0; k < move_i.length; k++) {
        const i = move_i[k] + parseInt(cell.dataset.i);
        const j = move_j[k] + parseInt(cell.dataset.j);
        if (isInside(i, j)) {
            if (isEmpty(i, j)) {
                markSelected(i, j);
            } else if (getColor(i, j) !== getColorFromCell(cell)) {
                const new_i = i + move_i[k];
                const new_j = j + move_j[k];
                if (isInside(new_i, new_j) && isEmpty(new_i, new_j)) {
                    markSelected(new_i, new_j, true);
                }
            }
        }
    }
}

function selectCells(cell) {
    if (lastClickedPiece) {
        cleanSelected();
    }

    lastClickedPiece = cell.children[0];
    findMoves(cell);

    addMoveClasses();
}

function makeBoom(i, j) {
    const deadPiece = board.children[i].children[j].children[0];
    if (currentPlayer === "black") {
        whitePieces -= 1;
    } else if (currentPlayer === "white") {
        blackPieces -= 1;
    }

    deadPiece.zIndex = -1;
    const boom = document.createElement("img");
    boom.classList.add("die");
    boom.src = './media/explosion-gif.gif';
    boom.alt = "boom";
    deadPiece.parentElement.appendChild(boom);

    setTimeout(() => {
        boom.remove();
        deadPiece.remove();
    }, 300)
}

function movePieceAnimation(toCell) {
    return new Promise((resolve) => {
        lastClickedPiece.classList.add("move");
        const bounding = toCell.getBoundingClientRect();
        const i = parseInt(toCell.dataset.i);
        const j = parseInt(toCell.dataset.j);
        const dx = j - parseInt(lastClickedPiece.dataset.col);
        const dy = i - parseInt(lastClickedPiece.dataset.row);
        const toKill = mustKill.length > 0;

        if (toKill) {
            makeBoom(i - dy / 2, j - dx / 2);
        }

        lastClickedPiece.style.transform = `translate(${dx * bounding.width}px, ${dy * bounding.height}px)`;

        const targetCell = toCell;
        const movePiece = lastClickedPiece;
        const pieceParent = lastClickedPiece.parentElement;
        cleanSelected();

        setTimeout(() => {
            targetCell.appendChild(movePiece);
            pieceParent.innerHTML = '';
            movePiece.style.transform = '';
            movePiece.classList.remove("move");
            movePiece.dataset.row = toCell.dataset.i;
            movePiece.dataset.col = toCell.dataset.j;
            resolve(toKill);
        }, 400);

    });
}

function checkIfEnd() {
    if (whitePieces === 0) {
        endGame("black");
    } else if (blackPieces === 0) {
        endGame("white");
    }
}

function addCellListener(cell) {
    cell.addEventListener("click", async () => {
        if (!isEmpty(cell.dataset.i, cell.dataset.j) && currentPlayer === getColorFromCell(cell)) {
            selectCells(cell);
        } else if (lastClickedPiece) {
            if (cell.classList.contains("canChoose")) {
                const wasKilled = await movePieceAnimation(cell);
                checkIfEnd();
                let canKillAgain = false;
                if (wasKilled) {
                    selectCells(cell);
                    if (mustKill.length === 0) {
                        cleanSelected();
                    } else {
                        canKillAgain = true;
                    }
                }
                if (!canKillAgain) {
                    currentPlayer = currentPlayer === "white" ? "black" : "white";
                }
            }
        }
    });
}

function endGame(winner) {
    currentPlayer = null;
    lastClickedPiece = null;
    const notification = document.createElement("div");
    notification.classList.add("notification");
    notification.textContent = `${winner.toUpperCase()} is the winner! Reload the page to play again.`;
    notification.classList.add("show");
    document.body.append(notification);
    setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}

function createBoard() {
    for (let i = 0; i < rows; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        for (let j = 0; j < cols; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.classList.add((i + j) % 2 === 0 ? "white" : "black");
            cell.dataset.i = i;
            cell.dataset.j = j;

            if (i < 3 && (i + j) % 2 !== 0) {
                addPiece(cell, "black", i, j);
                blackPieces++;
            } else if (i > 4 && (i + j) % 2 !== 0) {
                addPiece(cell, "white", i, j);
                whitePieces++;
            }
            addCellListener(cell);
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
}

function addPiece(cell, color, row, col) {
    const piece = document.createElement("div");
    piece.classList.add("piece", color);
    piece.dataset.color = color;
    piece.dataset.col = col;
    piece.dataset.row = row;
    cell.appendChild(piece);
}

createBoard();

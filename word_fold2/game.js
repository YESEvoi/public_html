const boards = [
    {
        cells: [
            ["E", "L", "W", "Y", "C"],
            ["Y", "L", "O", "A", "N"],
            ["U", "B", "L", "E", "E"],
            ["E", "L", "P", "M", "V"],
            ["P", "U", "R", "A", "U"]],
        words: ["CYAN", "YELLOW", "PURPLE", "MAUVE", "BLUE"],
    },
    {
        cells: [
            ["E", "K", "O", "A", "P"],
            ["A", "W", "L", "I", "R"],
            ["N", "S", "F", "A", "T"],
            ["L", "E", "E", "R", "A"],
            ["A", "G", "G", "U", "J"]],
        words: ["TAPIR", "EAGLE", "JAGUAR", "SNAKE", "WOLF"],
    },
    {
        cells: [
            ["H", "C", "N", "A", "N"],
            ["Y", "R", "A", "A", "A"],
            ["R", "E", "A", "Y", "B"],
            ["F", "P", "P", "E", "R"],
            ["I", "G", "A", "P", "A"]],
        words: ["CHERRY", "PAPAYA", "BANANA", "PEAR", "FIG"],
    },
]

function make_cell_list() {
    let cells = [...document.getElementById("cell-holder").children];
    let cell_board = [];
    for (let i = 0; i < 25; i += 5) {
        cell_board.push(cells.slice(i, i + 5))
    }
    return cell_board;
}

function setup_game(starting_cells) {
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            CELLS[y][x].innerHTML = starting_cells[y][x];
        }
    }
}

// Global YouTube API setup
let coins = 0;
let currentBoardWords = [];
let moveHistory = []; // To store moves for undo functionality
let clashingColorsEnabled = false;
let currentBoardIndex = -1;
let musicPlayer;
let sfxPlayer;

// Array of YouTube video IDs for background music
const youtubeMusicIds = [
    'D2M2O6SBD00', // Song 1
    'CZmAZa2e1D4', // Song 2
    '4FY4M20SSgQ', // Song 3
    '4O6xbBk0RtM'  // Song 4
];

// This function is called by the YouTube API when it's ready
window.onYouTubeIframeAPIReady = function() {
    const musicDiv = document.createElement('div');
    musicDiv.id = 'music-player-div';
    musicDiv.style.position = 'absolute'; // Hide it
    musicDiv.style.left = '-9999px';
    document.body.appendChild(musicDiv);

    const randomMusicId = youtubeMusicIds[Math.floor(Math.random() * youtubeMusicIds.length)];

    musicPlayer = new YT.Player('music-player-div', {
        height: '0', width: '0', videoId: randomMusicId,
        playerVars: { 'autoplay': 1, 'controls': 0, 'loop': 1, 'playlist': randomMusicId },
        events: { 'onReady': (event) => { event.target.setVolume(20); } } // Lower volume
    });
};

// Load the YouTube IFrame API asynchronously
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

function cleanup_all_game_ui() {
    // Remove any dynamically created game elements
    document.getElementById('get-coins-btn')?.remove();
    document.getElementById('help-text')?.remove();
    document.getElementById('status-bar')?.remove();
    document.getElementById('game-wrapper')?.remove();
    document.getElementById('minesweeper-container')?.remove();
    document.getElementById('win-screen')?.remove();
    // Stop music if player exists
    if (musicPlayer && typeof musicPlayer.stopVideo === 'function') {
        musicPlayer.stopVideo();
    }
    // Reset body animation to allow CSS rules (no rotation) to take over
    document.body.style.animation = '';
}

function start_game(boardIndex) {
    currentBoardIndex = boardIndex;
    moveHistory = []; // Reset history for new game
    document.body.style.animation = 'rainbow-bg 18s ease infinite, screen-rotate 120s linear infinite';
    // Ensure music is playing when game starts (it might have been stopped by cleanup_all_game_ui)
    if (musicPlayer && typeof musicPlayer.playVideo === 'function') {
        musicPlayer.playVideo();
    }
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.remove();
    }

    const selectedBoard = boards[boardIndex];
    currentBoardWords = selectedBoard.words.map(word => ({ text: word, found: false }));

    // Create the massive coin button (moved to top)
    const coinButton = document.createElement('button');
    coinButton.id = 'get-coins-btn';
    coinButton.textContent = 'GIMME COINS!';
    coinButton.onclick = () => {
        coins++;
        document.getElementById('coin-display').textContent = `Coins: ${coins}`;
        // The sfxPlayer logic was removed in a previous step, let's add it back for the coin sound.
        if (typeof sfxPlayer !== 'undefined' && sfxPlayer && typeof sfxPlayer.playVideo === 'function') {
            sfxPlayer.seekTo(0);
            sfxPlayer.playVideo();
        }
    };
    // Insert it at the very top of the body
    document.body.insertBefore(coinButton, document.body.firstChild);
    // Ensure it's visible
    coinButton.style.visibility = 'visible';

    // Add help text under the coin button
    const helpText = document.createElement('p');
    helpText.id = 'help-text';
    helpText.textContent = 'You need coins in order to click on the tiles!';
    coinButton.after(helpText);

    // --- Create Status Bar ---
    const statusBar = document.createElement('div');
    statusBar.id = 'status-bar';
    document.body.insertBefore(statusBar, document.getElementById("cell-holder"));

    // Add words list to status bar
    const wordsDisplay = document.getElementById("words");
    update_words_display();
    wordsDisplay.style.visibility = 'visible';
    statusBar.appendChild(wordsDisplay);

    // Container for controls on the right
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'status-controls';
    statusBar.appendChild(controlsContainer);

    // Add Undo Button
    const undoButton = document.createElement('button');
    undoButton.id = 'undo-btn';
    undoButton.textContent = 'Undo';
    undoButton.onclick = undo_move;
    controlsContainer.appendChild(undoButton);

    // Coin display
    const coinDisplay = document.createElement('span');
    coinDisplay.id = 'coin-display';
    coinDisplay.textContent = `Coins: ${coins}`;
    controlsContainer.appendChild(coinDisplay);

    // --- Create Main Game Area (board + button) ---
    const gameWrapper = document.createElement('div'); // This will now primarily wrap the cell-holder
    gameWrapper.id = 'game-wrapper';
    // Insert it after the status bar
    document.body.insertBefore(gameWrapper, statusBar.nextSibling);

    // Move the cell-holder into the new wrapper
    const cellHolder = document.getElementById("cell-holder");
    gameWrapper.appendChild(cellHolder);

    // Show game board
    cellHolder.style.visibility = 'visible';

    // Setup game board
    setup_game(selectedBoard.cells);
}

function create_start_screen() {
    // Hide game elements initially
    document.getElementById("cell-holder").style.visibility = 'hidden';
    document.getElementById("words").style.visibility = 'hidden';

    // Clean up any previous game UI before showing the menu
    cleanup_all_game_ui();

    // Ensure the clashing colors theme is correctly applied
    document.body.classList.toggle('clashing-colors', clashingColorsEnabled);

    const startScreen = document.createElement('div');
    startScreen.id = 'start-screen';
    startScreen.innerHTML = '<h1>Select a Board</h1>';

    const boardSelection = document.createElement('div');
    boards.forEach((board, index) => {
        const button = document.createElement('button');
        button.textContent = `Board ${index + 1}`;
        button.onclick = () => start_game(index);
        boardSelection.appendChild(button);
    });

    // Add Minesweeper button
    const minesweeperButton = document.createElement('button');
    minesweeperButton.textContent = 'Play Minesweeper';
    minesweeperButton.onclick = () => { window.location.href = 'https://shattereddisk.github.io/rickroll/rickroll.mp4'; };
    boardSelection.appendChild(minesweeperButton);

    // Add Clashing Colors button
    const clashButton = document.createElement('button');
    clashButton.id = 'clash-toggle-btn';
    clashButton.textContent = clashingColorsEnabled ? 'Make Colors Normal' : 'Make Colors Clash';
    clashButton.onclick = () => {
        clashingColorsEnabled = !clashingColorsEnabled;
        document.body.classList.toggle('clashing-colors', clashingColorsEnabled);
        clashButton.textContent = clashingColorsEnabled ? 'Make Colors Normal' : 'Make Colors Clash';
    };
    boardSelection.appendChild(clashButton);

    startScreen.appendChild(boardSelection);
    document.body.insertBefore(startScreen, document.getElementById("cell-holder"));
}

const CELLS = make_cell_list();
let selected_x = -1;
let selected_y = -1;

create_start_screen();

function move(x, y) {
    CELLS[y][x].innerHTML = CELLS[selected_y][selected_x].innerHTML + CELLS[y][x].innerHTML;
    CELLS[selected_y][selected_x].innerHTML = ""
    select(x, y);
}

function unselect(x, y) {
    CELLS[y][x].classList.remove("selected");
    selected_x = -1;
    selected_y = -1;
}

function select(x, y) {
    if (CELLS[y][x].innerHTML.length > 0) {
        if (selected_x >= 0 && selected_y >= 0)
            CELLS[selected_y][selected_x].classList.remove("selected");
        CELLS[y][x].classList.add("selected");
        selected_y = y;
        selected_x = x;
    }
}

function is_close(a, b) {
    return Math.abs(a - b) <= 1
}

function can_move(x, y) {
    let can_move = is_close(selected_x, x) && selected_y == y || is_close(selected_y, y) && selected_x == x;

    return selected_x >= 0 && selected_y >= 0 && can_move && CELLS[y][x].innerHTML.length > 0
}

function on_click(x, y) {
    if (selected_x == x && selected_y == y) {
        unselect(x, y)
    }
    else if (can_move(x, y)) {
        if (coins > 0) {
            // Save state BEFORE the move
            moveHistory.push({
                from: { x: selected_x, y: selected_y, content: CELLS[selected_y][selected_x].innerHTML },
                to: { x: x, y: y, content: CELLS[y][x].innerHTML }
            });

            coins--;
            document.getElementById('coin-display').textContent = `Coins: ${coins}`;
            move(x, y);
            check_for_words(CELLS[y][x].innerHTML);
        } else {
            const coinDisplay = document.getElementById('coin-display');
            if (coinDisplay) {
                coinDisplay.style.color = 'red';
                coinDisplay.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    coinDisplay.style.color = '';
                    coinDisplay.style.transform = '';
                }, 300);
            }
        }
    } else {
        select(x, y)
    }
}

function undo_move() {
    if (moveHistory.length === 0) {
        console.log("No moves to undo.");
        // Optional: Add visual feedback for no undo
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.style.opacity = '0.5';
            setTimeout(() => { undoBtn.style.opacity = '1'; }, 300);
        }
        return;
    }

    const lastMove = moveHistory.pop();

    // Restore cell contents
    CELLS[lastMove.from.y][lastMove.from.x].innerHTML = lastMove.from.content;
    CELLS[lastMove.to.y][lastMove.to.x].innerHTML = lastMove.to.content;

    // Give back the coin
    coins++;
    document.getElementById('coin-display').textContent = `Coins: ${coins}`;

    // Unselect any currently selected tile to avoid confusion
    if (selected_x !== -1) {
        CELLS[selected_y][selected_x].classList.remove("selected");
        selected_x = -1;
        selected_y = -1;
    }
}

// --- Win Condition and Word Checking Logic ---

function update_words_display() {
    const wordsDisplay = document.getElementById("words");
    if (wordsDisplay) {
        wordsDisplay.innerHTML = "Words to spell: " + currentBoardWords.map(w => `<span class="${w.found ? 'found-word' : ''}">${w.text}</span>`).join(", ");
    }
}

function check_for_words(formedWord) {
    const upperFormedWord = formedWord.toUpperCase();
    let wordFoundThisTurn = false;

    currentBoardWords.forEach(wordObj => {
        if (wordObj.text === upperFormedWord && !wordObj.found) {
            wordObj.found = true;
            wordFoundThisTurn = true;

            // Award 10 coins for finding a word
            coins += 10;
            document.getElementById('coin-display').textContent = `Coins: ${coins}`;

            console.log(`Found word: ${wordObj.text}, awarded 10 coins.`);
        }
    });

    if (wordFoundThisTurn) {
        update_words_display();
        check_win_condition();
    }
}

function check_win_condition() {
    const allWordsFound = currentBoardWords.every(w => w.found);
    if (allWordsFound) {
        display_win_screen();
    }
}

function display_win_screen() {
    // Hide all game elements
    cleanup_all_game_ui();
    // Stop screen rotation for the win screen
    document.body.style.animation = 'none';

    const winScreen = document.createElement('div');
    winScreen.id = 'win-screen';
    winScreen.innerHTML = '<h1>YOU WIN!</h1>';

    const restartButton = document.createElement('button');
    restartButton.textContent = 'Play Again';
    restartButton.onclick = () => { winScreen.remove(); coins = 0; start_game(currentBoardIndex); };

    const menuButton = document.createElement('button');
    menuButton.textContent = 'Main Menu';
    menuButton.onclick = () => { winScreen.remove(); coins = 0; create_start_screen(); };

    winScreen.appendChild(restartButton);
    winScreen.appendChild(menuButton);
    document.body.appendChild(winScreen);
}

// --- MINESWEEPER IMPLEMENTATION ---

const MS_BOARD_SIZE = 10;
const MS_NUM_MINES = 10;
let ms_board_data = [];
let ms_gameOver = false;

function start_minesweeper() {
    // Clean up screen from any previous game
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.remove();
    cleanup_all_game_ui();

    // Start screen rotation for the game
    if (musicPlayer && typeof musicPlayer.playVideo === 'function') {
        musicPlayer.playVideo();
    }
    document.body.style.animation = 'rainbow-bg 18s ease infinite, screen-rotate 120s linear infinite';

    ms_gameOver = false;
    ms_board_data = create_ms_data_board();

    const msContainer = document.createElement('div');
    msContainer.id = 'minesweeper-container';
    document.body.appendChild(msContainer);

    const msHeader = document.createElement('h1');
    msHeader.textContent = 'Minesweeper';
    msContainer.appendChild(msHeader);

    const msGrid = document.createElement('div');
    msGrid.id = 'minesweeper-grid';
    msGrid.style.setProperty('--ms-board-size', MS_BOARD_SIZE);
    msContainer.appendChild(msGrid);

    for (let r = 0; r < MS_BOARD_SIZE; r++) {
        for (let c = 0; c < MS_BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('ms-cell', 'hidden');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', handle_ms_click);
            cell.addEventListener('contextmenu', handle_ms_right_click);
            msGrid.appendChild(cell);
        }
    }

    const menuButton = document.createElement('button');
    menuButton.id = 'ms-menu-btn';
    menuButton.textContent = 'Back to Main Menu';
    menuButton.onclick = () => {
        msContainer.remove();
        create_start_screen();
    };
    msContainer.appendChild(menuButton);
}

function create_ms_data_board() {
    const board = Array.from({ length: MS_BOARD_SIZE }, () =>
        Array.from({ length: MS_BOARD_SIZE }, () => ({
            isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0
        }))
    );

    let minesPlanted = 0;
    while (minesPlanted < MS_NUM_MINES) {
        const row = Math.floor(Math.random() * MS_BOARD_SIZE);
        const col = Math.floor(Math.random() * MS_BOARD_SIZE);
        if (!board[row][col].isMine) {
            board[row][col].isMine = true;
            minesPlanted++;
        }
    }

    for (let r = 0; r < MS_BOARD_SIZE; r++) {
        for (let c = 0; c < MS_BOARD_SIZE; c++) {
            if (board[r][c].isMine) continue;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < MS_BOARD_SIZE && nc >= 0 && nc < MS_BOARD_SIZE && board[nr][nc].isMine) {
                        board[r][c].adjacentMines++;
                    }
                }
            }
        }
    }
    return board;
}

function handle_ms_click(event) {
    if (ms_gameOver) return;
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    if (ms_board_data[row][col].isFlagged || ms_board_data[row][col].isRevealed) return;

    if (ms_board_data[row][col].isMine) {
        ms_gameOver = true;
        reveal_all_mines();
        setTimeout(() => alert("Game Over! You hit a mine."), 100);
        return;
    }
    reveal_ms_cell(row, col);
    check_ms_win();
}

function handle_ms_right_click(event) {
    event.preventDefault();
    if (ms_gameOver) return;
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    if (ms_board_data[row][col].isRevealed) return;
    ms_board_data[row][col].isFlagged = !ms_board_data[row][col].isFlagged;
    cell.classList.toggle('flagged', ms_board_data[row][col].isFlagged);
    cell.textContent = ms_board_data[row][col].isFlagged ? '🚩' : '';
}

function reveal_ms_cell(r, c) {
    if (r < 0 || r >= MS_BOARD_SIZE || c < 0 || c >= MS_BOARD_SIZE || ms_board_data[r][c].isRevealed || ms_board_data[r][c].isFlagged) return;
    ms_board_data[r][c].isRevealed = true;
    const cellElement = document.querySelector(`.ms-cell[data-row='${r}'][data-col='${c}']`);
    cellElement.classList.remove('hidden');
    cellElement.classList.add('revealed');
    if (ms_board_data[r][c].adjacentMines > 0) {
        cellElement.textContent = ms_board_data[r][c].adjacentMines;
        cellElement.classList.add(`ms-n${ms_board_data[r][c].adjacentMines}`);
    } else {
        for (let dr = -1; dr <= 1; dr++) { for (let dc = -1; dc <= 1; dc++) { reveal_ms_cell(r + dr, c + dc); } }
    }
}

function reveal_all_mines() {
    ms_board_data.forEach((row, r) => row.forEach((cellData, c) => {
        if (cellData.isMine) {
            const cellElement = document.querySelector(`.ms-cell[data-row='${r}'][data-col='${c}']`);
            cellElement.classList.remove('hidden', 'flagged');
            cellElement.classList.add('mine');
            cellElement.textContent = '💣';
        }
    }));
}

function check_ms_win() {
    const nonMineCells = MS_BOARD_SIZE * MS_BOARD_SIZE - MS_NUM_MINES;
    const revealedCount = ms_board_data.flat().filter(c => c.isRevealed).length;
    if (revealedCount === nonMineCells) {
        ms_gameOver = true;
        reveal_all_mines();
        setTimeout(() => alert("Congratulations! You won!"), 100);
    }
}
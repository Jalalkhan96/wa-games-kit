const WIN_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diags
];

function checkWinner(board) {
    for (const [a, b, c] of WIN_COMBOS) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    if (board.every(cell => cell !== null)) return 'Draw';
    return null;
}

const scores = { 'O': 10, 'X': -10, 'Draw': 0 };

function minimax(board, depth, isMaximizing) {
    let result = checkWinner(board);
    if (result !== null) return scores[result];

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = 'O'; // AI
                let score = minimax(board, depth + 1, false);
                board[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = 'X'; // Human
                let score = minimax(board, depth + 1, true);
                board[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function getBestMove(board) {
    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = null;
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

function getRandomMove(board) {
    let emptyCells = [];
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) emptyCells.push(i);
    }
    if (emptyCells.length === 0) return -1;
    let randomIndex = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[randomIndex];
}

// Difficulty Engine
function botPlay(board, level) {
    if (level === 'noob') {
        return getRandomMove(board);
    } else if (level === 'elite') {
        return getBestMove(board);
    } else if (level === 'pro') {
        // 50% random, 50% minimax
        if (Math.random() > 0.5) {
            return getBestMove(board);
        } else {
            return getRandomMove(board);
        }
    }
    // Default to random fallback
    return getRandomMove(board);
}

// Themes mapping
const THEMES = {
    'classic': { x: '❌', o: '⭕' },
    'neon': { x: '⚡', o: '🌊' },
    'forest': { x: '🌲', o: '🍀' },
    'ocean': { x: '🐬', o: '🐙' }
};

const NUM_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

function formatBoardPremium(board, themeName) {
    const theme = THEMES[themeName] || THEMES['classic'];

    let display = "🏆 *TIC TAC TOE ELITE* 🏆\n\n";

    for (let i = 0; i < 9; i++) {
        let val = "";
        if (board[i] === 'X') val = theme.x;
        else if (board[i] === 'O') val = theme.o;
        else val = NUM_EMOJIS[i];

        display += `   ${val}   `;
        if ((i + 1) % 3 !== 0) display += "┃";
        if ((i + 1) % 3 === 0 && i < 8) {
            display += "\n ━━━━╋━━━━╋━━━━\n";
        }
    }

    display += "\n\n";
    display += `👤 *Human:* ${theme.x}  |  🤖 *Bot:* ${theme.o}\n\n`;
    return display;
}

module.exports = {
    checkWinner,
    botPlay,
    formatBoardPremium,
    THEMES
};

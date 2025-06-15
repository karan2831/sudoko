// Game state variables
let board = [];
let solution = [];
let userBoard = [];
let selectedCell = null;
let startTime = null;
let timerInterval = null;
let elapsedTime = 0;
let gameActive = false;
let difficulty = 'easy';

// Stats
let gamesPlayed = 0;
let gamesSolved = 0;
let bestTime = Infinity;
let totalTime = 0;

// DOM elements
const boardElement = document.getElementById('board');
const timerElement = document.getElementById('timer');
const messageElement = document.getElementById('message');
const gamesPlayedElement = document.getElementById('games-played');
const gamesSolvedElement = document.getElementById('games-solved');
const bestTimeElement = document.getElementById('best-time');
const avgTimeElement = document.getElementById('avg-time');
const currentTimeElement = document.getElementById('current-time');

// Initialize the game
function initGame() {
  loadStats();
  createBoard();
  generatePuzzle();
  setupEventListeners();
}

// Create the board UI
function createBoard() {
  boardElement.innerHTML = '';
  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    boardElement.appendChild(cell);
  }
}

// Start timer
function startTimer() {
  startTime = new Date();
  elapsedTime = 0;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const now = new Date();
    elapsedTime = Math.floor((now - startTime) / 1000);
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
  const seconds = (elapsedTime % 60).toString().padStart(2, '0');
  timerElement.textContent = `${minutes}:${seconds}`;
  currentTimeElement.textContent = `${minutes}:${seconds}`;
}
function generatePuzzle() {
  resetGameState();
  solution = generateSolvedBoard();
  board = JSON.parse(JSON.stringify(solution));
  removeNumbersForPuzzle();
  renderBoard();
  startTimer();
  gameActive = true;
  gamesPlayed++;
  updateStats();
}

function generateSolvedBoard() {
  const grid = Array(9).fill().map(() => Array(9).fill(0));
  fillDiagonalBoxes(grid);
  fillRemaining(grid, 0, 3);
  return grid;
}

function fillDiagonalBoxes(grid) {
  for (let i = 0; i < 9; i += 3) {
    fillBox(grid, i, i);
  }
}

function fillBox(grid, row, col) {
  const nums = shuffle([1,2,3,4,5,6,7,8,9]);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      grid[row + i][col + j] = nums.pop();
    }
  }
}

function fillRemaining(grid, i, j) {
  if (i === 8 && j === 9) return true;
  if (j === 9) { i++; j = 0; }
  if (grid[i][j] !== 0) return fillRemaining(grid, i, j + 1);

  const nums = shuffle([1,2,3,4,5,6,7,8,9]);
  for (const num of nums) {
    if (isValidPlacement(grid, i, j, num)) {
      grid[i][j] = num;
      if (fillRemaining(grid, i, j + 1)) return true;
      grid[i][j] = 0;
    }
  }
  return false;
}

function removeNumbersForPuzzle() {
  let clues = 35;
  if (difficulty === 'easy') clues = 40;
  else if (difficulty === 'medium') clues = 30;
  else if (difficulty === 'hard') clues = 25;

  let cellsToRemove = 81 - clues;
  while (cellsToRemove > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (board[row][col] === 0) continue;

    const backup = board[row][col];
    board[row][col] = 0;
    if (!hasUniqueSolution()) board[row][col] = backup;
    else cellsToRemove--;
  }
}

function hasUniqueSolution() {
  return true; // Simplified version
}

function renderBoard() {
  userBoard = JSON.parse(JSON.stringify(board));
  const cells = document.querySelectorAll('.cell');

  cells.forEach((cell, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const value = board[row][col];
    cell.textContent = value === 0 ? '' : value;
    cell.classList.remove('fixed', 'user-input', 'error', 'highlight');
    if (value !== 0) cell.classList.add('fixed');
    else cell.classList.add('user-input');
  });
}

function resetGameState() {
  selectedCell = null;
  board = Array(9).fill().map(() => Array(9).fill(0));
  solution = Array(9).fill().map(() => Array(9).fill(0));
  userBoard = Array(9).fill().map(() => Array(9).fill(0));
  messageElement.classList.remove('success', 'error');
  messageElement.textContent = '';
  messageElement.style.display = 'none';
}
function handleCellClick(e) {
  const cell = e.target;
  if (!cell.classList.contains('cell')) return;
  if (selectedCell) selectedCell.classList.remove('highlight');
  if (cell.classList.contains('fixed')) return;
  selectedCell = cell;
  cell.classList.add('highlight');
}

function handleNumberInput(e) {
  if (!selectedCell || !gameActive) return;
  const index = parseInt(selectedCell.dataset.index);
  const row = Math.floor(index / 9);
  const col = index % 9;

  if (e.key >= '1' && e.key <= '9') {
    const num = parseInt(e.key);
    selectedCell.textContent = num;
    userBoard[row][col] = num;
  } else if (e.key === 'Backspace' || e.key === 'Delete') {
    selectedCell.textContent = '';
    userBoard[row][col] = 0;
  }

  if (isBoardComplete()) checkSolution();
}

function isBoardComplete() {
  return userBoard.flat().every(val => val !== 0);
}

function checkSolution() {
  const cells = document.querySelectorAll('.cell');
  let hasErrors = false;
  cells.forEach(cell => cell.classList.remove('error'));

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const value = userBoard[i][j];
      const index = i * 9 + j;
      if (value === 0) continue;
      if (value !== solution[i][j]) {
        cells[index].classList.add('error');
        hasErrors = true;
      }
    }
  }

  if (hasErrors) showMessage('Some numbers are incorrect. Keep trying!', 'error');
  else if (isBoardComplete()) gameComplete();
  else showMessage('All entered numbers are correct!', 'success');
}

function gameComplete() {
  clearInterval(timerInterval);
  gamesSolved++;
  totalTime += elapsedTime;
  if (elapsedTime < bestTime) bestTime = elapsedTime;
  updateStats();
  saveStats();
  showMessage('Congratulations! Puzzle solved correctly!', 'success');
  gameActive = false;
}

function showMessage(text, type) {
  messageElement.textContent = text;
  messageElement.className = 'message ' + type;
  messageElement.style.display = 'block';
  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 3000);
}

function provideHint() {
  if (!selectedCell || !gameActive) return;
  const index = parseInt(selectedCell.dataset.index);
  const row = Math.floor(index / 9);
  const col = index % 9;
  if (userBoard[row][col] !== 0) return;

  const correctNum = solution[row][col];
  selectedCell.textContent = correctNum;
  userBoard[row][col] = correctNum;
  selectedCell.classList.remove('highlight');
  selectedCell = null;
  showMessage('Hint applied!', 'success');
  if (isBoardComplete()) checkSolution();
}

function resetPuzzle() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    if (!cell.classList.contains('fixed')) cell.textContent = '';
  });
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) userBoard[i][j] = 0;
    }
  }
  if (selectedCell) {
    selectedCell.classList.remove('highlight');
    selectedCell = null;
  }
  messageElement.style.display = 'none';
  startTimer();
}

function loadStats() {
  const storedStats = JSON.parse(localStorage.getItem('sudokuStats'));
  const stats = {
    gamesPlayed: Number(storedStats?.gamesPlayed) || 0,
    gamesSolved: Number(storedStats?.gamesSolved) || 0,
    bestTime: Number(storedStats?.bestTime) || Infinity,
    totalTime: Number(storedStats?.totalTime) || 0
  };

  gamesPlayed = stats.gamesPlayed;
  gamesSolved = stats.gamesSolved;
  bestTime = stats.bestTime;
  totalTime = stats.totalTime;

  updateStats();
}

function saveStats() {
  const stats = { gamesPlayed, gamesSolved, bestTime, totalTime };
  localStorage.setItem('sudokuStats', JSON.stringify(stats));
}

function updateStats() {
  gamesPlayedElement.textContent = gamesPlayed;
  gamesSolvedElement.textContent = gamesSolved;

  if (bestTime === Infinity || isNaN(bestTime)) {
    bestTimeElement.textContent = '00:00';
  } else {
    const mins = Math.floor(bestTime / 60).toString().padStart(2, '0');
    const secs = (bestTime % 60).toString().padStart(2, '0');
    bestTimeElement.textContent = `${mins}:${secs}`;
  }

  if (gamesSolved === 0 || isNaN(totalTime)) {
    avgTimeElement.textContent = '00:00';
  } else {
    const avg = Math.floor(totalTime / gamesSolved);
    const mins = Math.floor(avg / 60).toString().padStart(2, '0');
    const secs = (avg % 60).toString().padStart(2, '0');
    avgTimeElement.textContent = `${mins}:${secs}`;
  }
}

function resetStats() {
  gamesPlayed = 0;
  gamesSolved = 0;
  bestTime = Infinity;
  totalTime = 0;
  updateStats();
  saveStats();
}

function setupEventListeners() {
  boardElement.addEventListener('click', handleCellClick);
  document.addEventListener('keydown', handleNumberInput);
  document.getElementById('new-game').addEventListener('click', generatePuzzle);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('reset').addEventListener('click', () => {
    document.getElementById('reset-modal').style.display = 'flex';
  });
  document.getElementById('hint').addEventListener('click', provideHint);
  document.getElementById('reset-stats').addEventListener('click', resetStats);
  document.getElementById('cancel-reset').addEventListener('click', () => {
    document.getElementById('reset-modal').style.display = 'none';
  });
  document.getElementById('confirm-reset').addEventListener('click', () => {
    document.getElementById('reset-modal').style.display = 'none';
    resetPuzzle();
  });
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      difficulty = e.target.dataset.diff;
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      generatePuzzle();
    });
  });
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function isValidPlacement(grid, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[boxRow + i][boxCol + j] === num) return false;
    }
  }
  return true;
}

window.onload = initGame;

const socket = io();

let currentPlayer = 'red';
let board = ['', '', '', '', '', '', '', '', ''];
let playerMarks = { red: [], blue: [] };
let lastMove = { red: null, blue: null };

socket.on('moveMade', (data) => {
	const { index, player } = data;
	makeMove(index, player, false);
});

document.querySelectorAll('.cell').forEach((cell, index) => {
	cell.addEventListener('click', () => {
		if (!board[index] && currentPlayer === player) {
			makeMove(index, currentPlayer, true);
		}
	});
});

function makeMove(index, player, emit = true) {
	if (emit) {
		socket.emit('makeMove', { index, player });
	}

	if (lastMove[player] !== null) {
		document.querySelectorAll('.cell')[lastMove[player]].classList.remove('fading');
	}

	board[index] = player;
	playerMarks[player].push(index);
	lastMove[player] = index;

	updateBoard();
	checkWinner();

	if (playerMarks[player].length > 3) {
		const oldIndex = playerMarks[player].shift();
		board[oldIndex] = '';
		document.querySelectorAll('.cell')[oldIndex].classList.remove(player);
		document.querySelectorAll('.cell')[oldIndex].classList.remove('fading');
	}

	currentPlayer = currentPlayer === 'red' ? 'blue' : 'red';
	if (lastMove[currentPlayer] !== null) {
		document.querySelectorAll('.cell')[lastMove[currentPlayer]].classList.add('fading');
	}
}

function updateBoard() {
	board.forEach((cell, index) => {
		const cellElement = document.querySelectorAll('.cell')[index];
		cellElement.classList.remove('red', 'blue');
		if (cell) {
			cellElement.classList.add(cell);
		}
	});
}

function checkWinner() {
	const winningCombinations = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8],
		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8],
		[0, 4, 8],
		[2, 4, 6]
	];

	let winner = null;

	winningCombinations.forEach(combination => {
		const [a, b, c] = combination;
		if (board[a] && board[a] === board[b] && board[a] === board[c]) {
			winner = board[a];
		}
	});

	if (winner) {
		document.getElementById('message').textContent = `${winner.toUpperCase()} wins!`;
		document.querySelectorAll('.cell').forEach(cell => cell.removeEventListener('click', handleClick));
	}
}

document.getElementById('reset').addEventListener('click', () => {
	board = ['', '', '', '', '', '', '', '', ''];
	playerMarks = { red: [], blue: [] };
	lastMove = { red: null, blue: null };
	currentPlayer = 'red';
	document.querySelectorAll('.cell').forEach((cell, index) => {
		cell.classList.remove('red', 'blue', 'fading');
		cell.addEventListener('click', handleClick);
	});
	document.getElementById('message').textContent = '';
});

function handleClick(event) {
	const index = Array.from(document.querySelectorAll('.cell')).indexOf(event.target);
	if (!board[index] && currentPlayer === player) {
		makeMove(index, currentPlayer, true);
	}
}

if (lastMove[currentPlayer] !== null) {
	document.querySelectorAll('.cell')[lastMove[currentPlayer]].classList.add('fading');
}

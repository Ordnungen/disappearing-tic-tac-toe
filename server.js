const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = {};

wss.on('connection', (ws) => {
	let playerColor = null;

	ws.on('message', (message) => {
		const data = JSON.parse(message);
		switch (data.type) {
			case 'create':
				const roomKey = generateRoomKey();
				rooms[roomKey] = {
					players: [ws],
					board: ['', '', '', '', '', '', '', '', ''],
					moveHistory: [],
					currentPlayer: 'red',
					scores: { red: 0, blue: 0 },
					nextTransparentIndex: null
				};
				ws.send(JSON.stringify({ type: 'created', roomKey, color: 'red' }));
				playerColor = 'red';
				break;
			case 'join':
				const room = rooms[data.roomKey];
				if (room && room.players.length < 2) {
					const color = room.players.length === 0 ? 'red' : 'blue';
					room.players.push(ws);
					room.currentPlayer = 'red';
					ws.send(JSON.stringify({ type: 'joined', roomKey: data.roomKey, color }));
					room.players.forEach(player => player.send(JSON.stringify({
						type: 'start',
						currentPlayer: room.currentPlayer,
						nextTransparentIndex: room.nextTransparentIndex
					})));
					playerColor = color;
				} else {
					ws.send(JSON.stringify({ type: 'error', message: 'Room not found or full' }));
				}
				break;
			case 'move':
				const gameRoom = rooms[data.roomKey];
				if (gameRoom && data.currentPlayer === playerColor) {
					gameRoom.board[data.index] = data.currentPlayer;
					gameRoom.moveHistory.push(data.index);

					if (gameRoom.moveHistory.length > 6) {
						const lastMoveIndex = gameRoom.moveHistory.shift();
						gameRoom.board[lastMoveIndex] = '';
					}

					gameRoom.nextTransparentIndex = gameRoom.moveHistory.length > 0
						? gameRoom.moveHistory[0]
						: null;

					const winner = checkWin(gameRoom.board, data.currentPlayer);
					if (winner) {
						gameRoom.scores[winner]++;
						gameRoom.nextTransparentIndex = null;
					}

					gameRoom.currentPlayer = gameRoom.currentPlayer === 'red' ? 'blue' : 'red';

					gameRoom.players.forEach(player => player.send(JSON.stringify({
						type: 'update',
						board: gameRoom.board,
						moveHistory: gameRoom.moveHistory,
						currentPlayer: gameRoom.currentPlayer,
						winner: winner ? winner : null,
						scores: gameRoom.scores,
						nextTransparentIndex: gameRoom.nextTransparentIndex
					})));
				}
				break;
		}
	});

	ws.on('close', () => {
		for (const roomKey in rooms) {
			const room = rooms[roomKey];
			room.players = room.players.filter(player => player !== ws);
			if (room.players.length === 0) {
				delete rooms[roomKey];
			}
		}
	});
});

function generateRoomKey() {
	return Math.random().toString(36).substring(2, 8);
}

function checkWin(board, player) {
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
	return winningCombinations.some(combination => {
		return combination.every(index => {
			return board[index] === player;
		});
	}) ? player : null;
}

app.use(express.static('public'));

server.listen(3000, () => {
	console.log('Server is listening on port 3000');
});

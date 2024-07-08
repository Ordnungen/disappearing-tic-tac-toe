const socket = new WebSocket(`ws://${window.location.host}`);
let roomKey = null;
let currentPlayer = null;

document.getElementById('create-room').addEventListener('click', () => {
	socket.send(JSON.stringify({ type: 'create' }));
});

document.getElementById('join-room').addEventListener('click', () => {
	const key = document.getElementById('room-key').value;
	socket.send(JSON.stringify({ type: 'join', roomKey: key }));
});

document.querySelectorAll('.cell').forEach(cell => {
	cell.addEventListener('click', () => {
		if (!cell.dataset.player && roomKey && currentPlayer) {
			const index = cell.dataset.index;
			socket.send(JSON.stringify({
				type: 'move',
				roomKey: roomKey,
				index: index,
				currentPlayer: currentPlayer
			}));
		}
	});
});

socket.onmessage = (event) => {
	const data = JSON.parse(event.data);
	switch (data.type) {
		case 'created':
			roomKey = data.roomKey;
			document.querySelector('.menu').style.display = 'none';
			document.querySelector('.board').style.display = 'grid';
			document.querySelector('.info').style.display = 'block';
			document.getElementById('message').textContent = `Комната создана. Ключ: ${roomKey}. Ожидание игрока...`;
			break;
		case 'joined':
			roomKey = data.roomKey;
			document.querySelector('.menu').style.display = 'none';
			document.querySelector('.board').style.display = 'grid';
			document.querySelector('.info').style.display = 'block';
			break;
		case 'start':
			currentPlayer = data.currentPlayer;
			document.getElementById('message').textContent = `Ход игрока: ${currentPlayer.toUpperCase()}`;
			break;
		case 'update':
			currentPlayer = data.currentPlayer;
			document.querySelectorAll('.cell').forEach((cell, index) => {
				cell.dataset.player = data.board[index];
				if (data.nextDisappear === index) {
					cell.classList.add('next-transparent');
				} else {
					cell.classList.remove('next-transparent');
				}
			});
			if (data.winner) {
				document.getElementById('message').textContent = `${data.winner.toUpperCase()} выиграл!`;
				setTimeout(() => {
					document.querySelectorAll('.cell').forEach(cell => cell.dataset.player = '');
					document.getElementById('message').textContent = `Новая игра началась. Ход игрока: ${currentPlayer.toUpperCase()}`;
				}, 2000);
			} else {
				document.getElementById('message').textContent = `Ход игрока: ${currentPlayer.toUpperCase()}`;
			}
			break;
		case 'error':
			alert(data.message);
			break;
	}
};

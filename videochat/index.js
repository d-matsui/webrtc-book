// 静的ページ配信のためにexpressを利用
let express = require('express');
let app = express();
let server = require('http').Server(app);
// 9000ポートで起動
server.listen(9000, '0.0.0.0');
// htdocsディレクトリーの中身を静的ファイルとして配信する
app.use(express.static(__dirname + '/htdocs/'));

// WebSocket接続のためにsocket.ioを利用
let io = require('socket.io')(server);
let namespace = '/webrtc-demo';
let idPrefix = namespace + '#';
let ns = io.of(namespace);

// 参加者一覧のオブジェクト
let peers = {};

ns.on('connection', (socket) => {
	/**
	 * チャットルームに入室した
	 */
	socket.on('login', (data) => {
		// 参加者一覧のオブジェクトに追加
		let joinedAt = new Date().toISOString();
		peers[socket.id] = {
			id: socket.id.slice(idPrefix.length),
			userName: data.userName,
			joinedAt: joinedAt
		};
		// 参加成功を通知
		socket.emit('joined', {success: true, joinedAt: joinedAt});
		// 参加者リストを通知
		updateMembers();
	});

	/**
	 * 接続が切断された
	 */
	socket.on('disconnect', () => {
		delete peers[socket.id];
		// 参加者リストを通知
		updateMembers();
	});

	/**
	 * 他ユーザ宛てのメッセージが送信された
	 */
	socket.on('signaling', (data) => {
		if(!data.to){
			// 宛先が指定されていなかったら無視
			return;
		}
		// data.toで指定されたユーザにメッセージをそのまま転送
		ns.to(idPrefix + data.to).emit('signaling', data);
	});
});

// 参加者リストを通知
function updateMembers() {
	// 参加者リストを生成
	let peerList = Object.keys(ns.sockets).map((id) => {
		return peers[id]
	}).filter((peer) => {
		return !!peer;
	});
	// ピア全員に参加者の情報を送信
	ns.emit('update peers', peerList);
}

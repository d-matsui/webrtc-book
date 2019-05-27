let connectionManager;
let loginForm = document.querySelector('#loginForm');
let peers = document.querySelector('#peers');
let byeButton = document.querySelector('#bye');
let logoutButton = document.querySelector('#logout');
let localStreamElem = document.querySelector('#localStream');
let remoteStreamsElem = document.querySelector('#remoteStreams');

class ConnectionManager{
	constructor(socket, localStream){
		this.socket = socket;
		this.localStream = localStream;
		this.connection = null;
		this.joinedAt = null;

		// シグナリングサーバーに接続したとき
		this.socket.on('connect', () => {
			console.log('シグナリングサーバーに接続しました');
		});
		// ログインに成功したとき
		this.socket.on('joined', (data) => {
			console.log('ログインに成功しました');
			this.joinedAt = data.joinedAt;
			// ログインフォームを非表示にし、参加者リストを表示
			loginForm.classList.add('hide');
			peers.classList.remove('hide');
			logoutButton.classList.remove('hide');
		});
		// 参加者リストが更新されたとき
		this.socket.on('update peers', (data) => {
			console.log('参加者に変化がありました');
			console.log(data);
			// 一旦参加者リストの表示を削除
			while (peers.hasChildNodes()) {
				peers.removeChild(peers.lastChild);
			}
			data.forEach((peer) => {
				// 参加者リストには自分も含まれているので、自分は表示しない
				if(peer.id == this.socket.id){
					return;
				}
				let peerElement = document.createElement('button');
				peerElement.dataset.id = peer.id; // data属性でIDを埋め込んでおく
				peerElement.appendChild(document.createTextNode(peer.userName));
				let li = document.createElement('li');
				li.appendChild(peerElement);
				peers.appendChild(li);
			});
		});

		// シグナリングメッセージを受信したとき
		this.socket.on('signaling', (data) => {
			if(this.connection && data.from == this.connection.peerId){
				// すでに接続が開始されており、その相手からのメッセージのとき
				this.connection.onReceiveSignalingMessage(data);
			}else if(!this.connection && data.event == 'offer'){
				// 接続が開始されてない状態で通話要求を受けたとき
				this.createNewConnection(data.from);
				this.connection.onReceiveOffer(data);
			}
		});
	}
	createNewConnection(peerId){
		this.connection = new VideoChatConnection(this, peerId);
		byeButton.classList.remove('hide');
		peers.classList.add('hide');
	}
	/**
	 * シグナリングサーバーにメッセージを送信する
	 */
	sendMessage(toId, event, data){
		this.socket.emit('signaling', {
			event: event,
			from: this.socket.id,
			to: toId,
			data: data
		});
	}
	/**
	 * 通話を切断する
	 */
	bye(){
		if(this.connection){
			this.connection.bye();
			this.connection = null;
		}
		byeButton.classList.add('hide');
		peers.classList.remove('hide');
	}
	/**
	 * ログアウト
	 */
	logout(){
		this.bye();
		this.socket.close();
		this.socket = null;
		loginForm.classList.remove('hide');
		logoutButton.classList.add('hide');
		peers.classList.add('hide');
	}
}

class VideoChatConnection{
	constructor(manager, peerId){
		this.manager = manager;
		this.peerId = peerId;  // 通話相手のID
		console.log('RTCPeerConnectionを生成');
		this.pc = new RTCPeerConnection({});  // 通話相手とのWebRTC接続
		// 手元のWebカメラの映像をビデオソースに指定する
		if('addTrack' in this.pc){
			// 新仕様
			console.log('自分のメディアストリームを追加（新仕様）');
			this.manager.localStream.getTracks().forEach((track) => {
				this.pc.addTrack(track, this.manager.localStream);
			});
		}else{
			// 旧仕様
			console.log('自分のメディアストリームを追加（旧仕様）');
			this.pc.addStream(this.manager.localStream);
		}

		// 自分の通信経路候補が見つかったとき
		this.pc.onicecandidate = (event) => {
			if (event.candidate) {
				console.log('通信経路候補を通話相手に送信');
				this.sendMessage('icecandidate',
					{
						candidate: event.candidate.candidate,
						sdpMLineIndex: event.candidate.sdpMLineIndex,
						sdpMid: event.candidate.sdpMid
					}
				);
			}
		};
		// 相手からの映像ストリームが届いたとき
		if (typeof this.pc.ontrack != 'undefined') {
			// 新仕様
			this.pc.ontrack = (event) => {
				// ontrackイベントはvideoとaudioで2回発火するが、videoのときのみ処理を行う
				if(event.track.kind == 'video'){
					console.log('相手の映像を表示する（新仕様）');
					let videoElem = document.createElement('video');
					videoElem.id = 'remote_' + this.peerId;
					videoElem.srcObject = event.streams[0];
					videoElem.autoplay = true;
					remoteStreamsElem.appendChild(videoElem);
				}
			};
		}else{
			// 旧仕様
			this.pc.onaddstream = (event) => {
				console.log('相手の映像を表示する（旧仕様）');
				let videoElem = document.createElement('video');
				videoElem.id = 'remote_' + this.peerId;
				videoElem.srcObject = event.stream;
				// 自動再生を有効化しておかないと静止画のままになる
				videoElem.autoplay = true;
				remoteStreamsElem.appendChild(videoElem);
			};
		}

		this.pc.oniceconnectionstatechange = (event) => {
			console.log('iceConnectionState: ' + this.pc.iceConnectionState);
			if(this.pc.iceConnectionState == 'completed'){
				peers.classList.add('hide');
			}else if(this.pc.iceConnectionState == 'disconnected'){
				this.manager.bye();
			}
		};
		this.pc.onicegatheringstatechange = (event) => {
			console.log('iceGatheringState: ' + this.pc.iceGatheringState);
		};
		this.pc.onsignalingstatechange = (event) => {
			console.log('signalingState: ' + this.pc.signalingState);
		};
	}
	/**
	 * シグナリングサーバーにメッセージを送信する
	 */
	sendMessage(event, data){
		this.manager.sendMessage(this.peerId, event, data);
	}

	// （呼び出し元）通話開始を要求
	async sendOffer(){
		console.log('オファーSDPを生成');
		let offerSdp = await this.pc.createOffer();
		console.log('生成したオファーSDPをLocalDescriptionに設定');
		await this.pc.setLocalDescription(offerSdp);
		console.log('接続したい相手にオファーSDPを送信');
		this.sendMessage('offer', offerSdp);
	}

	// （呼び出し先）② 相手から呼び出された（オファーSDPが送信されてきた）とき
	async onReceiveOffer(data){
		console.log('相手から送られたオファーSDPをRemoteDescriptionに設定');
		await this.pc.setRemoteDescription(new RTCSessionDescription(data.data));
		console.log('オファーに対するアンサーSDPを生成');
		let answerSdp = await this.pc.createAnswer();
		console.log('生成したアンサーSDPをLocalDescriptionに設定');
		await this.pc.setLocalDescription(answerSdp);
		console.log('呼び出し元にアンサーSDPを送信');
		this.sendMessage('answer', answerSdp);
	}

	async onReceiveSignalingMessage(data){
		if (data.event == 'answer'){
			// （呼び出し元）③ 相手からアンサーSDPが送信されてきたとき
			console.log('相手から送られたアンサーSDPをRemoteDescriptionに設定');
			await this.pc.setRemoteDescription(new RTCSessionDescription(data.data));
		}else if(data.event == 'icecandidate') {
			// （呼び出し元・呼び出し先共通）⑤ 通話相手の通信経路候補が送られたとき
			console.log('相手から送られた通信経路候補を登録');
			console.log(data.data);
			await this.pc.addIceCandidate(new RTCIceCandidate(data.data));
		}
	}

	// 終話
	bye(){
		// 接続をクローズ
		this.pc.close();
		console.log(this.peerId + 'との接続を終了');
		remoteStreamsElem.removeChild(
			document.querySelector('#remote_' + this.peerId)
		);
	}
}

// ユーザー名を入力してログインボタンを押したらチャットルームに参加
loginForm.addEventListener('submit', async function(event) {
	event.preventDefault();
	try{
		let userName = document.getElementById('userName').value;
		if (!userName) {
			return;
		}
		let localStream = await navigator.mediaDevices.getUserMedia(
			{audio: true, video: true}
		);
		let socket = io.connect(location.host + '/webrtc-demo');
		connectionManager = new ConnectionManager(socket, localStream);

		// getUserMediaに成功したら手元のWebカメラの映像を表示する
		localStreamElem.srcObject = localStream;
		localStreamElem.classList.remove('hide');
		// チャットルームに参加したことをサーバーに通知
		console.log('ユーザー名“' + userName + '”でログインします');
		socket.emit('login', {userName: userName});
	}catch(e){
		alert('メディアストリームの取得に失敗しました');
	}
});

// （呼び出し元）① 名前ボタンをクリックしたら他のピアを呼び出す
peers.addEventListener('click', (event) => {
	if (event.target.nodeName != 'BUTTON') return;
	connectionManager.createNewConnection(event.target.dataset.id);
	connectionManager.connection.sendOffer();
	peers.classList.add('hide');
});

// 終話ボタンが押されたら通話を切断する
byeButton.addEventListener('click', () => {
	connectionManager.bye();
});

// ログアウトボタンが押されたらすべての接続を解除する
logoutButton.addEventListener('click', () => {
	localStreamElem.srcObject = null;
	localStreamElem.classList.add('hide');
	connectionManager.logout();
	connectionManager = null;
});

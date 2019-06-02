// 発信側
let pc = createRTCPeerConnection();
// オファー SDP を生成
let offerSdp = await pc.createOffer();
// 生成したオファー SDP を LocalDescription に設定
await pc.setLocalDescription(offerSdp);
// ボブにオファー SDP を送信し、通話開始を要求
// ※ ws は WevSocket 接続オブジェクト
// ※ この部分は仕様で定められていないので自由に実装できる
ws.send({
    // ここの名前をどう決めればよいか? -daiki [2019/06/02]
    to: 'Bob',
    event: 'offer',
    sdp: offerSdp
});

// 着信側
ws.onmessage = async (e) => {
    if(e.data.event == 'offer'){
        let pc = createRTCPeerConnection();
        // 相手から送られてきたオファー SDP を LocalDescription に設定
        await pc.setRemoteDescription(e.data.sdp);
        // オファーに対するアンサー SDP を生成
        let answerSdp = await pc.createAnser();
        // 生成したアンサー SDP を LocalDescription に設定
        await pc.setLocalDescription(answerSdp);
        // アリスにアンサー SDP を送信
        ws.send({
            // ここの名前をどう決めればよいか? -daiki [2019/06/02]
            to: 'Alice',
            event: 'answer',
            sdp: answerSdp
        });
    }
};

// 発信側
// WebSocket メッセージを受信
ws.onmessage = async (e) => {
    if(e.data.event == 'answer'){
        // 相手から送られてきたオファー SDP を RemoteDescription に設定
        await pc.setRemoteDescription(new RTCSessionDescription(e.data.sdb));
    }
};

// 発信側・着信側共通
// RTCPeerConnection オブジェクトの生成や、メディアストリームの登録
// 各種コールバック関数の設定は発信側・着信側の両方で行うので、関数化しておくと便利
// return なしで pc オブジェクトが返される? -daiki [2019/06/02]
function createRTCPeerConnection(){
    let pc = new RTCPeerConnection({
        iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
        // iceServers: [{urls: 'stun:160.16.144.229:3478'}],
        iceTransportPolicy: 'all'
    });

    // ※ localStream は Wev カメラ等から取得したメディアストリーム
    // ※ メディアストリームは事前に取得できている想定
    if('addTrack' in pc){
        // 新仕様
        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
        });
    }else{
        // 旧仕様
        pc.addStream(localStream);
    }

    // ※ remoteVideoElem は映像の再生を行う video 要素
    if (typeof pc.ontrack != 'undefined'){
        // 新仕様
        pc.ontrack = (event) => {
            if(event.track.kind == 'video'){
                remoteVideoElem.srcObject = event.streams[0];
            }
        };
    }else{
        // 旧仕様
        pc.onaddstream = (event) => {
            remoteVideoElem.srcObject = event.stream;
        };
    }
}

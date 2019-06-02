// 通信経路を見つけた
// 通信経路が見つかったとき
pc.onicecandiate = (event) => {
    if (event.candidate){
        // 通信経路候補を通話相手に教えるため送信
        ws.send({
            to: remoteUser,
            event: 'icecandiate',
            data: event.candidate,
        });
    }else{
        // 通信経路候補を見つけ終えたら event.candidate は空
    }
};

// 相手から通信経路候補が送られてきた
// WebSocket メッセージを受信
ws.onmessage = async (e) => {
    if(e.data.event == 'icecandidate'){
        await pc.addIceCandidate(new RTCIceCandidate(e.data.data));
    }
};

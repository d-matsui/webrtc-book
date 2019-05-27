// let
// try, catch
// async
// await
// document オブジェクト
// document.getElementById()
// captureButton オブジェクト
// captureButton.addEventListener()
// navigatorオブジェクト
// navigator.mediaDevices オブジェクト
// navigator.mediaDevices.getUserMedia()
// document.createElement()
// mediaElement オブジェクト
// mediaElement.srcObject オブジェクト
// mediaElement.setAttribute()
// document.body オブジェクト
// document.body.appendChild()
// console.log()
// alert()
// event.preventDefault()

let captureButton = document.getElementById('capture');
captureButton.addEventListener('click', async (event) => {
    try{
        let mediaStream = await navigator.mediaDevices.getUserMedia(
            // 取得したストリームの条件を指定する
            {video: true, audio: true}
        );
        // メディアストリームを再生する video タグを生成 (音声だけなら audio タグでも可)
        let mediaElement = document.createElement('video');
        // 取得したメディアストリームを srcObject 属性に設定する
        mediaElement.srcObject = mediaStream;
        // mediaElement.srcObject? -daiki [2019/05/27]
        // 自動再生を設定 (これを忘れると再生されない)
        mediaElement.autoplay = true;
        // インライン再生を許可する playsinline 属性 (iPhone で必要)
        mediaElement.setAttribute('playsinline', 'true');
        // video タグを貼り付ける
        document.body.appendChild(mediaElement);
        // 取得開始ボタンを削除
        document.body.removeChild(captureButton);
    }catch(error){
        // メディアストリーム取得失敗時
        // ブラウザによってエラーオブジェクトの型が異なる
        console.log(error);
        alert('デバイスを利用できませんでした');
    }
    event.preventDefault();
});

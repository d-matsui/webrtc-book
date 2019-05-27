# わか（った気にな）るWebRTC 付録サンプルアプリ

## セットアップ方法

このサンプルアプリでは、サーバー側プログラムの実装にNode.jsを利用しています。
Node.jsをインストールしていない場合は、公式サイトなどのドキュメントを参照の上、インストールしてください。

    $ npm install

## アプリの起動と実行

次のコマンドを実行すると、ポート番号9000でサンプルアプリが起動します。

    $ npm start
    または
    $ node index.js

アプリを実行するには、ブラウザーで http://localhost:9000/ にアクセスしてください。
サーバーを起動しているマシン以外からアクセスする場合は、localhostの部分を、サーバーを起動しているマシンのIPアドレスに置き換えてください。
※ただし、この場合はChromeは利用できません。Chromeでは、localhost以外でMedia Capture APIを利用する場合はHTTPSで接続しなければならないためです。

## ライセンス

このサンプルアプリの内容物はMITライセンスとします。

Copyright 2017 mzsm

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
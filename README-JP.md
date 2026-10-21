<img src="./assets/mqttx-logo.png" width="480" alt="MQTTX Logo" />

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases)
![Support Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey)
![build packages](https://github.com/emqx/MQTTX/workflows/build%20packages/badge.svg)
[![Total Downloads](https://img.shields.io/github/downloads/emqx/mqttx/total.svg)](https://github.com/emqx/mqttx/releases)
[![Slack](https://img.shields.io/badge/Slack-EMQX-39AE85?logo=slack)](https://slack-invite.emqx.io/) [![Discord](https://img.shields.io/badge/Discord-MQTTX-5865F2?logo=discord)](https://discord.gg/xYGf3fQnES)
[![Community](https://img.shields.io/badge/Community-MQTTX-yellow?logo=github)](https://github.com/emqx/MQTTX/discussions)
[![YouTube](https://img.shields.io/badge/Subscribe-EMQ-FF0000?logo=youtube)](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q)
[![X](https://img.shields.io/badge/Follow-EMQTech-000000?logo=x&logoColor=white)](https://x.com/EMQTech)

---

[MQTTX](https://mqttx.app/) は、[EMQ](https://www.emqx.com/en) が提供する、IoT アプリケーションの開発、テスト、トラブルシューティング向けのオープンソースのクロスプラットフォーム [MQTT 5.0](https://www.emqx.com/en/blog/introduction-to-mqtt-5) クライアントツールセットです。[MQTTX Desktop](https://mqttx.app/docs) は macOS、Windows、Linux に対応し、チャット形式のインターフェースで複数の接続とサブスクリプションを管理でき、自然言語で接続の作成、メッセージの送受信、問題の調査ができる MQTTX Agent を内蔵しています。[MQTTX CLI](https://mqttx.app/docs/cli) はターミナルや自動化ワークフロー向けにメッセージの送受信、ベンチマーク、データのシミュレーションを提供し、[MQTTX Web](https://mqttx.app/web-client) はデスクトップアプリをインストールせずに、ブラウザーから WebSocket 経由で MQTT サービスをデバッグできます。

> [MQTT](https://www.emqx.com/ja/blog/the-easiest-guide-to-getting-started-with-mqtt)（Message Queuing Telemetry Transport）は、パブリッシュ/サブスクライブ型の軽量なメッセージングプロトコルです。制約のあるデバイスや、低帯域幅、高遅延、または不安定なネットワークでの利用を想定して設計されています。

![mqttx-preview](./assets/mqttx-preview.png)

## 機能

- デスクトップ版と CLI は、TCP、TLS、WebSocket 経由で MQTT 3.1、3.1.1、5.0 に対応します。
- デスクトップ版では、接続のグループ化、メッセージ検索、接続設定のインポート・エクスポートができます。
- デスクトップ版は JSON、Base64、Hex などのエンコード・デコード、Protobuf/Avro スキーマ、GZIP 解凍に対応します。
- デスクトップ版のスクリプトと定期送信で動作をテストし、トピックツリー、ダッシュボード、ペイロードインスペクターでデータを分析できます。
- CLI で負荷テストや IoT データのシミュレーションを行い、標準入力とパイプでシェルスクリプトや CI ワークフローと連携できます。
- Web 版は WebSocket 経由で MQTT 3.1.1 と 5.0 に対応し、Docker によるセルフホストも可能です。

## クイックスタート

### MQTTX Desktop

[GitHub Releases](https://github.com/emqx/MQTTX/releases) または [EMQ のダウンロードサイト](https://www.emqx.com/downloads/MQTTX/) から、プラットフォームに合ったインストーラーをダウンロードしてください。[Mac App Store](https://apps.apple.com/jp/app/mqttx/id1514074565?mt=12)、[Snap](https://snapcraft.io/mqttx)、[Flathub](https://flathub.org/apps/details/com.emqx.MQTTX) からもインストールできます。macOS では Homebrew も利用できます。

```shell
brew install --cask mqttx
```

1. MQTTX を開き、左側のサイドバーの `+` をクリックして接続を作成します。
2. ブローカーのアドレスを入力し、`Connect` をクリックします。独自のブローカー、またはパブリックテストサーバー `broker.emqx.io`（TCP ポート `1883`、TLS ポート `8883`）を使用できます。
3. トピックをサブスクライブし、同じトピックに JSON メッセージをパブリッシュします。受信した内容がメッセージ一覧に表示されます。

![mqttx-gif](./assets/mqttx-gif.gif)

### MQTTX CLI

インストール方法を 1 つ選んでください。npm を使う前に、[インストールガイド](./INSTALL.md#npm)で Node.js の要件を確認してください。[ダウンロードページ](https://mqttx.app/downloads)ではスタンドアロンのバイナリも提供しています。

```shell
# macOS (Homebrew)
brew install emqx/mqttx/mqttx-cli

# または npm を使用
npm install --global mqttx-cli
```

インストール後、2 つのターミナルでそれぞれサブスクライブとパブリッシュを実行すると、サブスクライブ側で JSON メッセージを受信できます。

```shell
# ターミナル 1：サブスクライブ
mqttx sub -h broker.emqx.io -t 'mqttx/quickstart'

# ターミナル 2：パブリッシュ
mqttx pub -h broker.emqx.io -t 'mqttx/quickstart' -m '{"temperature":23.5}'
```

その他のコマンド、負荷テスト、データのシミュレーションについては [CLI ドキュメント](https://mqttx.app/docs/cli)を参照してください。

### MQTTX Web

ブラウザーで[オンラインクライアント](https://mqttx.app/web-client)を開き、`ws://` または `wss://` でブローカーに接続します。HTTPS ページでは `wss://` を使用してください。Docker でセルフホストすることもできます。

```shell
docker run -d --name mqttx-web -p 80:80 emqx/mqttx-web:latest
```

デプロイと使用方法は [Web README](./web/README.md)を参照してください。

## AI による支援

### デスクトップ版の MQTTX Agent

**設定 → MQTTX Agent** で有効にしてモデルを設定し、左側のサイドバーから開くか、`Cmd/Ctrl + J` でフローティングウィンドウを表示します。スキル、MCP、操作の承認、モデル設定については [MQTTX Agent ガイド](./docs/desktop/en/use-desktop/agent.md)を参照してください。

### 外部 AI エージェントと CLI スキル

AI エージェントに [mqttx-cli スキル](./skills/mqttx-cli/SKILL.md)をインストールすると、MQTTX CLI を使って MQTT のテストやトラブルシューティングを実行できます。

```shell
npx skills add emqx/MQTTX --skill mqttx-cli
```

インストール後は、たとえば次のように依頼できます。

> mqttx-cli スキルを使って、127.0.0.1:1883 で動作するローカルブローカーのメッセージ送受信を検証してください。mqttx-test/ 配下の一意なトピックを使用し、15 秒以内に検証を終了して結果を報告してください。

CLI のインストールと更新については [INSTALL.md](./INSTALL.md)を、その他のスキルのインストール方法については [CLI README](./cli/README.md#ai-agent-support)を参照してください。

## EMQX と組み合わせて使う

MQTTX はあらゆる MQTT ブローカーに接続でき、EMQX との組み合わせにも適しています。EMQX または EMQX Cloud に接続して、アプリケーションのデバッグやブローカー機能の確認を行えます。

- [EMQX Cloud の 14 日間無料トライアル](https://www.emqx.com/en/try?product=cloud)
- [EMQX をダウンロードしてローカルで実行](https://www.emqx.com/en/try?product=enterprise)

## ドキュメントとコミュニティ

- ガイド：[Desktop](https://mqttx.app/docs)、[CLI](https://mqttx.app/docs/cli)、[Web](https://mqttx.app/docs/web)、[デスクトップ版マニュアル](./docs/manual-jp.md)。
- 学習リソース：[日本語の入門記事](https://qiita.com/emqx_japan/items/1ff6097fdfe273c5e22f)、[MQTT SDK とコード例](https://www.emqx.com/en/mqtt-client-sdk)。
- [パブリック MQTT テストサーバー](https://www.emqx.com/en/mqtt/public-mqtt5-broker)。
- 質問や情報交換には [GitHub Discussions](https://github.com/emqx/MQTTX/discussions)や [Discord](https://discord.gg/xYGf3fQnES)を利用できます。
- 最新情報は [X](https://x.com/EMQTech)と [YouTube](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q)で発信しています。

## 開発とコントリビューション

以下の手順はデスクトップ版向けです。[`.nvmrc`](./.nvmrc)に指定された Node.js を使用し、リポジトリのルートで `nvm use` を実行してから開発を始めてください。

```shell
git clone git@github.com:emqx/MQTTX.git
cd MQTTX
nvm use
yarn install
yarn run electron:serve
```

`yarn run electron:build` で全プラットフォームのインストーラーをビルドできます。単一のプラットフォーム向けには、`electron:build-win`、`electron:build-linux`、`electron:build-mac` の各 Yarn スクリプトを実行してください。出力先は `dist_electron` です。

CLI と Web の開発手順は [CLI README](./cli/README.md#develop)と [Web README](./web/README.md#develop)を参照してください。プルリクエストを作成する前に[コントリビューションガイド](./.github/CONTRIBUTING.md)をお読みください。

デスクトップ版は [Electron](https://electronjs.org/)、[Vue](https://vuejs.org/) + [Element](https://element.eleme.io)、[TypeScript](https://www.typescriptlang.org/)、[TypeORM](https://github.com/typeorm/typeorm)、[SQLite](https://github.com/TryGhost/node-sqlite3)、[MQTT.js](https://github.com/mqttjs/MQTT.js)で構築されています。

## License

Apache License 2.0, see [LICENSE](./LICENSE).

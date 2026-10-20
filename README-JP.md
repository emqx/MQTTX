<img src="./assets/mqttx-logo.png" width="480" alt="MQTTX Logo" />

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases)
![Support Platforms](https://camo.githubusercontent.com/a50c47295f350646d08f2e1ccd797ceca3840e52/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f706c6174666f726d2d6d61634f5325323025374325323057696e646f77732532302537432532304c696e75782d6c69676874677265792e737667)
![build packages](https://github.com/emqx/MQTTX/workflows/build%20packages/badge.svg)
[![Total Downloads](https://img.shields.io/github/downloads/emqx/mqttx/total.svg)](https://github.com/emqx/mqttx/releases)
[![Slack](https://img.shields.io/badge/Slack-EMQX-39AE85?logo=slack)](https://slack-invite.emqx.io/) [![Discord](https://img.shields.io/discord/931086341838622751?label=Discord&logo=discord)](https://discord.gg/xYGf3fQnES)
[![Community](https://img.shields.io/badge/Community-MQTTX-yellow?logo=github)](https://github.com/emqx/MQTTX/discussions)
[![YouTube](https://img.shields.io/badge/Subscribe-EMQ-FF0000?logo=youtube)](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q)
[![Twitter](https://img.shields.io/badge/Follow-EMQ-1DA1F2?logo=twitter)](https://x.com/EMQTech)

---

[MQTTX](https://mqttx.app/) は、[EMQ](https://www.emqx.com/en) が提供するオープンソースの [MQTT 5.0](https://www.emqx.com/en/blog/introduction-to-mqtt-5) クライアントです。macOS、Linux、Windows 向けの[デスクトップ版](https://mqttx.app/docs)、スクリプトやベンチマーク向けの[コマンドラインツール](https://mqttx.app/docs/cli)、ブラウザで使える [Web クライアント](https://mqttx.app/web-client)を提供しています。チャットアプリのようなインターフェイスで複数の接続を同時に扱え、TCP、TLS、WebSocket 上でのパブリッシュ、サブスクライブなどの MQTT 機能をすばやくテストできます。デスクトップ版には、自然言語で MQTTX を操作する AI エージェント「MQTTX Agent」も組み込まれています。

> [MQTT](https://www.emqx.com/ja/blog/the-easiest-guide-to-getting-started-with-mqtt)（Message Queuing Telemetry Transport）は、パブリッシュ/サブスクライブ型の軽量なメッセージングプロトコルです。制約のあるデバイスや、低帯域幅、高遅延、または不安定なネットワークでの利用を想定して設計されています。

## 機能

デスクトップ版の主な機能：

- **MQTTX Agent**：自然言語で MQTTX を操作し、接続の作成、サブスクライブ、パブリッシュ、メッセージの読み取り、問題の診断、クライアントコードの生成ができます。スキル（Skills）、MCP、操作の承認、複数のモデルプロバイダーに対応しています。
- **プロトコル**：MQTT 3.1、3.1.1、5.0 に対応し、TCP、TLS、WebSocket、セキュア WebSocket で接続できます。
- **MQTT 5.0**：接続・パブリッシュ・サブスクライブのユーザープロパティ、SCRAM 拡張認証、接続ページでの CONNACK レスポンス情報の表示。
- **ペイロード**：Plaintext、JSON、Base64、Hex、CBOR、MsgPack に対応し、Protobuf と Avro のスキーマも利用できます。受信メッセージの GZIP 自動解凍にも対応しています。
- **自動化**：スクリプトによる送信時・受信時のペイロード変換と、定期的なメッセージ送信。
- **ビューア**：トピックツリー、ダッシュボード、トラフィックモニター、JSON ツリーとメッセージ差分を備えたペイロードインスペクター。
- **ワークフロー**：メッセージ検索、接続ごとに独立したパブリッシュエリアと履歴、接続グループ。
- **データ**：接続を JSON、CSV、Excel、XML、YAML 形式でインポート・エクスポートできます。JSON バックアップは接続グループを保持します。
- **カスタマイズ**：ライト・ダーク・ナイトのテーマ。English、简体中文、日本語、Türkçe、Magyar、한국어 に対応。

## MQTTX Agent

MQTTX Agent はデスクトップ版に組み込まれた AI アシスタントです。**設定 → MQTTX Agent** で有効にし、プロバイダーの API ホスト、API キー、モデルを入力したうえで、左側のバーから全画面で開くか、`Cmd/Ctrl + J` でフローティングウィンドウとして開きます。

- ツールを通じて MQTTX を操作します。接続の作成と接続、サブスクライブとパブリッシュ、メッセージの読み取り、トピックツリーやダッシュボードの構築、設定した MCP サーバーの呼び出し、クライアントコードやテストデータ、スキーマの生成ができます。
- **操作の前に確認**（デフォルト）は変更の前に承認を求め、**自動**は確認なしで実行します。
- 会話とツールの実行結果は設定したモデルプロバイダーに送信されるため、チャットに秘密情報を入力しないでください。

セットアップ、スキル、MCP、権限、制限の詳細は [MQTTX Agent](./docs/desktop/en/use-desktop/agent.md) を参照してください。

## 機能プレビュー

![mqttx-preview](./assets/mqttx-preview.png)

## インストール

デスクトップ版は次の方法でインストールできます。

### macOS App Store

[![Download on the Mac App Store](./assets/app-store-download.svg)](https://apps.apple.com/jp/app/mqttx/id1514074565?mt=12)

### Homebrew

macOS では [Homebrew](https://formulae.brew.sh/cask/mqttx) でもインストールできます。

```shell
brew install --cask mqttx
```

### Linux

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/jp/snap-store-black.svg)](https://snapcraft.io/mqttx)
<a href='https://flathub.org/apps/details/com.emqx.MQTTX'><img height='56' alt='Download on Flathub' src='https://flathub.org/assets/badges/flathub-badge-en.png'/></a>

### リリースパッケージ

[GitHub Releases](https://github.com/emqx/MQTTX/releases) または [EMQ のダウンロードサイト](https://www.emqx.com/downloads/MQTTX/) から、お使いのプラットフォーム向けのパッケージをダウンロードしてください。

### MQTTX CLI

macOS では Homebrew、その他のプラットフォームでは npm でインストールできます。

```shell
brew install emqx/mqttx/mqttx-cli
npm install --global mqttx-cli
```

スタンドアロンのバイナリと Docker イメージも提供しています。詳しくは [MQTTX CLI README](./cli/README.md) または [MQTTX ダウンロードページ](https://mqttx.app/downloads) を参照してください。

### MQTTX Web

ブラウザで <https://mqttx.app/web-client> を開くとすぐに使えます。Docker で独自にデプロイすることもできます。

```shell
docker run -d --name mqttx-web -p 80:80 emqx/mqttx-web:latest
```

詳しくは [MQTTX Web README](./web/README.md) を参照してください。

## AI エージェントで MQTTX CLI を使う

### MQTTX CLI のインストール・更新

[INSTALL.md](./INSTALL.md) には、環境の検出、インストール方法の選択、バージョンの確認など、エージェント向けのインストール・更新手順が記載されています。次のプロンプトをエージェントに渡してください。

> https://raw.githubusercontent.com/emqx/MQTTX/main/INSTALL.md を読み、その手順に従って現在の環境に MQTTX CLI をインストールまたは更新してください。実行ファイルのパスとバージョンも確認してください。

### MQTTX CLI スキルの利用

[mqttx-cli スキル](./skills/mqttx-cli/SKILL.md) は、エージェントが MQTTX CLI を使って接続確認、メッセージの送受信、MQTT 5 機能の検証、TLS・認証、ペイロードのエンコード・デコード、ベンチマーク、データシミュレーション、トラブルシューティングを行うためのガイドです。

[Skills CLI](https://github.com/vercel-labs/skills) でインストールできます。

```shell
npx skills add emqx/MQTTX --skill mqttx-cli
```

ローカルのソースからインストールする場合は、リポジトリのルートで `npx skills add . --skill mqttx-cli` を実行してください。また、`skills/mqttx-cli` ディレクトリ全体（`references` を含む）をエージェントが対応するスキルディレクトリにコピーするか、その中の `SKILL.md` をエージェントに直接読ませることもできます。

インストール後は、たとえば次のように依頼できます。

> mqttx-cli スキルを使って、127.0.0.1:1883 で動作するローカルブローカーのメッセージ送受信を検証してください。mqttx-test/ 配下の一意なトピックを使用し、15 秒以内に検証を終了して結果を報告してください。

## 利用方法

詳しい使い方は、[ブログ](https://qiita.com/emqx_japan/items/1ff6097fdfe273c5e22f)または[ユーザーマニュアル](./docs/manual-jp.md)を参照してください。

1. MQTT ブローカーを準備します。

   - ローカルにデプロイしない場合は、[EMQX Cloud](https://www.emqx.com/en/cloud) が提供する無料の[パブリック MQTT 5.0 ブローカー](https://www.emqx.com/en/mqtt/public-mqtt5-broker)を利用できます。

      ```text
      ホスト：broker.emqx.io
      TCP ポート：1883
      SSL/TLS ポート：8883
      ```

   - ローカルでブローカーを実行する場合は、オープンソースでクラウドネイティブな分散型 IoT MQTT ブローカー [EMQX](https://www.emqx.com/en/products/emqx) をお勧めします。

2. 左側のサイドバーにある `+` ボタンをクリックし、フォームの必須項目を入力します。

3. 右上の `Connect` ボタンをクリックして、ブローカーに接続します。

4. 接続できたら、トピックをサブスクライブしてメッセージをパブリッシュし、動作を確認します。

![mqttx-gif](./assets/mqttx-gif.gif)

## 開発

以下の手順はデスクトップ版向けです。その他のエディションについては、[CLI README](./cli/README.md#develop) と [Web README](./web/README.md#develop) を参照してください。

[`.nvmrc`](./.nvmrc) に記載された Node.js のバージョン（現在は v22）を使用してください。[nvm](https://github.com/nvm-sh/nvm) を使う場合は、リポジトリのルートで `nvm use` を実行します。

``` shell
# リポジトリをクローンする
git clone git@github.com:emqx/MQTTX.git

# 依存関係をインストールする
cd MQTTX
yarn install

# ホットリロード付きの開発モードで起動する
yarn run electron:serve

# Windows、Linux、macOS 向けのインストーラーをビルドする
yarn run electron:build
```

インストーラーは `dist_electron` ディレクトリに出力されます。特定のプラットフォーム向けにのみビルドする場合は、次のいずれかを実行してください。

```shell
# For Windows
yarn run electron:build-win

# For Linux
yarn run electron:build-linux

# For macOS
yarn run electron:build-mac
```

## プロジェクトへの貢献

プルリクエストを作成する前に、[Contributing Guide](https://github.com/emqx/MQTTX/blob/main/.github/CONTRIBUTING.md) をお読みください。

## テクノロジースタック

- [Electron](https://electronjs.org/)
- [Vue](https://vuejs.org/) + [Element](https://element.eleme.io)
- [TypeScript](https://www.typescriptlang.org/)
- [TypeORM](https://github.com/typeorm/typeorm)
- [SQLite](https://github.com/TryGhost/node-sqlite3)
- [MQTT.js](https://github.com/mqttjs/MQTT.js)

## License

Apache License 2.0, see [LICENSE](https://github.com/emqx/MQTTX/blob/main/LICENSE).

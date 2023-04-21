export default {
  connections: {
    zh: '连接',
    en: 'Connections',
    ja: '接続',
  },
  newConnections: {
    zh: '新建连接',
    en: 'New Connection',
    ja: '新規接続',
  },
  search: {
    zh: '搜索',
    en: 'Search',
    ja: '検索',
  },
  searchByTopic: {
    zh: '按主题搜索',
    en: 'Search by Topic',
    ja: 'トピックで検索',
  },
  topicCopied: {
    zh: '复制成功!',
    en: 'Topic copied!',
    ja: 'コピーが成功しました',
  },
  clearHistory: {
    zh: '清除历史记录',
    en: 'Clear Histroy',
    ja: '履歴データの削除',
  },
  notConnect: {
    zh: '客户端未连接',
    en: 'Client not connected',
    ja: 'クライアント未接続',
  },
  disconnect: {
    zh: '断开连接',
    en: 'Disconnect',
    ja: '接続を切る',
  },
  disconnected: {
    zh: '已断开连接',
    en: 'Disconnected',
    ja: '接続切れ',
  },
  deleteConnect: {
    zh: '删除连接',
    en: 'Delete Connection',
    ja: '接続削除',
  },
  all: {
    zh: '全部',
    en: 'All',
    ja: '全て',
  },
  received: {
    zh: '已接收',
    en: 'Received',
    ja: '受信済み',
  },
  published: {
    zh: '已发送',
    en: 'Published',
    ja: '送信済み',
  },
  writeMsg: {
    zh: '请输入消息',
    en: 'Write a message',
    ja: 'メッセージを入力してください',
  },
  subscriptions: {
    zh: '订阅列表',
    en: 'Subscriptions',
    ja: 'サブスクリプションリスト',
  },
  subscription: {
    zh: '订阅',
    en: 'subscription',
    ja: 'サブスクリプション',
  },
  newSubscription: {
    zh: '添加订阅',
    en: 'New Subscription',
    ja: 'サブスクリプション追加',
  },
  editSubscription: {
    zh: '编辑订阅',
    en: 'Edit Subscription',
    ja: 'サブスクリプションの編集',
  },
  subFailed: {
    zh: '订阅失败',
    en: 'Subscribe Failed',
    ja: 'サブスクリプションが失敗しました',
  },
  qosSubSysFailed: {
    zh: '拒绝了 $SYS 主题，错误的 QoS，MQTT Broker 拒绝了订阅。请检查 ACL 配置',
    en: 'Rejected the $SYS topic,Unexpected QoS, MQTT Broker declined the subscription. Please check ACL configuration',
    ja: '$SYSトピックを拒否しま。した予期しないQoS、MQTT Brokerはサブスクリプションを拒否しました。ACL構成を確認してください',
  },
  qosSubFailed: {
    zh: '错误的 QoS, SubACK 失败, 请检查 MQTT broker ACL 设置',
    en: 'Unexpected QoS, SubACK failed, Please check MQTT broker ACL configuration',
    ja: '予期しないQoS, SubACK失敗、MQTT Broker ACL構成を確認してください',
  },
  emptySubFailed: {
    zh: '订阅为空',
    en: 'Subscription is empty',
    ja: 'サブスクリプションは空です',
  },
  unknowSubFailed: {
    zh: '未知的订阅错误',
    en: 'Unknown subscription error',
    ja: '不明なサブスクリプションエラー',
  },
  connected: {
    zh: '已连接',
    en: 'Connected',
    ja: '接続済み',
  },
  connectFailed: {
    zh: '连接失败',
    en: 'Connect Failed',
    ja: '接続に失敗しました',
  },
  reconnect: {
    zh: '正在重连',
    en: 'Reconnecting',
    ja: '再接続中',
  },
  connectBtn: {
    zh: '连 接',
    en: 'Connect',
    ja: '接 続',
  },
  disconnectedBtn: {
    zh: '断开连接',
    en: 'Disconnect',
    ja: '接続を切る',
  },
  connectionExists: {
    zh: '连接数据已存在',
    en: 'Connection already exists',
    ja: '接続がすでに存在しました',
  },
  brokerIP: {
    zh: '服务器地址',
    en: 'Host',
    ja: 'ホスト',
  },
  brokerPort: {
    zh: '端口',
    en: 'Port',
    ja: 'ポート',
  },
  certType: {
    zh: '证书类型',
    en: 'Certificate',
    ja: '証明書タイプ',
  },
  name: {
    zh: '名称',
    en: 'Name',
    ja: '名前',
  },
  username: {
    zh: '用户名',
    en: 'Username',
    ja: 'ユーザー名',
  },
  password: {
    zh: '密码',
    en: 'Password',
    ja: 'パスワード',
  },
  ca: {
    zh: 'CA 文件',
    en: 'CA File',
    ja: 'CA ファイル',
  },
  cert: {
    zh: '客户端证书',
    en: 'Client Certificate File',
    ja: 'クライアント証明書',
  },
  key: {
    zh: '客户端 key 文件',
    en: 'Client key file',
    ja: 'クライアント キー ファイル',
  },
  connectionTimeout: {
    zh: '连接超时时长',
    en: 'Connect Timeout',
    ja: '接続タイムアウト',
  },
  cleanSession: {
    zh: '清除会话',
    en: 'Clean Session',
    ja: 'セッションクリア',
  },
  autoReconnect: {
    zh: '自动重连',
    en: 'Auto Reconnect',
    ja: '自動再接続',
  },
  reconnectPeriod: {
    zh: '重连周期',
    en: 'Reconnect Period',
    ja: '再接続期間',
  },
  mqttVersion: {
    zh: 'MQTT 版本',
    en: 'MQTT Version',
    ja: 'MQTT バージョン',
  },
  sessionExpiryInterval: {
    zh: '会话过期时间',
    en: 'Session Expiry Interval',
    ja: 'セッション有効期限',
  },
  receiveMaximum: {
    zh: '接收最大数值',
    en: 'Receive Maximum',
    ja: '最大受信数',
  },
  topicAliasMaximum: {
    zh: '主题别名最大值',
    en: 'Topic Alias Maximum',
    ja: 'トピックエイリアスの最大値',
  },
  topicAlias: {
    zh: '主题别名',
    en: 'Topic Alias',
    ja: 'トピックエイリアス',
  },
  maximumPacketSize: {
    zh: '最大数据包大小',
    en: 'Maximum Packet Size',
    ja: '最大パケット サイズ',
  },
  requestResponseInformation: {
    zh: '请求响应信息',
    en: 'Request Response Info',
    ja: 'レスポンス情報をリクエストする',
  },
  requestProblemInformation: {
    zh: '请求失败信息',
    en: 'Request Problem Info',
    ja: '失敗情報をリクエストする',
  },
  userProperties: {
    zh: '用户属性',
    en: 'User Properties',
    ja: 'ユーザー プロパティ',
  },
  topicRequired: {
    zh: '请输入 Topic',
    en: 'Topic is required',
    ja: 'トピックを入力してください',
  },
  topicCannotContain: {
    zh: '不能向包含通配符 #、+ 的 Topic 发布消息',
    en: 'You cannot publish the message to a Topic that contains wildcards characters #, +',
    ja: 'ワイルドカード文字 #、+ を含むトピックにメッセージを送信できません',
  },
  topicTips: {
    zh: '可订阅单个或多个主题，订阅多主题时，请使用逗号分隔（,）',
    en: 'You can subscribe to single or multiple topics, please use comma separation to subscribe to multiple topics (,)',
    ja: '複数のトピックを購読する場合は、カンマで区切ってください（,）。',
  },
  payloadReuired: {
    zh: '请输入 Payload',
    en: 'Payload is required',
    ja: 'Payloadを入力してください',
  },
  color: {
    zh: '标记',
    en: 'Color',
    ja: 'マーク',
  },
  willMessage: {
    zh: '遗嘱消息',
    en: 'Last Will and Testament',
    ja: '遺言',
  },
  strictValidateCertificate: {
    zh: 'SSL 安全',
    en: 'SSL Secure',
    ja: 'SSL証明書',
  },
  willTopic: {
    zh: '遗嘱消息主题',
    en: 'Last-Will Topic',
    ja: '遺言トピック',
  },
  willPayload: {
    zh: '遗嘱消息',
    en: 'Last-Will Payload',
    ja: '遺言 Payload',
  },
  willQos: {
    zh: '遗嘱消息 QoS',
    en: 'Last-Will QoS',
    ja: '遺言 QoS',
  },
  willRetain: {
    zh: '遗嘱消息保留标志',
    en: 'Last-Will Retain',
    ja: '遺言 Retain',
  },
  willDelayInterval: {
    zh: '遗嘱消息延迟时间',
    en: 'Will Delay Interval',
    ja: '遺言ディレイ間隔',
  },
  messageExpiryInterval: {
    zh: '遗嘱消息过期时间',
    en: 'Message Expiry Interval',
    ja: '遺言有効期限',
  },
  contentType: {
    zh: '遗嘱消息描述',
    en: 'Content Type',
    ja: '遺言詳細情報',
  },
  duplicateName: {
    zh: '该名称已存在，请重新命名！',
    en: 'Duplicate name. Please rename it!',
    ja: '名称が既に存在したので、リネームをお願いします！',
  },
  nameTip: {
    zh: '可快速选择已创建过的连接配置',
    en: 'Quick selection of created connection configurations',
    ja: '作成された接続構成を早めに選択することができます',
  },
  clientIdWithTimeTip: {
    zh: '在连接时附加时间戳到 ClientID，以防止重复的连接',
    en: 'Append a timestamp to the ClientID at connection time to prevent duplicate connections',
    ja: '重複接続を防ぐために、ClientIDにタイムスタンプを追加します',
  },
  secureTip: {
    zh: '是否验证服务端证书链和地址名称',
    en: "Whether a client verifies the server's certificate chain and host name",
    ja: "Whether a client verifies the server's certificate chain and host name",
  },
  publishMsg: {
    zh: '发送消息',
    en: 'Publish message',
    ja: 'メッセージを送る',
  },
  receivedMsg: {
    zh: '接收消息',
    en: 'Received message',
    ja: 'メッセージを受信する',
  },
  receivedPayloadDecodedBy: {
    zh: '接收到的 Payload 通过编码格式输出',
    en: 'Received Payload is output by encoding format',
    ja: '受信したペイロードは、エンコード形式で出力されます',
  },
  alias: {
    zh: '别名',
    en: 'Alias',
    ja: '別名',
  },
  aliasTip: {
    zh: '为多主题设置别名时，也使用逗号分隔符（,）',
    en: 'Comma separator (,) is also used when setting aliases for multiple topics',
    ja: '複数のトピックにエイリアスを設定する場合は、カンマ区切り（,）も使用されます。',
  },
  metaTips: {
    zh: '仅在 MQTT 5.0 中启用',
    en: 'Enabled only with MQTT 5.0',
    tr: 'Yalnızca MQTT 5.0 ile etkinleştirilir',
    ja: 'MQTT 5.0でのみ有効',
    hu: 'Csak MQTT 5.0 esetén engedélyezett',
  },
  qos0: {
    zh: '最多一次',
    en: 'At most once',
    tr: 'en fazla bir kere',
    ja: 'せいぜい一度',
    hu: 'Legfeljebb egyszer',
  },
  qos1: {
    zh: '至少一次',
    en: 'At least once',
    tr: 'En azından bir kere',
    ja: '少なくとも一度は',
    hu: 'Legalább egyszer',
  },
  qos2: {
    zh: '仅一次',
    en: 'Exactly once',
    tr: 'tam olarak bir kez',
    ja: 'ちょうど一度',
    hu: 'Pontosan egyszer',
  },
  payloadFormatIndicator: {
    zh: '有效载荷指示器',
    en: 'Payload Format Indicator',
    ja: 'ペイロードフォーマットインジケーター',
  },
  responseTopic: {
    zh: '响应主题',
    en: 'Response Topic',
    ja: '応答トピック',
  },
  correlationData: {
    zh: '对比数据',
    en: 'Correlation Data',
    ja: '相関データ',
  },
  subscriptionIdentifier: {
    zh: '订阅标识符',
    en: 'Subscription Identifier',
    ja: 'サブスクリプション識別子',
  },
}

# 安装

您可以在以下途径下载并安装 MQTTX：

1. [MQTTX 官方下载页面](https://mqttx.app/zh/downloads) 提供了直接下载和安装的入口。

2. [EMQ 官方下载页面](https://www.emqx.com/zh/try?product=MQTTX) 也提供了 MQTTX 的下载和安装服务。

3. 另外，您可以在 [GitHub Releases](https://github.com/emqx/MQTTX/releases) 页面选择并下载您所需的版本。

> 如果由于网络原因，从 GitHub 下载时遇到网速慢或卡顿的问题，我们建议您在 MQTTX 官网首页或 EMQ 官方下载页面进行下载和安装。

如需查看更多已发布的版本，您可以访问我们的[更多下载](https://www.emqx.com/zh/downloads/MQTTX) 页面，选择并下载满足您需求的版本后进行安装。

**注意**：我们强烈建议您下载并安装最新版本，以确保最佳的使用体验。

## macOS

> 我们为 macOS 用户提供了适用于 Intel Chip 和 Apple Silicon 的安装包，你可以根据自己的使用环境选择合适的版本。

您也可以选择通过 Apple 的 Mac App Store 进行下载。

**注意**：由于 App Store 的审核问题，当前 App Store 上的版本仅更新到 1.6.0 版本。我们会尽快解决此问题，并持续更新版本。

[![Download on the Mac App Store](/images/app-store-download.svg)](https://apps.apple.com/cn/app/mqttx/id1514074565?mt=12)

当需要下载文件安装时，我们建议您优先选择下载 `dmg` 格式的安装包。同时，您也可以选择下载 `mac.zip` 的压缩包，解压后即可使用。

**注意**：不过请注意，由于 macOS 系统版本的不同，使用 `zip` 压缩包在 `10.15.2` 系统版本中可能会出现解压后无法打开的情况，因此，我们建议优先选择 `dmg` 文件进行下载和安装。

对于习惯使用命令行的 macOS 用户，您可以选择使用 [brew cask](https://formulae.brew.sh/cask/mqttx) 来安装 MQTTX：

```shell
brew install --cask mqttx
```

## Windows

> 对于 Windows 用户，我们提供了 64 位（x64）和 32 位（ia32）版本的安装包，请选择符合您当前使用环境的版本。

Windows 用户请下载最新版本的 `exe` 文件，下载后按照 Setup 的指示进行安装。

## Linux

> 对于 Linux 用户，我们提供了 x86 64 位和 ARM64 两种版本的安装包，请选择符合您当前使用环境的版本。

Linux 用户也可以直接访问 Flathub 进行下载和安装：

<a href='https://flathub.org/apps/details/com.emqx.MQTTX'><img style="height: 56px;width: 170px;" alt='Download on Flathub' src='https://flathub.org/assets/badges/flathub-badge-en.png'/></a>

或者执行 `flatpak` 命令来快速安装并启动 MQTTX。

安装：

```shell
flatpak install flathub com.emqx.MQTTX
```

运行：

```shell
flatpak run com.emqx.MQTTX
```

对于需要手动下载安装包的用户，根据当前的 Linux 操作系统版本环境等，选择下载最新版本的 `AppImage`、`deb` 或 `rpm` 文件。

## Ubuntu

> 对于 Ubuntu Snap Store 用户，目前只提供了 x86 64 位的安装包。

Ubuntu 用户更倾向于使用 snap 文件进行安装，可以从 Snap 商店下载和安装 snap 格式的安装器：

<a href="https://snapcraft.io/mqttx">
  <img alt="Get it from the Snap Store" src="https://snapcraft.io/static/images/badges/en/snap-store-black.svg" />
</a>

或执行以下命令使用 `snap` 文件进行快速安装：

```shell
sudo snap install mqttx
```

对于需要手动下载安装包的用户，可以直接选择下载最新版本的 `snap` 文件。例如下载后执行：

```shell
sudo snap install Downloads/MQTTX_1.13.1_amd64.snap --dangerous
```

**注意**：在使用 `snap` 文件安装时，可能会出现权限不足的问题，具体详情请参考这个 `issue`：[https://github.com/emqx/MQTTX/issues/109](https://github.com/emqx/MQTTX/issues/109)

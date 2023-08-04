# Installation

You can download and install MQTTX from several sources:

1. [MQTTX Official Website Download Page](https://mqttx.app/downloads) provides direct access to download and installation.

2. [EMQ Official Website Download Page](https://www.emqx.com/en/try?product=MQTTX) also hosts MQTTX for download and installation.

3. Alternatively, you can select your preferred version from the [GitHub Releases](https://github.com/emqx/MQTTX/releases) page.

> If you're experiencing slow network speed or latency issues when downloading from GitHub, we recommend using the MQTTX official homepage or the EMQ official download page instead.

For additional released versions, you can visit our [More Downloads](https://www.emqx.com/en/downloads/MQTTX) page. Select and install the version that best suits your needs.

**Note**: We strongly recommend downloading the latest version whenever possible to ensure the best user experience.

## macOS

> We offer two distinct versions of the MQTTX installer for macOS users, one for Intel Chip and another for Apple Silicon. Please select the version that is compatible with your current hardware configuration.

Alternatively, you can download MQTTX from Apple's Mac App Store.

**NOTE**: Currently, due to the App Store review process, the version on the App Store is limited to version 1.6.0. We are working to resolve this issue and will continue to update the version accordingly.

[![Download on the Mac App Store](/images/app-store-download.svg)](https://apps.apple.com/us/app/mqttx/id1514074565?mt=12)

When it comes to installing MQTTX, we recommend downloading the `dmg` format installation package. Alternatively, you can download the `mac.zip` compressed file which can be decompressed and used quickly.

**Note**: Please be aware that for certain `macOS` system versions, specifically `10.15.2`, there may be issues opening the `zip` compressed file after decompression. As a result, we advise users to prioritize downloading the `dmg` file.

For macOS users who prefer using the command line, MQTTX can also be installed via [brew cask](https://formulae.brew.sh/cask/mqttx):

```shell
brew install --cask mqttx
```

## Windows

> For Windows users, we provide installation packages for 32-bit, 64-bit, and ARM64 architectures. Please choose the version compatible with your current hardware.

We recommend Windows users to download the latest `exe` file. Once downloaded, you can follow the Setup instructions for installation.

## Linux

> For Linux users, we provide installation packages for x86 64-bit and ARM64 architectures. Please select the version that matches your current hardware.

Linux users can directly visit Flathub to download and install MQTTX:

<a href='https://flathub.org/apps/details/com.emqx.MQTTX'><img style="height: 56px;width: 170px;" alt='Download on Flathub' src='https://flathub.org/assets/badges/flathub-badge-en.png'/></a>

Alternatively, use the `flatpak` command to quickly install and start MQTTX:

Install:

```shell
flatpak install flathub com.emqx.MQTTX
```

Run:

```shell
flatpak run com.emqx.MQTTX
```

For those who prefer manual installation, download the latest `AppImage`, `deb`, or `rpm` files according to your specific Linux operating system.

## Ubuntu

> For Ubuntu Snap Store users, currently, only the x86 64-bit installer is available.

Ubuntu users typically use snap files for installation. The snap format installers can be downloaded from the Snap Store:

<a href="https://snapcraft.io/mqttx">
  <img alt="Get it from the Snap Store" src="https://snapcraft.io/static/images/badges/en/snap-store-black.svg" />
</a>

Alternatively, execute the following command to install MQTTX using the `snap` file:

```shell
sudo snap install mqttx
```

For manual installation, download the latest version of the `snap` file. Here's an example:

```shell
sudo snap install Downloads/MQTTX_1.9.3_amd64.snap --dangerous
```

**Note**: When installing with `snap` files, you may encounter insufficient permission issues. For more details, refer to this `issue`: [https://github.com/emqx/MQTTX/issues/109](https://github.com/emqx/MQTTX/issues/109)

# Install or update MQTTX CLI

This guide is for users and agents installing the `mqttx` command. It does not install MQTTX Desktop or MQTTX Web. For MQTT workflows after installation, use the [MQTTX CLI skill](skills/mqttx-cli/SKILL.md).

## 1. Inspect the environment

On macOS or Linux:

```sh
uname -s
uname -m
command -v mqttx
```

On Windows (PowerShell):

```powershell
[System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
Get-Command mqttx -All -ErrorAction SilentlyContinue
```

If present, run `mqttx --version` and `mqttx --help`. Record the executable path and version before changing anything. The version output can contain a changelog URL as well as the version number.

Identify the installation owner: check `npm list --global mqttx-cli --depth=0` and `npm prefix --global` when npm is available, or `brew list --versions mqttx-cli` when Homebrew is available. A missing package is an expected result. An executable path alone does not prove which tool installed it; inspect symlinks and package records when necessary.

## 2. Choose a channel and version

- For an existing installation, keep its original channel and location. If the owner is unclear, resolve it before overwriting the executable.
- For a new macOS installation with Homebrew, use the CLI formula below.
- With a compatible Node.js installation, npm is an option on Windows, macOS and Linux.
- Without a compatible Node.js runtime, use a standalone binary for the OS and architecture.
- Use Docker when a container invocation is desired; this does not create a host `mqttx` command.

Honor an explicitly requested version. Otherwise, resolve the stable version available from the chosen channel. GitHub releases, npm and Homebrew can publish at different times; the repository's `package.json` is not proof that a version is available in every channel. Keep a working installation for ordinary usage unless an update is requested or a required capability is missing.

### npm

Inspect the published version and its runtime requirement first:

```sh
node --version
npm view mqttx-cli@latest version engines --json
```

For a pinned version, replace `latest` with that exact version in both the query and installation command. Respect the returned `engines.node` range; do not interpret an exact major such as `18` as `>=18`. If the runtime is incompatible, select a standalone binary instead of changing the user's Node.js environment implicitly.

Install, or update an npm-managed installation:

```sh
npm install --global mqttx-cli@latest
```

If the global prefix is not writable, use an existing user-managed Node.js installation or the user-local binary route below. Do not automatically retry with `sudo`. On POSIX systems npm places executables in the prefix's `bin` directory; on Windows they are in the prefix itself. Ensure that location is on PATH.

### Homebrew (macOS)

Inspect the formula version with `brew info emqx/mqttx/mqttx-cli`. For a new installation:

```sh
brew install emqx/mqttx/mqttx-cli
```

For an existing Homebrew installation:

```sh
brew update
brew upgrade emqx/mqttx/mqttx-cli
```

`brew install --cask mqttx` installs the desktop application. Use the CLI formula above for this guide. If an exact version is needed and the formula does not offer it, use a matching binary or npm package after resolving any existing installation.

### Standalone binaries

Select a stable tag and inspect its actual assets on [GitHub Releases](https://github.com/emqx/MQTTX/releases). Agents can read the [latest stable release API](https://api.github.com/repos/emqx/MQTTX/releases/latest), or query `/repos/emqx/MQTTX/releases/tags/vX.Y.Z` for a requested tag. Check that the selected asset exists; do not assume every release supports every platform.

| Environment | Asset name |
| --- | --- |
| Linux glibc, x86_64 / aarch64 | `mqttx-cli-linux-x64` / `mqttx-cli-linux-arm64` |
| Alpine Linux musl, x86_64 / aarch64 | `mqttx-cli-alpine-x64` / `mqttx-cli-alpine-arm64` |
| macOS, Intel / Apple Silicon | `mqttx-cli-macos-x64` / `mqttx-cli-macos-arm64` |
| Windows, x64 / ARM64 | `mqttx-cli-win-x64.exe` / `mqttx-cli-win-arm64.exe` |

Architecture detection does not distinguish glibc from musl. Check the Linux distribution/runtime before selecting an asset. For unsupported platforms, use another supported channel rather than guessing a filename.

On macOS/Linux, set `MQTTX_TAG` to the selected tag (including `v`) and `MQTTX_ASSET` to its exact asset name, then stage and verify the download:

```sh
: "${MQTTX_TAG:?Set MQTTX_TAG to the selected release tag}"
: "${MQTTX_ASSET:?Set MQTTX_ASSET to the selected asset name}"
MQTTX_STAGE=$(mktemp -d)
curl --fail --location --retry 2 \
  "https://github.com/emqx/MQTTX/releases/download/${MQTTX_TAG}/${MQTTX_ASSET}" \
  --output "$MQTTX_STAGE/mqttx" &&
chmod 755 "$MQTTX_STAGE/mqttx" &&
"$MQTTX_STAGE/mqttx" --version
```

Proceed only if the download succeeded and the staged executable reports the selected version. For a **new user-local installation**:

```sh
mkdir -p "$HOME/.local/bin" &&
install -m 755 "$MQTTX_STAGE/mqttx" "$HOME/.local/bin/mqttx"
export PATH="$HOME/.local/bin:$PATH"
mqttx --version
```

The PATH change applies to the current shell. For future sessions, add that directory through the user's normal shell configuration if needed. Keep the stage until verification completes, then remove only that temporary directory.

On Windows, set `$MqttxAssetUrl` to the chosen asset's `browser_download_url` from the release metadata. Stage it in a new temporary directory:

```powershell
if (-not $MqttxAssetUrl) { throw 'Set MqttxAssetUrl to the selected Windows asset URL' }
$MqttxStage = Join-Path ([IO.Path]::GetTempPath()) ([Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $MqttxStage -ErrorAction Stop | Out-Null
Invoke-WebRequest -Uri $MqttxAssetUrl -OutFile "$MqttxStage\mqttx.exe" -ErrorAction Stop
& "$MqttxStage\mqttx.exe" --version
```

After confirming the version, a new user-local installation can use:

```powershell
$MqttxBin = Join-Path $env:LOCALAPPDATA 'MQTTX\bin'
New-Item -ItemType Directory -Force -Path $MqttxBin -ErrorAction Stop | Out-Null
Copy-Item "$MqttxStage\mqttx.exe" "$MqttxBin\mqttx.exe" -ErrorAction Stop
$env:Path = "$MqttxBin;$env:Path"
mqttx --version
```

Add `$MqttxBin` to the user's PATH for future sessions if needed, preserving existing entries. Remove the stage after verification.

For a **binary update**, retain a backup and replace the existing manually installed executable at its resolved location after staged verification. Do not replace an npm/Homebrew-managed file this way or create a second installation earlier on PATH. Restore the backup if verification fails. If the destination requires permissions the agent does not have, report that exact destination and the required action.

If GitHub is unavailable, use the [official MQTTX downloads](https://mqttx.app/downloads) or [installation documentation](https://mqttx.app/docs/cli/downloading-and-installation) to find the same version and architecture. Do not silently substitute a different version or an unverified mirror.

### Docker

Choose a published tag from [emqx/mqttx-cli](https://hub.docker.com/r/emqx/mqttx-cli/tags). Replace `latest` with the selected tag when pinning:

```sh
docker pull emqx/mqttx-cli:latest
docker run --rm emqx/mqttx-cli:latest mqttx --version
docker run --rm emqx/mqttx-cli:latest mqttx --help
```

Pull again to update a mutable tag. For automated invocations, omit `-t`; add `-i` only when forwarding stdin. The broker hostname is resolved inside the container, where `localhost` refers to the container itself.

## 3. Verify and report

Run `mqttx --version`, `mqttx --help`, `mqttx pub --help` and `mqttx sub --help` using the installed executable (or the Docker invocation). Confirm the version matches the selected channel/version and that help describes the MQTT CLI commands. Installation verification does not require a broker connection.

If a different version still runs, inspect `type -a mqttx` in Bash/Zsh or `Get-Command mqttx -All` in PowerShell. Refresh the shell's command cache or reopen the shell after a path change. Resolve duplicate installations explicitly instead of repeatedly reinstalling.

Report the installed version, channel, executable path or image tag, verification result, and any remaining PATH/permission step. `mqttx check` checks for updates; it does not install them.

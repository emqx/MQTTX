import axios from 'axios'
import chalk from 'chalk'
import { compareVersions } from 'compare-versions'

import { version } from '../../package.json'

const checkUpdate = async () => {
  try {
    const { data } = await axios.get('https://api.github.com/repos/emqx/MQTTX/git/refs/tags')
    if (data?.length) {
      const latestVersion = data[data.length - 1].ref.replace('refs/tags/v', '')
      if (compareVersions(latestVersion, version) > 0) {
        console.log(
          chalk.yellow(
            `A new version of MQTTX CLI is available: ${chalk.cyan(version)} ${chalk.reset('→')} ${chalk.cyan(
              latestVersion,
            )}\nhttps://github.com/emqx/MQTTX/releases/tag/v${latestVersion}`,
          ),
        )
      } else {
        console.log(chalk.green('There are currently no updates available.'))
      }
    }
  } catch (error) {
    console.error(error)
  }
}

export { checkUpdate }

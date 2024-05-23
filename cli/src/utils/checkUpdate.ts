import axios from 'axios'
import chalk from 'chalk'
import { compareVersions } from 'compare-versions'
import { version } from '../../package.json'
import ora from 'ora'

const spinner = ora()

const checkUpdate = async () => {
  try {
    spinner.start('Checking for updates...')
    const tagsUrl = 'https://community-sites.emqx.com/api/v1/all_version?product=MQTTX'
    const tagsRes = await axios.get(tagsUrl)
    if (tagsRes.status === 200) {
      const latestVersion = tagsRes.data.data[0].replace('v', '')
      if (compareVersions(latestVersion, version) > 0) {
        spinner.stop()
        console.log(
          chalk.yellow(
            `A new version of MQTTX CLI is available: ${chalk.cyan(version)} ${chalk.reset('→')} ${chalk.cyan(
              latestVersion,
            )}\nhttps://github.com/emqx/MQTTX/releases/tag/v${latestVersion}`,
          ),
        )
      } else {
        spinner.succeed('There are currently no updates available.')
      }
    }
  } catch (error) {
    const err = error as Error
    spinner.fail(err.message.toString())
  } finally {
    spinner.stop()
  }
}

export { checkUpdate }

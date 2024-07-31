import chalk from 'chalk'
import { compareVersions } from 'compare-versions'
import { version } from '../../package.json'
import ora from 'ora'

const spinner = ora()

interface TagsResponse {
  code: number
  data: string[]
  success: boolean
}

/**
 * Checks for version updates of MQTTX CLI.
 * @returns {Promise<void>} A promise that resolves when the update check is complete.
 */
const checkUpdate = async () => {
  try {
    spinner.start('Checking for updates...')
    const tagsUrl = 'https://community-sites.emqx.com/api/v1/all_version?product=MQTTX'
    // Using `fetch` here with adding `DOM` lib in `tsconfig.json` is not correct. See: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60924
    // Update to Node.js 20 to resolve fetch global type issue.
    const response = await fetch(tagsUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const tagsRes = (await response.json()) as TagsResponse
    const latestVersion = tagsRes.data[0].replace('v', '')
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
  } catch (error) {
    const err = error as Error
    spinner.fail(err.message.toString())
  } finally {
    spinner.stop()
  }
}

export { checkUpdate }

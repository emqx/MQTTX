import type { App } from 'vue'
import { useCLIInstall } from '../components/cli/useCLIInstall'

export function createElectronMenuPlugin() {
  return {
    install(app: App) {
      window.api.onMenuClicked((_event, type) => {
        const router = app.config.globalProperties.$router
        switch (type) {
          case 'about':
            router.push('/about')
            break
          case 'preferences':
            router.push('/settings')
            break
          case 'checkForUpdate':
            window.forceCheck = true
            window.api.checkForUpdates()
            break
          case 'installCLI': {
            const { installCli } = useCLIInstall()
            installCli()
            break
          }
          case 'newConnection':
            router.push('/connections/create')
            break
          case 'newWindow':
            // TODO: implement new window
            break
          default:
            console.error(`Unknown menu type: ${type}`)
        }
      })
    },
  }
}

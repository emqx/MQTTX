import { systemPreferences } from 'electron'

type CB = (theme: string) => void

const systemTheme = (updateMethod: CB): void => {
  systemPreferences.subscribeNotification(
    'AppleInterfaceThemeChangedNotification',
    function theThemeHasChanged() {
      const isDarkMode: boolean = systemPreferences.isDarkMode()
      const theme: Theme = isDarkMode ? 'dark' : 'light'
      updateMethod(theme)
    },
  )
}

export default systemTheme

const intallCliBtnLoading = ref(false)

export function useCLIInstall() {
  async function installCli() {
    if (intallCliBtnLoading.value) return

    try {
      intallCliBtnLoading.value = true
      await window.api.installCLI()
    } catch (error) {
      console.error(error)
    } finally {
      intallCliBtnLoading.value = false
    }
  }

  return {
    intallCliBtnLoading,
    installCli,
  }
}

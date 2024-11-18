export default function useLinks() {
  const linksMap = ref({
    homepage: 'https://mqttx.app',
  })
  return {
    linksMap,
  }
}

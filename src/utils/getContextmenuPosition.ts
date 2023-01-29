const getContextmenuPosition = (event: MouseEvent, width: number, height: number) => {
  const { clientX, clientY } = event
  const innerWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
  const innerHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight

  const x = clientX + width > innerWidth ? innerWidth - width : clientX
  const y = clientY + height > innerHeight ? innerHeight - height : clientY

  return { x, y }
}

export default getContextmenuPosition

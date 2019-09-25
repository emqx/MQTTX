export default (el: string, event: MouseEvent): boolean => {
  const selectDom: Element | null = document.querySelector(el)
  if (selectDom) {
    // Type Assertion，Type assertion using the '<>' syntax is forbidden.
    // There is an ambiguity in the language grammar when using, Like use HTML tag.
    const targetDom: Element = event.target as Element
    return selectDom.contains(targetDom)
  }
  return true
}

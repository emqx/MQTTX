// jsdom provides storage on window; app modules also read it through the Node global.
;(global as any).localStorage = window.localStorage
;(document as any).queryCommandSupported = () => false

// The generated iconfont script expects its script element to exist.
const iconfontScript = document.createElement('script')
iconfontScript.setAttribute('data-disable-injectsvg', 'true')
document.head.appendChild(iconfontScript)

// jsdom provides storage on window; app modules also read it through the Node global.
;(global as any).localStorage = window.localStorage
;(document as any).queryCommandSupported = () => false

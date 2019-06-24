interface App {
  currentTheme: string,
  currentLang: string,
}

interface State {
  app: App,
}

interface Routes {
  path: string,
  component: any,
  redirect: string,
  children: any[],
}

export {
  App,
  State,
  Routes,
}

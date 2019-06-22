import { State } from '../types/index'

const getters = {
  currentTheme: (state: State) => state.app.currentTheme,
}

export default getters

interface SearchParams {
  [propName: string]: string
}

type MatchMultipleSearch = (data: any[], params: SearchParams) => any[] | null

const matchMultipleSearch: MatchMultipleSearch = (data, params) => {
  const paramsKeys = Object.keys(params)
  try {
    const filterData = data.filter(($) => {
      return paramsKeys.every((oneKey) => {
        if ($[oneKey]) {
          const key: string = $[oneKey].toLowerCase().replace(/\s+/g, '')
          const value: string = params[oneKey]
            .toLocaleLowerCase()
            .replace(/\s+/g, '')
            .replace(/[~#^$@%&!+*]/gi, (val) => `\\${val}`)
          return key.match(value)
        } else {
          return null
        }
      })
    })
    return filterData
  } catch (error) {
    throw error
  }
}

export default matchMultipleSearch

type MatchSearch = (data: any[], searchKey: string, searchValue: string) => Promise<any[] | null>

const matchSearch: MatchSearch = (data, searchKey, searchValue) => {
  return new Promise((resolve, reject) => {
    try {
      const filterData = data.filter(($) => {
        if ($[searchKey]) {
          const key: string = $[searchKey].toLowerCase().replace(/\s+/g, '')
          const value: string = searchValue.toLocaleLowerCase().replace(/\s+/g, '')
          return key.match(value)
        } else {
          return null
        }
      })
      return resolve(filterData)
    } catch (error) {
      return reject(error)
    }
  })
}

export default matchSearch

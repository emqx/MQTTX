export const emptyToNull = (data: $TSFixed) => {
  Object.entries(data).forEach((entry) => {
    const [key, value] = entry
    if (value === '') {
      data[key] = null
    }
  })
  return data
}

export default {}

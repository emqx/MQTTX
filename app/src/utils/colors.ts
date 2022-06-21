export const defineColors = ['#34C388', '#6ECBEE', '#D08CF1', '#907AEF', '#EDB16E']

export const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i += 1) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

export default {}

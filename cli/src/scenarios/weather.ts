import { Faker } from '@faker-js/faker'

const dataCache: Record<string, any> = {}

function getCurrentSeason() {
  const today = new Date()
  const month = today.getUTCMonth()
  if (month < 2 || month > 10) return 'Winter'
  if (month < 5) return 'Spring'
  if (month < 8) return 'Summer'
  return 'Autumn'
}

function getTimeOfDay() {
  const hour = new Date().getUTCHours()
  if (hour < 6 || hour > 20) return 'Night'
  if (hour < 12) return 'Morning'
  if (hour < 18) return 'Afternoon'
  return 'Evening'
}

const generator = (faker: Faker, options: SimulatePubOptions) => {
  const { clientId } = options
  if (!dataCache[clientId]) {
    dataCache[clientId] = {
      station_id: faker.string.uuid(),
      city: faker.location.city(),
      region: faker.location.state(),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
    }
  }

  const season = getCurrentSeason()
  const timeOfDay = getTimeOfDay()

  const isDay = timeOfDay === 'Night' ? 0 : 1
  const tempMin = season === 'Winter' ? -20 : 0
  const tempMax = season === 'Summer' ? 40 : 20
  const condition = isDay ? 'Clear' : 'Cloudy'

  const data = {
    ...dataCache[clientId],
    current: {
      last_updated_epoch: Date.now(),
      last_updated: new Date().toLocaleString(),
      temp_c: faker.number.float({ min: tempMin, max: tempMax, precision: 0.1 }),
      temp_f: faker.number.float({ min: tempMin * 1.8 + 32, max: tempMax * 1.8 + 32, precision: 0.1 }),
      is_day: isDay,
      condition: {
        text: condition,
        icon: faker.image.url(),
        code: faker.number.int({ min: 1000, max: 2000 }),
      },
      wind_mph: faker.number.int({ min: 0, max: 100 }),
      wind_kph: faker.number.int({ min: 0, max: 161 }),
      wind_degree: faker.number.int({ min: 0, max: 360 }),
      wind_dir: faker.helpers.arrayElement(['N', 'S', 'E', 'W']),
      pressure_mb: faker.number.int({ min: 980, max: 1040 }),
      pressure_in: faker.number.float({ min: 28.9, max: 30.7, precision: 0.1 }),
      precip_mm: season === 'Summer' ? faker.number.float({ min: 0, max: 50, precision: 0.1 }) : 0,
      precip_in: season === 'Summer' ? faker.number.float({ min: 0, max: 1.97, precision: 0.01 }) : 0,
      humidity: faker.number.int({ min: 0, max: 100 }),
      cloud: isDay ? faker.number.float({ min: 0, max: 50 }) : faker.number.float({ min: 50, max: 100 }),
      feelslike_c: faker.number.float({ min: tempMin, max: tempMax, precision: 0.1 }),
      feelslike_f: faker.number.float({ min: tempMin * 1.8 + 32, max: tempMax * 1.8 + 32, precision: 0.1 }),
      vis_km: isDay ? faker.number.float({ min: 0, max: 100 }) : faker.number.float({ min: 0, max: 50 }),
      vis_miles: isDay ? faker.number.float({ min: 0, max: 62 }) : faker.number.float({ min: 0, max: 31 }),
      uv: isDay ? faker.number.int({ min: 0, max: 10 }) : 0,
      gust_mph: faker.number.int({ min: 0, max: 100 }),
      gust_kph: faker.number.int({ min: 0, max: 161 }),
      air_quality: {
        co: faker.number.int({ min: 0, max: 500 }),
        no2: faker.number.float({ min: 0, max: 1, precision: 0.01 }),
        o3: faker.number.int({ min: 0, max: 100 }),
        so2: faker.number.float({ min: 0, max: 1, precision: 0.01 }),
        pm2_5: faker.number.float({ min: 0, max: 1, precision: 0.01 }),
        pm10: faker.number.int({ min: 0, max: 5 }),
        'us-epa-index': faker.number.int({ min: 0, max: 5 }),
        'gb-defra-index': faker.number.int({ min: 0, max: 5 }),
      },
    },
  }

  return {
    message: JSON.stringify(data),
  }
}

const name = 'weather'
const author = 'EMQX Team'
const dataFormat = 'JSON'
const version = '0.0.1'
const description = "Simulation to generate advanced weather station's data."

export { generator, name, author, dataFormat, version, description }

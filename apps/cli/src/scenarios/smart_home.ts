import type { Faker } from '@faker-js/faker'
import type { SimulatePubOptions } from 'mqttx'

const dataCache: Record<string, any> = {}

interface RoomData {
  room_type: string
  temperature: number
  humidity: number
  lights_on: boolean
  window_open: boolean
}

interface KitchenData extends RoomData {
  fridge_temperature: number
  oven_on: boolean
}

interface BathroomData extends RoomData {
  water_tap_running: boolean
  bath_water_level: number
}

interface BedroomData extends RoomData {
  bed_occupancy: boolean
}

function generateRoomData(faker: Faker, roomType: string): RoomData | KitchenData | BathroomData | BedroomData {
  const currentHour = new Date().getHours()
  const isDaytime = currentHour > 6 && currentHour < 20
  const isSleepingHours = currentHour > 22 || currentHour < 6
  const isKitchen = roomType === 'kitchen'
  const isBathroom = roomType === 'bathroom'
  const isBedroom = roomType === 'bedroom'

  const baseData: RoomData = {
    room_type: roomType,
    temperature: faker.datatype.number({ min: 18, max: 26 }),
    humidity: faker.datatype.number({ min: 30, max: 50 }),
    lights_on: isDaytime ? faker.datatype.boolean() : !isSleepingHours,
    window_open: isDaytime ? faker.datatype.boolean() : false,
  }

  if (isKitchen) {
    const kitchenData: KitchenData = {
      ...baseData,
      fridge_temperature: faker.datatype.number({ min: 2, max: 8 }),
      oven_on: faker.datatype.boolean(),
    }
    return kitchenData
  }

  if (isBathroom) {
    const bathroomData: BathroomData = {
      ...baseData,
      water_tap_running: faker.datatype.boolean(),
      bath_water_level: faker.datatype.number({ min: 0, max: 100 }),
    }
    return bathroomData
  }

  if (isBedroom) {
    const bedroomData: BedroomData = {
      ...baseData,
      bed_occupancy: faker.datatype.boolean(),
    }
    return bedroomData
  }

  return baseData
}

function generator(faker: Faker, options: SimulatePubOptions) {
  const { clientId } = options
  if (!dataCache[clientId]) {
    dataCache[clientId] = {
      home_id: faker.datatype.uuid(),
      owner_name: faker.name.fullName(),
      address: faker.address.streetAddress(),
    }
  }

  const roomTypes = ['living room', 'bedroom', 'kitchen', 'bathroom']

  const data = {
    ...dataCache[clientId],
    rooms: roomTypes.map(roomType => generateRoomData(faker, roomType)),
    timestamp: Date.now(),
  }
  return {
    message: JSON.stringify(data),
  }
}

const name = 'smart_home'
const author = 'EMQX Team'
const dataFormat = 'JSON'
const version = '0.0.1'
const description = 'Simulation to generate Smart Home data.'

export { author, dataFormat, description, generator, name, version }

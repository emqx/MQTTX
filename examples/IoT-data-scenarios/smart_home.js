/**
 * This script is a data generator for simulating Smart Home data.
 * It uses the faker library to generate randomized, but realistic data for a smart home.
 *
 * The script creates a home object with various properties such as its owner, address, and individual rooms.
 * Each room has its own specific properties, such as temperature, humidity, and lights, with additional properties
 * based on the room type (e.g. fridge temperature and oven state for the kitchen, water tap running and bath water
 * level for the bathroom, and bed occupancy for the bedroom).
 *
 * The generated data is returned in JSON format. This script can be used as a module in a larger application,
 * where the generated data might be used for testing, simulation or analytics purposes.
 *
 * This script is developed and maintained by the EMQX Team, and its current version is 0.0.1.
 *
 * @module smart_home
 * @version 0.0.1
 * @author EMQX Team
 */

const dataCache = {}

function generateRoomData(faker, roomType) {
  const currentHour = new Date().getHours()
  const isDaytime = currentHour > 6 && currentHour < 20
  const isSleepingHours = currentHour > 22 || currentHour < 6
  const isKitchen = roomType === 'kitchen'
  const isBathroom = roomType === 'bathroom'
  const isBedroom = roomType === 'bedroom'

  const baseData = {
    room_type: roomType,
    temperature: faker.datatype.number({ min: 18, max: 26 }),
    humidity: faker.datatype.number({ min: 30, max: 50 }),
    lights_on: isDaytime ? faker.datatype.boolean() : !isSleepingHours,
    window_open: isDaytime ? faker.datatype.boolean() : false,
  }

  if (isKitchen) {
    return {
      ...baseData,
      fridge_temperature: faker.datatype.number({ min: 2, max: 8 }),
      oven_on: faker.datatype.boolean(),
    }
  }

  if (isBathroom) {
    return {
      ...baseData,
      water_tap_running: faker.datatype.boolean(),
      bath_water_level: faker.datatype.number({ min: 0, max: 100 }),
    }
  }

  if (isBedroom) {
    return {
      ...baseData,
      bed_occupancy: faker.datatype.boolean(),
    }
  }

  return baseData
}

function generator(faker, options) {
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
const description = 'Simulation to generate Smart Home data'

module.exports = {
  generator,
  name,
  author,
  dataFormat,
  version,
  description,
}

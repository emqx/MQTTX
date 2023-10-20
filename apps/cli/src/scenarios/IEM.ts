import { Faker } from '@faker-js/faker'
import { SimulatePubOptions } from 'mqttx'

const calculateEnergyConsumption = (faker: Faker, maxPower: number) => {
  const ratedPower = maxPower * 1000
  const minInstantPower = ratedPower * 0.6
  const instantPower = faker.datatype.number({ min: minInstantPower, max: ratedPower, precision: 0.001 })
  const energy = instantPower / 3600
  return new Number(energy.toFixed(2))
}

const dataCache: Record<string, any> = {}
let factoryList: { id: string; name: string }[] = []

const generator = (faker: Faker, options: SimulatePubOptions) => {
  // Some fields will not change every time data is generated, so store them according to id
  const { clientId, count } = options
  // Initialize the factory list
  if (!factoryList.length) {
    factoryList = Array.from({ length: count }, (v, i) => {
      return {
        id: `${i}`.padStart(count.toString().length, '0'),
        name: faker.company.name(),
      }
    })
  }
  if (!dataCache[clientId]) {
    const factory = faker.helpers.arrayElement(factoryList)
    dataCache[clientId] = {
      factory_id: factory.id,
      factory: factory.name,
    }
  }

  const data = {
    ...dataCache[clientId],
    values: {
      air_compressor_1: calculateEnergyConsumption(faker, 15),
      air_compressor_2: calculateEnergyConsumption(faker, 20),
      lighting: calculateEnergyConsumption(faker, 5),
      cooling_equipment: calculateEnergyConsumption(faker, 100),
      heating_equipment: calculateEnergyConsumption(faker, 200),
      conveyor: calculateEnergyConsumption(faker, 50),
      coating_equipment: calculateEnergyConsumption(faker, 20),
      inspection_equipment: calculateEnergyConsumption(faker, 10),
      welding_equipment: calculateEnergyConsumption(faker, 20),
      packaging_equipment: calculateEnergyConsumption(faker, 30),
      cutting_equipment: calculateEnergyConsumption(faker, 70),
    },
    timestamp: Date.now(),
  }
  return {
    message: JSON.stringify(data),
  }
}

const name = 'IEM'
const author = 'EMQX Team'
const dataFormat = 'JSON'
const version = '0.0.1'
const description = 'Simulation to generate Industrial Energy Monitoring data.'

export { generator, name, author, dataFormat, version, description }

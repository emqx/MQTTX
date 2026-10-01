let services: Record<string, unknown> = {}

export const setServices = (value: Record<string, unknown>): void => {
  services = value
}

export default (): Record<string, unknown> => services

export const ENABLE_HARDWARE_ACCELERATION_SETTING_KEY = 'settings.enableHardwareAcceleration'

interface BooleanSettingStore {
  get: (key: string) => unknown
}

export const getEnableHardwareAccelerationSetting = (store: BooleanSettingStore): boolean => {
  const value = store.get(ENABLE_HARDWARE_ACCELERATION_SETTING_KEY)

  return value === undefined ? true : value === true
}

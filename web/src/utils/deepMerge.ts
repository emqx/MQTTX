interface MergeObjModel {
  [key: string]: any
}

const deepMerge = (target: MergeObjModel, source: MergeObjModel) => {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object) {
      Object.assign(source[key], deepMerge(target[key], source[key]))
    }
  }
  Object.assign(target || {}, source)
  return target
}

export default deepMerge

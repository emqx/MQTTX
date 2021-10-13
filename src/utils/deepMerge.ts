import _ from 'lodash'

interface MergeObjModel {
  [key: string]: any
}

/**
 * This method is merged nested object by compare `id` prop.
 * @category Object
 * @param object The destination object.
 * @param sources The source objects.
 * @returns Returns `object`.
 * https://github.com/emqx/MQTTX/pull/737#issuecomment-942057374
 */
const deepMerge = (target: MergeObjModel, source: MergeObjModel) => {
  return _.mergeWith(target, source, (target, source) => {
    if (!target) {
      return source
    } else if (!source) {
      return target
    }

    if (_.isArray(target) && _.isArray(source)) {
      const rightIntersection = source.filter((s) => target.findIndex((t) => s.id === t.id) > -1)
      const mergedLeft = target.map((t) => {
        const ri = rightIntersection.find((r) => t === r.id)
        return _.merge(t, ri)
      })
      const rightDifference = source.filter((s) => rightIntersection.findIndex((i) => i.id === s.id) === -1)
      return mergedLeft.concat(rightDifference)
    }
    return _.isArray(source) ? source : target
  })
}

export default deepMerge

import { ConnectionModelTree } from '../views/connections/types'

import _ from 'lodash'
export const flushCurSequenceId = (data: ConnectionModelTree[]): void => {
  data.forEach((el: ConnectionModelTree, idx: number) => {
    if (el.isCollection) {
      flushCurSequenceId(el.children)
    }
    el.orderId = idx
  })
}

export const sortConnectionTree = (data: ConnectionModelTree[]): void => {
  data.sort((a: ConnectionModelTree, b: ConnectionModelTree) => {
    const sequenceIdA: number = !_.isUndefined(a.orderId) ? a.orderId : Number.MAX_SAFE_INTEGER
    const sequenceIdB: number = !_.isUndefined(b.orderId) ? b.orderId : Number.MAX_SAFE_INTEGER
    return sequenceIdA - sequenceIdB
  })
}

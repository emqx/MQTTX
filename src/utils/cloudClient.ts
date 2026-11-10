// Electron 提供给渲染进程的通信工具，供 MQTTX 页面向主进程发请求、接收事件。
// 这里运行在 MQTTX 页面中，不是沙箱里的 Cloud 扩展页面。
import { ipcRenderer } from 'electron'
// 把主进程返回的结构化错误转换成可被 try/catch 捕获的 CloudError。
import { cloudError } from './cloudErrors'
// 只导入类型，不引入运行时代码：
// CloudMethod：允许调用的操作名；CloudParams：每种操作需要的参数；
// CloudResponse：成功或失败的响应格式；CloudResults：每种操作的返回数据类型；
// CloudState：包含会话、扩展版本等信息的状态快照。
import type { CloudMethod, CloudParams, CloudResponse, CloudResults, CloudState } from '../types/cloud'

// 根据操作名 M，决定调用函数时是否必须传参数。这是 TypeScript 的编译期约束。
// M extends CloudMethod 表示 M 只能是已定义的操作名，例如 login、status、ready。
// CloudParams[M] 表示取出该操作对应的参数类型，例如 login 对应 { locale: string }。
// Record<string, never> 表示不接受任何字段的对象；这里用它判断操作是否允许不传参数。
// ? 分支：例如 status 不需要参数，args 后面的 ? 表示这一项可以省略。
// : 分支：例如 login 需要 locale，调用时必须传对应的参数对象。
type Arguments<M extends CloudMethod> = Record<string, never> extends CloudParams[M]
  ? [args?: CloudParams[M]]
  : [args: CloudParams[M]]

// 向主进程发起一次 Cloud 操作，并等待结果；它不负责发送 Cloud HTTP 业务请求。
// method 是操作名；...args 将后续参数收集成数组，类型保证数组最多包含一个参数对象。
// Promise<CloudResults[M]> 表示异步返回该操作对应的数据：例如 status 返回 CloudState。
// 调用示例：invokeCloud('status') 或 invokeCloud('login', { locale: 'zh' })。
export async function invokeCloud<M extends CloudMethod>(method: M, ...args: Arguments<M>): Promise<CloudResults[M]> {
  // cloud:invoke 是主进程注册的 IPC 通道名；method 和参数对象一起发送过去。
  // args[0] 取调用者传入的参数，未传时用空对象；await 等待主进程处理并回复。
  // response 保存回复；as CloudResponse<M> 告诉 TypeScript 如何理解它，不会执行运行时校验。
  const response = (await ipcRenderer.invoke('cloud:invoke', method, args[0] || {})) as CloudResponse<M>
  // ?. 在 response 不存在时返回 undefined；响应缺失或 ok 不为真时，抛出统一的 CloudError。
  // 调用方可以用 try/catch 接住错误，再把错误码翻译成界面提示。
  if (!response?.ok) throw cloudError(response?.error)
  // 成功时只交回业务数据，调用方不需要每次处理外层的 { ok, data }。
  return response.data
}

// 订阅主进程主动推送的状态变化，例如授权完成或扩展安装完成。
// listener 是调用方提供的回调，接收新状态；返回值是一个取消订阅的函数。
export function watchCloudState(listener: (state: CloudState) => void): () => void {
  // Electron 的事件回调会收到两个参数：事件对象和主进程发送的数据。
  // _event 在这里不用，下划线表示有意忽略；state 是这次推送的状态快照。
  // onState 包装一层，只把 state 交给 listener，调用方无需处理 Electron 事件对象。
  const onState = (_event: Electron.IpcRendererEvent, state: CloudState) => listener(state)
  // 在 cloud:state 通道注册回调；之后每次收到推送都会执行 onState。
  ipcRenderer.on('cloud:state', onState)
  // 此处返回函数，并不立刻取消；调用方通常将它保存为 unwatch，离开页面时再调用。
  return () => {
    // 必须传入注册时同一个 onState 函数，才能准确移除本次订阅，避免重复监听。
    ipcRenderer.removeListener('cloud:state', onState)
  }
}

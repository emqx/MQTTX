<template>
  <div class="cloud-view rightbar">
    <header class="titlebar">
      <h1>EMQX Cloud</h1>
      <div class="cloud-actions">
        <el-button v-if="signedIn" type="text" @click="authenticate('logout')">{{ $t('cloud.logout') }}</el-button>
        <el-button
          v-if="!state.removed"
          class="cloud-remove"
          size="mini"
          icon="el-icon-delete"
          :disabled="removing"
          @click="remove"
          >{{ $t('cloud.remove') }}</el-button
        >
      </div>
    </header>
    <main class="cloud-body">
      <el-alert
        v-if="failure || state.error"
        :title="issueText(failure || state.error)"
        type="error"
        :closable="false"
      />
      <el-alert
        v-if="state.updateError && state.active"
        :title="issueText(state.updateError)"
        type="info"
        :closable="false"
      />
      <div v-if="state.removed" class="cloud-placeholder">
        <h2>{{ $t('cloud.removed') }}</h2>
        <p>{{ $t('cloud.addHint') }}</p>
        <el-button type="primary" :disabled="removing" @click="prepare('add')">{{ $t('cloud.add') }}</el-button>
      </div>
      <div v-else-if="!signedIn" class="cloud-placeholder cloud-login">
        <section class="cloud-login-card" aria-labelledby="cloud-login-title">
          <div class="cloud-login-mark" aria-hidden="true">
            <i v-if="waiting" class="el-icon-loading"></i>
            <svg v-else viewBox="0 0 48 48" fill="none">
              <path
                d="M14 35h23a8 8 0 0 0 1-16 14 14 0 0 0-27-2 9 9 0 0 0 3 18Z"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h2 id="cloud-login-title">{{ $t(waiting ? 'cloud.authorize' : 'cloud.connect') }}</h2>
          <el-alert
            v-if="state.session.message"
            class="cloud-session-alert"
            :title="issueText(state.session.message)"
            :type="waiting ? 'info' : 'warning'"
            :closable="false"
            show-icon
          />
          <div class="cloud-login-actions">
            <el-button v-if="waiting" @click="authenticate('cancel')">{{ $t('common.cancel') }}</el-button>
            <el-button
              v-else
              type="primary"
              icon="el-icon-top-right"
              :disabled="removing"
              @click="authenticate('login')"
              >{{ $t('cloud.login') }}</el-button
            >
          </div>
        </section>
      </div>
      <div v-else-if="!state.active" class="cloud-placeholder">
        <h2>{{ $t(state.error || failure ? 'cloud.notReady' : 'cloud.preparing') }}</h2>
        <p>{{ $t('cloud.prepareHint') }}</p>
        <el-button v-if="state.error || failure" @click="prepare('retry')">{{ $t('cloud.retry') }}</el-button>
      </div>
      <div v-if="signedIn && state.busy && state.active" class="cloud-updating">{{ $t('cloud.checking') }}</div>
      <div ref="frames" v-show="signedIn" class="cloud-frames"></div>
    </main>
    <footer class="cloud-footer">
      <span v-if="signedIn" class="cloud-session-remaining">
        {{ $t('cloud.remaining') }} {{ $t('cloud.minutes', { count: minutes }) }}
      </span>
      <span class="cloud-footer-brand">EMQX Cloud</span>
    </footer>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { invokeCloud, watchCloudState } from '@/utils/cloudClient'
import type { CloudState, CloudTheme, CloudIssue } from '@/types/cloud'
import { cloudIssue } from '@/utils/cloudErrors'
import { CloudFrameManager } from '@/utils/cloudFrameManager'
import { cloudErrorKey } from '@/utils/cloudI18n'
import cloudMessages from '@/lang/cloud'

@Component
export default class Cloud extends Vue {
  // 从 Vuex 读取 MQTTX 当前主题；下面的 @Watch 会在主题切换时通知扩展页面。
  @Getter('currentTheme') private currentTheme!: Theme
  // 主进程提供的 Cloud 状态快照，用来决定显示登录、准备中还是扩展业务页面。
  // 这里不保存 token；登录认证和凭据保存由主进程负责。
  private state: CloudState = {
    // 状态版本号。初始为 -1，保证能接收主进程第一次推送的状态。
    revision: -1,
    // 会话状态、提示消息和到期时间；初始按未登录展示，随后由主进程更新。
    session: { status: 'signed-out', message: null, expiresAt: null },
    // 是否已移除扩展；为 true 时展示重新添加入口。
    removed: false,
    // 是否正在检查、下载或安装扩展。
    busy: false,
    // 当前已启用的扩展版本；null 表示尚无可用版本。
    active: null,
    // 正在试运行、等待页面报告就绪的新版本，确认可用后才切换为 active。
    candidate: null,
    // 扩展准备或运行失败的错误，与下面页面自身捕获的 failure 区分。
    error: null,
    // 更新失败的提示；已有 active 时仍可继续使用旧版本。
    updateError: null,
  }
  // 当前时间，定时更新后让 Vue 重新计算页面上的授权剩余分钟数。
  private now = Date.now()
  // 计时器句柄，用于离开页面时停止计时；它不轮询主进程状态。
  private clock: ReturnType<typeof setInterval> | undefined
  // Vue 的计算属性：会话是否有效，模板据此显示业务页面或登录页面。
  private get signedIn(): boolean {
    return this.state.session.status === 'signed-in'
  }
  // 浏览器中等待授权或正在用授权码换取 token 时，显示等待状态和取消按钮。
  private get waiting(): boolean {
    return ['authorizing', 'exchanging'].includes(this.state.session.status)
  }
  // 把剩余毫秒换算为分钟并向上取整；过期后最低显示 0。
  private get minutes(): number {
    return Math.max(0, Math.ceil(((this.state.session.expiresAt || this.now) - this.now) / 60000))
  }
  // 处理登录、退出和取消授权。method 指定操作，真正的认证逻辑在主进程中执行。
  private async authenticate(method: 'login' | 'logout' | 'cancel'): Promise<void> {
    this.failure = null
    try {
      // next 是操作完成后的状态快照；登录时附上当前语言，供浏览器授权页面使用。
      const next =
        method === 'login' ? await invokeCloud('login', { locale: this.$i18n.locale }) : await invokeCloud(method)
      await this.applyState(next)
    } catch (error) {
      // 请求可能在离开页面后才失败，因此仅在组件仍存在时更新错误提示。
      if (this.alive) this.failure = cloudIssue(error)
    }
  }
  // 本页面调用通信接口或同步 iframe 时捕获的错误，模板会将其翻译后显示。
  private failure: CloudIssue | null = null
  // 移除操作进行中时禁用相关按钮，避免重复触发。
  private removing = false
  // 管理扩展 iframe 的创建、切换、销毁和消息桥；本组件负责页面展示。
  private frameManager: CloudFrameManager | null = null
  // 组件是否尚未销毁，用于丢弃离开页面后返回的异步结果。
  private alive = true
  // 状态订阅的取消函数；销毁组件时调用，停止接收主进程推送。
  private unwatch: (() => void) | null = null
  // 状态同步任务队列。让多次状态更新依次执行，避免同时创建或销毁 iframe。
  private syncTask: Promise<void> = Promise.resolve()
  // 将结构化错误 issue 的错误码和参数转换为当前语言的文案；无错误时返回空字符串。
  private issueText(issue: CloudIssue | null): string {
    return issue ? String(this.$t(cloudErrorKey(issue), issue.params)) : ''
  }
  // Vue 生命周期：页面 DOM 已创建，可以取得 ref 容器并开始订阅、加载 Cloud。
  async mounted(): Promise<void> {
    this.clock = setInterval(() => {
      this.now = Date.now()
    }, 1000)
    this.frameManager = new CloudFrameManager({
      // 对应模板的 ref="frames"，扩展 iframe 会插入这个容器。
      container: this.$refs.frames as HTMLElement,
      // 传函数而非固定值，确保管理器每次都能取得最新主题和语言。
      theme: () => this.theme(),
      // 扩展报告就绪等操作也会产生新快照，统一交给 applyState 处理。
      onState: (state) => this.applyState(state),
    })
    // state 是主进程主动推送的新快照；页面不需要持续发送查询请求。
    this.unwatch = watchCloudState((state) => {
      this.applyState(state).catch((error) => {
        if (this.alive) this.failure = cloudIssue(error)
      })
    })
    // 首次进入通知主进程准备扩展，并取得当前状态。
    await this.prepare('enter')
  }
  // 扩展准备入口：enter 为进入页面，add 为重新添加，retry 为失败后重试。
  private async prepare(method: 'enter' | 'add' | 'retry'): Promise<void> {
    this.failure = null
    try {
      // next 是主进程执行对应操作后返回的状态，包含会话和扩展信息。
      const next = await invokeCloud(method)
      if (this.alive) {
        await this.applyState(next)
      }
    } catch (e) {
      if (this.alive) this.failure = cloudIssue(e)
    }
  }
  // 将新快照 next 排入同步队列，先更新页面数据，再让 iframe 跟随状态变化。
  private applyState(next: CloudState): Promise<void> {
    this.syncTask = this.syncTask
      // 上一次任务的错误由它的调用方处理；这里避免一次失败阻断后续所有更新。
      .catch(() => {})
      .then(async () => {
        // IPC 响应和状态推送可能先后到达，只接受比当前版本新的快照。
        if (!this.alive || next.revision <= this.state.revision) return
        this.state = next
        await this.frameManager?.sync(next)
      })
    return this.syncTask
  }
  // 收集扩展页面需要的语言、错误翻译和主题颜色，通过消息桥同步过去。
  private theme(): CloudTheme {
    // MQTTX 的主题变量定义在 body 上，因此从 body 读取最终计算出的颜色。
    const style = getComputedStyle(document.body)
    return {
      // 当前界面语言。
      lang: this.$i18n.locale,
      // code 是错误文案的键；转换成“错误码 -> 当前语言文案”的对象供扩展使用。
      messages: Object.fromEntries(
        Object.keys(cloudMessages.errors).map((code) => [code, String(this.$t(`cloud.errors.${code}`))]),
      ),
      // key 是 CSS 变量名；只传扩展需要的主题颜色，而不是整个宿主样式表。
      tokens: Object.fromEntries(
        [
          '--color-text-default',
          '--color-text-light',
          '--color-bg-primary',
          '--color-bg-normal',
          '--color-bg-item',
          '--color-bg-card-gradient',
          '--color-bg-btn-gradient',
          '--color-bg-skeleton',
          '--color-bg-skeleton_transition',
          '--color-shadow-card',
          '--color-text-title',
          '--color-main-green',
          '--color-border-default',
          '--color-minor-red',
        ].map((key) => [key, style.getPropertyValue(key).trim()]),
      ),
    }
  }
  // 两个监听器共用此方法：主题或语言变化时，把最新外观同步给扩展。
  @Watch('currentTheme')
  @Watch('$i18n.locale')
  private async onAppearanceChanged(): Promise<void> {
    // 等待 Vue 完成这一轮 DOM 更新，再读取已生效的主题颜色。
    await this.$nextTick()
    if (this.alive) this.frameManager?.syncTheme()
  }
  // 用户移除扩展：先确认，再清理页面并通知主进程删除扩展及 Cloud 会话。
  private async remove(): Promise<void> {
    try {
      await this.$confirm(String(this.$t('cloud.removeConfirm')), 'EMQX Cloud', {
        type: 'warning',
        confirmButtonText: String(this.$t('common.confirm')),
        cancelButtonText: String(this.$t('common.cancel')),
      })
    } catch {
      // Element UI 在取消或关闭确认框时会拒绝 Promise，此时结束操作即可。
      return
    }
    this.removing = true
    // 立即关闭扩展页面和消息通道，避免移除期间仍能继续操作业务页面。
    this.frameManager?.clear()
    try {
      await this.applyState(await invokeCloud('remove'))
      this.failure = null
    } catch (e) {
      this.failure = cloudIssue(e)
      // 移除未成功时重新读取实际状态，让页面与主进程保持一致。
      await this.applyState(await invokeCloud('status'))
    } finally {
      this.removing = false
    }
  }
  // Vue 生命周期：离开并销毁页面时，释放计时器、订阅、iframe 和通信资源。
  beforeDestroy(): void {
    this.alive = false
    clearInterval(this.clock)
    this.unwatch?.()
    this.frameManager?.dispose()
    this.frameManager = null
    // leave 只通知主进程离开 Cloud 页面，不等于退出账号；销毁过程无需等待响应。
    void invokeCloud('leave').catch(() => {})
  }
}
</script>
<style scoped lang="scss">
.cloud-view {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  color: var(--color-text-default);
}
.cloud-view > .titlebar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 16px;
  border-bottom: 1px solid var(--color-border-default);
}
header .el-button {
  -webkit-app-region: no-drag;
}
.cloud-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.cloud-remove {
  background: transparent;
}
.cloud-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  > .el-alert {
    flex-shrink: 0;
    border-radius: 0;
  }
}
.cloud-footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 16px;
  min-height: 32px;
  padding: 10px 16px;
  border-top: 1px solid var(--color-border-default);
  background: var(--color-bg-normal);
  color: var(--color-text-light);
  font-size: 12px;
  line-height: 1.6;
}
.cloud-session-remaining {
  color: var(--color-main-green);
}
.cloud-footer-brand {
  margin-left: auto;
}
.cloud-placeholder p,
.cloud-updating {
  color: var(--color-text-light);
}
.cloud-placeholder {
  text-align: center;
  padding: 70px 24px;
  border: 1px solid var(--color-border-default);
  border-radius: 12px;
  margin: 24px 16px 0;
  background: var(--color-bg-normal);
  box-shadow: 0 8px 28px -16px var(--color-shadow-card);
  h2 {
    margin: 0 0 8px;
    color: var(--color-text-title);
    font-size: 18px;
    font-weight: 600;
  }
  p {
    margin: 0 auto 24px;
    max-width: 420px;
    line-height: 1.7;
  }
}
.cloud-login {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow-y: auto;
  padding: 32px 16px 64px;
  margin: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.cloud-login-card {
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 500px;
  flex-shrink: 0;
  margin: auto;
  padding: 40px 40px 28px;
  border: 1px solid var(--color-border-default);
  border-radius: 12px;
  background: var(--color-bg-normal);
  box-shadow: 0 8px 28px -16px var(--color-shadow-card);
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 4px;
    background: var(--color-bg-btn-gradient);
  }
  h2 {
    margin: 24px 0 12px;
    color: var(--color-text-title);
    font-size: 22px;
    font-weight: 600;
    line-height: 1.4;
  }
}
.cloud-login-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto;
  border-radius: 16px;
  background: var(--color-bg-card-gradient);
  color: var(--color-main-green);
  font-size: 30px;
  svg {
    width: 40px;
    height: 40px;
  }
}
.cloud-session-alert {
  margin-top: 24px;
  text-align: left;
  &.el-alert--warning {
    background: color-mix(in srgb, var(--color-main-yellow) 10%, var(--color-bg-normal));
  }
  &.el-alert--info {
    background: var(--color-bg-primary);
  }
  ::v-deep .el-alert__title {
    font-size: 12px;
    line-height: 1.6;
  }
}
.cloud-login-actions {
  margin-top: 28px;
  .el-button {
    min-height: 40px;
    max-width: 100%;
    padding: 12px 24px;
    white-space: normal;
    line-height: 1.4;
  }
  .el-button--primary {
    border: 0;
    background: var(--color-bg-btn-gradient);
    box-shadow: 0 6px 16px -8px color-mix(in srgb, var(--color-main-green) 65%, transparent);
    &:hover,
    &:focus {
      background: var(--color-bg-btn-gradient);
      filter: brightness(1.06);
    }
  }
}
.cloud-updating {
  flex-shrink: 0;
  margin: 10px 16px;
}
@media (max-width: 640px) {
  .cloud-view > .titlebar {
    flex-wrap: wrap;
    gap: 8px;
  }
  .cloud-actions {
    flex-wrap: wrap;
    gap: 12px;
  }
  .cloud-login {
    padding: 16px 0 32px;
  }
  .cloud-login-card {
    padding: 28px 24px 24px;
    h2 {
      font-size: 20px;
    }
  }
}
.cloud-frames {
  flex: 1;
  min-height: 0;
  position: relative;
  ::v-deep .cloud-frame {
    position: absolute;
    inset: 0;
    border: 0;
    width: 100%;
    height: 100%;
  }
}
</style>

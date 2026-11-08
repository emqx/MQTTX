<template>
  <div class="cloud-view rightbar">
    <header class="titlebar">
      <h1>EMQX Cloud</h1>
      <div class="cloud-actions">
        <template v-if="signedIn">
          <span>{{ $t('cloud.remaining') }} {{ $t('cloud.minutes', { count: minutes }) }}</span>
          <el-button type="text" @click="authenticate('logout')">{{ $t('cloud.logout') }}</el-button>
        </template>
        <el-button
          v-if="!state.removed"
          class="cloud-remove"
          type="text"
          icon="el-icon-delete"
          :disabled="removing"
          @click="remove"
          >{{ $t('cloud.remove') }}</el-button
        >
      </div>
    </header>
    <el-alert v-if="failure || state.error" :title="issueText(failure || state.error)" type="error" :closable="false" />
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
        <p class="cloud-login-description">{{ $t('cloud.loginHint') }}</p>
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
        <p class="cloud-login-security">
          <i class="el-icon-lock" aria-hidden="true"></i>{{ $t('cloud.passwordHint') }}
        </p>
      </section>
    </div>
    <div v-else-if="!state.active" class="cloud-placeholder">
      <h2>{{ $t(state.error || failure ? 'cloud.notReady' : 'cloud.preparing') }}</h2>
      <p>{{ $t('cloud.prepareHint') }}</p>
      <el-button v-if="state.error || failure" @click="prepare('retry')">{{ $t('cloud.retry') }}</el-button>
    </div>
    <div v-if="signedIn && state.busy && state.active" class="cloud-updating">{{ $t('cloud.checking') }}</div>
    <div ref="frames" v-show="signedIn" class="cloud-frames"></div>
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
  @Getter('currentTheme') private currentTheme!: Theme
  private state: CloudState = {
    revision: -1,
    session: { status: 'signed-out', message: null, expiresAt: null },
    removed: false,
    busy: false,
    active: null,
    candidate: null,
    error: null,
    updateError: null,
  }
  private now = Date.now()
  private clock: ReturnType<typeof setInterval> | undefined
  private get signedIn(): boolean {
    return this.state.session.status === 'signed-in'
  }
  private get waiting(): boolean {
    return ['authorizing', 'exchanging'].includes(this.state.session.status)
  }
  private get minutes(): number {
    return Math.max(0, Math.ceil(((this.state.session.expiresAt || this.now) - this.now) / 60000))
  }
  private async authenticate(method: 'login' | 'logout' | 'cancel'): Promise<void> {
    this.failure = null
    try {
      const next =
        method === 'login' ? await invokeCloud('login', { locale: this.$i18n.locale }) : await invokeCloud(method)
      await this.applyState(next)
    } catch (error) {
      if (this.alive) this.failure = cloudIssue(error)
    }
  }
  private failure: CloudIssue | null = null
  private removing = false
  private frameManager: CloudFrameManager | null = null
  private alive = true
  private unwatch: (() => void) | null = null
  private syncTask: Promise<void> = Promise.resolve()
  private issueText(issue: CloudIssue | null): string {
    return issue ? String(this.$t(cloudErrorKey(issue), issue.params)) : ''
  }
  async mounted(): Promise<void> {
    this.clock = setInterval(() => {
      this.now = Date.now()
    }, 1000)
    this.frameManager = new CloudFrameManager({
      container: this.$refs.frames as HTMLElement,
      theme: () => this.theme(),
      onState: (state) => this.applyState(state),
    })
    this.unwatch = watchCloudState((state) => {
      this.applyState(state).catch((error) => {
        if (this.alive) this.failure = cloudIssue(error)
      })
    })
    await this.prepare('enter')
  }
  private async prepare(method: 'enter' | 'add' | 'retry'): Promise<void> {
    this.failure = null
    try {
      const next = await invokeCloud(method)
      if (this.alive) {
        await this.applyState(next)
      }
    } catch (e) {
      if (this.alive) this.failure = cloudIssue(e)
    }
  }
  private applyState(next: CloudState): Promise<void> {
    this.syncTask = this.syncTask
      .catch(() => {})
      .then(async () => {
        if (!this.alive || next.revision <= this.state.revision) return
        this.state = next
        await this.frameManager?.sync(next)
      })
    return this.syncTask
  }
  private theme(): CloudTheme {
    const style = getComputedStyle(document.body)
    return {
      lang: this.$i18n.locale,
      messages: Object.fromEntries(
        Object.keys(cloudMessages.errors).map((code) => [code, String(this.$t(`cloud.errors.${code}`))]),
      ),
      tokens: Object.fromEntries(
        ['--color-text-default', '--color-text-light', '--color-bg-primary', '--color-bg-normal'].map((key) => [
          key,
          style.getPropertyValue(key).trim(),
        ]),
      ),
    }
  }
  @Watch('currentTheme')
  @Watch('$i18n.locale')
  private async onAppearanceChanged(): Promise<void> {
    await this.$nextTick()
    if (this.alive) this.frameManager?.syncTheme()
  }
  private async remove(): Promise<void> {
    try {
      await this.$confirm(String(this.$t('cloud.removeConfirm')), 'EMQX Cloud', {
        type: 'warning',
        confirmButtonText: String(this.$t('common.confirm')),
        cancelButtonText: String(this.$t('common.cancel')),
      })
    } catch {
      return
    }
    this.removing = true
    this.frameManager?.clear()
    try {
      await this.applyState(await invokeCloud('remove'))
      this.failure = null
    } catch (e) {
      this.failure = cloudIssue(e)
      await this.applyState(await invokeCloud('status'))
    } finally {
      this.removing = false
    }
  }
  beforeDestroy(): void {
    this.alive = false
    clearInterval(this.clock)
    this.unwatch?.()
    this.frameManager?.dispose()
    this.frameManager = null
    void invokeCloud('leave').catch(() => {})
  }
}
</script>
<style scoped lang="scss">
.cloud-view {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 16px;
  color: var(--color-text-default);
}
header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
header .el-button {
  -webkit-app-region: no-drag;
}
.cloud-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.cloud-actions span {
  color: var(--color-text-light);
}
.cloud-placeholder p,
.cloud-updating {
  color: var(--color-text-light);
}
.cloud-placeholder {
  text-align: center;
  padding: 70px 24px;
  border: 1px solid var(--color-border-default);
  border-radius: 10px;
  margin-top: 24px;
}
header .cloud-remove {
  color: var(--color-text-light);
  &:hover,
  &:focus {
    color: var(--color-minor-red);
  }
}
.cloud-login {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow-y: auto;
  padding: 32px 16px 64px;
  margin-top: 0;
  border: 0;
  border-radius: 0;
}
.cloud-login-card {
  width: 100%;
  max-width: 500px;
  flex-shrink: 0;
  margin: auto;
  padding: 36px 40px 28px;
  border: 1px solid var(--color-border-default);
  border-radius: 12px;
  background: var(--color-bg-normal);
  box-shadow: 0 8px 28px -16px var(--color-shadow-card);
  h2 {
    margin: 24px 0 12px;
    color: var(--color-text-title);
    font-size: 22px;
    font-weight: 600;
    line-height: 1.4;
  }
  .cloud-login-description {
    margin: 0;
    color: var(--color-text-default);
    font-size: 14px;
    line-height: 1.8;
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
  background: color-mix(in srgb, var(--color-main-green) 10%, var(--color-bg-normal));
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
}
.cloud-login-card .cloud-login-security {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 7px;
  margin: 28px 0 0;
  padding-top: 20px;
  border-top: 1px solid var(--color-border-default);
  font-size: 12px;
  line-height: 1.7;
  i {
    margin-top: 3px;
  }
}
.cloud-updating {
  margin: 10px 0;
}
@media (max-width: 640px) {
  header {
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
    border: 0;
    width: 100%;
    height: 100%;
  }
}
</style>

<template>
  <div class="cloud-view rightbar">
    <header class="titlebar">
      <h1><i class="iconfont icon-cloud-logo" aria-hidden="true"></i>EMQX Cloud</h1>
      <div class="cloud-actions">
        <el-dropdown v-if="signedIn" class="cloud-account-menu" trigger="click" @command="authenticate('logout')">
          <button
            type="button"
            class="cloud-account"
            :title="state.session.email"
            :aria-label="state.session.email || $t('cloud.account')"
            @keydown.enter.prevent
          >
            <span class="cloud-account-avatar" aria-hidden="true">
              <template v-if="accountInitial">{{ accountInitial }}</template>
              <i v-else class="el-icon-user"></i>
            </span>
            <span v-if="state.session.email" class="cloud-account-email">{{ state.session.email }}</span>
            <i class="el-icon-arrow-down" aria-hidden="true"></i>
          </button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="logout">{{ $t('cloud.logout') }}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-dropdown v-else-if="!state.removed" class="cloud-more-menu" trigger="click" @command="remove">
          <button
            type="button"
            class="cloud-more"
            :title="$t('cloud.remove')"
            :aria-label="$t('cloud.remove')"
            :disabled="removing"
          >
            <i class="iconfont icon-more" aria-hidden="true"></i>
          </button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="remove">{{ $t('cloud.remove') }}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
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
      >
        <el-button type="text" :disabled="state.busy" @click="prepare('retry')">{{ $t('cloud.retry') }}</el-button>
      </el-alert>
      <div v-if="state.removed" class="cloud-login cloud-signin-layout">
        <section class="cloud-intro">
          <div class="cloud-intro-body">
            <h2>{{ $t('cloud.introTitle') }}</h2>
            <p>{{ $t('cloud.introSubtitle') }}</p>
            <ul class="cloud-perks">
              <li v-for="perk in perks" :key="perk.key">
                <span class="cloud-perk-tile" aria-hidden="true"><CloudIcon :name="perk.icon" /></span>
                <p>{{ $t(`cloud.${perk.key}`) }}</p>
              </li>
            </ul>
          </div>
        </section>
        <section class="cloud-signin-panel" aria-labelledby="cloud-removed-title">
          <div class="cloud-signin-wrap">
            <div class="cloud-bridge" aria-hidden="true">
              <span class="cloud-node">
                <span class="cloud-node-tile"><img src="@/assets/images/app-logo.png" alt="" /></span>MQTTX
              </span>
              <CloudWire />
              <span class="cloud-node">
                <span class="cloud-node-tile"><i class="iconfont icon-cloud-logo"></i></span>
                EMQX Cloud
              </span>
            </div>
            <div class="cloud-signin">
              <h2 id="cloud-removed-title" class="cloud-signin-title">{{ $t('cloud.removed') }}</h2>
              <p>{{ $t('cloud.addHint') }}</p>
              <el-button
                type="primary"
                class="cloud-signin-button"
                icon="el-icon-plus"
                :disabled="removing"
                @click="prepare('add')"
              >
                {{ $t('cloud.add') }}
              </el-button>
            </div>
          </div>
        </section>
      </div>
      <div v-else-if="!signedIn" class="cloud-login cloud-signin-layout">
        <section class="cloud-intro">
          <div class="cloud-intro-body">
            <h2>{{ $t('cloud.introTitle') }}</h2>
            <p>{{ $t('cloud.introSubtitle') }}</p>
            <ul class="cloud-perks">
              <li v-for="perk in perks" :key="perk.key">
                <span class="cloud-perk-tile" aria-hidden="true"><CloudIcon :name="perk.icon" /></span>
                <p>{{ $t(`cloud.${perk.key}`) }}</p>
              </li>
            </ul>
          </div>
        </section>
        <section class="cloud-signin-panel" :class="{ waiting }" aria-labelledby="cloud-login-title">
          <div class="cloud-signin-wrap">
            <div class="cloud-bridge" aria-hidden="true">
              <span class="cloud-node">
                <span class="cloud-node-tile"><img src="@/assets/images/app-logo.png" alt="" /></span>MQTTX
              </span>
              <CloudWire />
              <span class="cloud-node">
                <span class="cloud-node-tile">
                  <i class="iconfont icon-cloud-logo"></i>
                  <span v-if="waiting" class="cloud-node-busy"></span>
                </span>
                EMQX Cloud
              </span>
            </div>
            <div class="cloud-signin">
              <h2 id="cloud-login-title" class="cloud-signin-title">
                {{ $t(waiting ? 'cloud.authorize' : 'cloud.connect') }}
              </h2>
              <p>{{ $t(waiting ? 'cloud.authorizeHint' : 'cloud.tagline') }}</p>
              <el-alert
                v-if="state.session.message"
                class="cloud-session-alert"
                :title="issueText(state.session.message)"
                :type="waiting ? 'info' : 'warning'"
                :closable="false"
                show-icon
              />
              <template v-if="waiting">
                <el-button class="cloud-signin-button" :disabled="removing" @click="authenticate('login')">
                  {{ $t('cloud.reopen') }}<CloudIcon name="external" :size="15" />
                </el-button>
                <el-button type="text" class="cloud-signin-cancel" @click="authenticate('cancel')">
                  {{ $t('common.cancel') }}
                </el-button>
              </template>
              <template v-else>
                <el-button
                  type="primary"
                  class="cloud-signin-button"
                  :disabled="removing"
                  @click="authenticate('login')"
                >
                  {{ $t('cloud.login') }}<CloudIcon name="external" :size="15" />
                </el-button>
                <p class="cloud-login-note"><CloudIcon name="info" :size="14" />{{ $t('cloud.intlOnly') }}</p>
              </template>
            </div>
          </div>
        </section>
      </div>
      <div v-else-if="!state.active" class="cloud-login">
        <section class="cloud-login-card" role="status" aria-labelledby="cloud-preparing-title">
          <div class="cloud-login-mark" aria-hidden="true">
            <i v-if="state.error || failure" class="iconfont icon-cloud-logo"></i>
            <i v-else class="el-icon-loading"></i>
          </div>
          <h2 id="cloud-preparing-title">{{ $t(state.error || failure ? 'cloud.notReady' : 'cloud.preparing') }}</h2>
          <p class="cloud-login-tagline">{{ $t('cloud.prepareHint') }}</p>
          <div v-if="state.error || failure" class="cloud-login-actions">
            <el-button type="primary" icon="el-icon-refresh" @click="prepare('retry')">
              {{ $t('cloud.retry') }}
            </el-button>
          </div>
        </section>
      </div>
      <div v-if="signedIn && state.busy && state.active" class="cloud-updating">{{ $t('cloud.checking') }}</div>
      <div ref="frames" v-show="signedIn && state.active" class="cloud-frames"></div>
    </main>
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
import CloudIcon from './CloudIcon.vue'
import type { CloudIconName } from './CloudIcon.vue'
import CloudWire from './CloudWire.vue'

@Component({ components: { CloudIcon, CloudWire } })
export default class Cloud extends Vue {
  @Getter('currentTheme') private currentTheme!: Theme
  /** Why EMQX Cloud is worth signing in to, shown beside the sign-in panel. */
  private readonly perks: Array<{ key: string; icon: CloudIconName }> = [
    { key: 'perkFree', icon: 'zap' },
    { key: 'perkPrefill', icon: 'plus' },
    { key: 'perkRegion', icon: 'globe' },
    { key: 'perkScale', icon: 'layers' },
  ]
  private state: CloudState = {
    revision: -1,
    session: { status: 'signed-out', message: null, expiresAt: null, email: null },
    removed: false,
    busy: false,
    active: null,
    candidate: null,
    error: null,
    updateError: null,
  }
  private get signedIn(): boolean {
    return this.state.session.status === 'signed-in'
  }
  private get accountInitial(): string {
    return this.state.session.email?.charAt(0).toUpperCase() || ''
  }
  private get waiting(): boolean {
    return ['authorizing', 'exchanging'].includes(this.state.session.status)
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
    this.frameManager = new CloudFrameManager({
      container: this.$refs.frames as HTMLElement,
      theme: () => this.theme(),
      onState: (state) => this.applyState(state),
      onCreateConnection: (connection) => {
        this.$router.push({
          path: '/recent_connections/0',
          query: { oper: 'create', cloudConnection: JSON.stringify(connection) },
        })
      },
      onRemove: () => {
        void this.remove()
      },
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
        this.failure = null
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
  h1 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    white-space: nowrap;
  }
  h1 .iconfont {
    font-size: 22px;
    font-weight: normal;
    color: var(--color-emqx);
  }
}
.cloud-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  > .el-button {
    flex-shrink: 0;
  }
}
.cloud-account-menu {
  min-width: 0;
  -webkit-app-region: no-drag;
}
.cloud-more-menu {
  flex-shrink: 0;
  -webkit-app-region: no-drag;
}
.cloud-account {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 100%;
  padding: 4px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-default);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  &:hover,
  &:focus-visible {
    background: var(--color-bg-primary);
  }
  &:focus-visible {
    outline: 2px solid var(--color-main-green);
    outline-offset: 2px;
  }
  > .el-icon-arrow-down {
    flex-shrink: 0;
    color: var(--color-text-light);
    font-size: 12px;
  }
}
.cloud-account-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-main-green) 20%, var(--color-bg-normal));
  color: var(--color-main-green);
  font-weight: 600;
}
.cloud-account-email {
  min-width: 0;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cloud-more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-default);
  font-size: 16px;
  cursor: pointer;
  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    background: var(--color-bg-primary);
  }
  &:focus-visible {
    outline: 2px solid var(--color-main-green);
    outline-offset: 2px;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
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
.cloud-updating {
  color: var(--color-text-light);
}
.cloud-login {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow-y: auto;
  padding: 32px 16px 64px;
  text-align: center;
}
.cloud-login-card {
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 540px;
  flex-shrink: 0;
  margin: auto;
  padding: 40px;
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
}
.cloud-login-tagline {
  margin: 0 auto;
  max-width: 420px;
  color: var(--color-text-light);
  font-size: 13px;
  line-height: 1.7;
}
.cloud-login-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto;
  border-radius: 12px;
  background: var(--color-bg-card-gradient);
  color: var(--color-main-green);
  font-size: 30px;
  .icon-cloud-logo {
    color: var(--color-emqx);
    font-size: 40px;
    line-height: 1;
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
    background: var(--color-main-green);
    &:hover,
    &:focus {
      background: var(--color-minor-green);
    }
  }
}
.cloud-login-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 20px auto 0;
  color: var(--color-text-light);
  font-size: 12px;
  line-height: 1.5;
}

/* Sign-in: the pitch on the left, the actual sign-in on the right */
.cloud-signin-layout {
  padding: 0;
  overflow: hidden;
  text-align: left;
}
.cloud-intro,
.cloud-signin-panel {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 48px 56px;
  overflow-y: auto;
}
.cloud-intro-body {
  width: 560px;
  max-width: 100%;
  h2 {
    margin: 0;
    color: var(--color-text-title);
    font-size: 28px;
    font-weight: 600;
    line-height: 1.36;
  }
  > p {
    margin: 12px 0 0;
    color: var(--color-text-default);
    font-size: 15px;
    line-height: 1.67;
  }
}
.cloud-perks {
  margin: 36px 0 0;
  padding: 0;
  list-style: none;
  li {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    + li {
      margin-top: 18px;
    }
  }
  p {
    margin: 5px 0 0;
    color: var(--color-text-default);
    font-size: 14px;
    line-height: 1.57;
  }
}
.cloud-perk-tile {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  background: var(--color-bg-normal);
  color: var(--color-main-green);
}
.cloud-signin-panel {
  border-left: 1px solid var(--color-border-default);
  background-color: var(--color-bg-normal);
  background-image: radial-gradient(var(--color-border-default) 1.2px, transparent 1.2px);
  background-size: 22px 22px;
  background-position: center;
}
.cloud-signin-wrap {
  width: 360px;
  max-width: 100%;
}
.cloud-bridge {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  margin-bottom: 36px;
}
.cloud-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--color-text-default);
  font-size: 12px;
  line-height: 1.34;
}
.cloud-node-tile {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: 1px solid var(--color-border-default);
  border-radius: 16px;
  background: var(--color-bg-normal);
  box-shadow: 0 6px 20px var(--color-shadow-card);
  img {
    width: 36px;
    height: 36px;
  }
  .icon-cloud-logo {
    color: var(--color-emqx);
    font-size: 30px;
    line-height: 1;
  }
}
.cloud-node-busy {
  position: absolute;
  inset: -12px;
  border: 2px solid var(--color-border-default);
  border-top-color: var(--color-emqx);
  border-radius: 50%;
  animation: cloud-spin 1.1s linear infinite;
}
@keyframes cloud-spin {
  to {
    transform: rotate(360deg);
  }
}
.cloud-signin {
  text-align: center;
  > p {
    margin: 8px 0 0;
    color: var(--color-text-default);
    font-size: 13px;
    line-height: 1.62;
  }
}
.cloud-signin-title {
  margin: 12px 0 0;
  color: var(--color-text-title);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
}
.cloud-signin-button.el-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 36px;
  margin: 28px 0 0;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  white-space: normal;
  &.el-button--primary {
    border: 0;
    background: var(--color-main-green);
    &:hover,
    &:focus {
      background: var(--color-minor-green);
    }
  }
}
.cloud-signin-cancel.el-button {
  width: 100%;
  margin: 12px 0 0;
  padding: 0;
  color: var(--color-text-default);
  font-size: 13px;
  &:hover,
  &:focus {
    color: var(--color-main-green);
  }
}
.cloud-updating {
  flex-shrink: 0;
  margin: 10px 16px;
}
@media (prefers-reduced-motion: reduce) {
  .cloud-node-busy {
    animation: none;
  }
}
@media (max-width: 960px) {
  .cloud-signin-layout {
    flex-direction: column;
    overflow-y: auto;
  }
  .cloud-intro,
  .cloud-signin-panel {
    flex: none;
    padding: 32px 24px;
    overflow: visible;
  }
  .cloud-signin-panel {
    border-left: 0;
    border-top: 1px solid var(--color-border-default);
  }
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
  .cloud-intro-body h2 {
    font-size: 22px;
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

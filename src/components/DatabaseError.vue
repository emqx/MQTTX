<template>
  <div class="connect-database-error-page">
    <div class="page-content">
      <p class="info">
        {{ $t('common.database.corruptInfo') }}
      </p>
      <p class="error">{{ $t('common.database.errorLabel') }} - {{ connectDatabaseFailMessage }}</p>
    </div>
    <el-button class="rebuild-database-btn" type="primary" @click="confirmRebuild">
      {{ $t('common.database.rebuildDatabase') }}
    </el-button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { ipcRenderer } from 'electron'

@Component
export default class DatabaseError extends Vue {
  @Getter('connectDatabaseFailMessage') private connectDatabaseFailMessage!: string

  private rebuildDatabase() {
    ipcRenderer.send('rebuildDatabase')
  }

  private confirmRebuild() {
    this.$confirm(this.$t('common.database.rebuildConfirmMessage') as string, {
      title: this.$t('common.database.rebuildConfirmTitle') as string,
      showClose: false,
      closeOnClickModal: false,
      confirmButtonText: this.$t('common.confirm') as string,
      cancelButtonText: this.$t('common.cancel') as string,
      type: 'warning',
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          instance.confirmButtonLoading = true
          instance.confirmButtonText = this.$t('common.database.loading') as string
        }
        done()
      },
    }).then(() => {
      try {
        this.rebuildDatabase()
        this.$log.info('Database rebuild completed. The application will restart')
      } catch (error) {
        this.$log.error(`Failed to rebuilding database: ${error}`)
      }
    })
  }

  private mounted() {
    this.$log.error(`Database error - ${this.connectDatabaseFailMessage}`)
  }
}
</script>

<style lang="scss">
.connect-database-error-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  .page-content {
    text-align: center;
    width: 60%;
    font-size: 20px;
    margin-bottom: 24px;
    .info {
      margin-bottom: 14px;
    }
    .error {
      color: var(--color-minor-red);
    }
  }
  .rebuild-database-btn {
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
  }
}
</style>

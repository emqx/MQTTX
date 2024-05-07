<template>
  <div class="connect-database-error-page">
    <div class="page-content">
      <p class="info">
        A corruption has been detected in the database file, preventing the software from launching properly. To fix
        this, please click 'Rebuild Database'.
      </p>
      <p class="error">Error - {{ connectDatabaseFailMessage }}</p>
    </div>
    <el-button class="rebuild-database-btn" type="primary" @click="confirmRebuild"> Rebuild Database </el-button>
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
    this.$confirm('Proceed with database rebuild now? All data will be lost and cannot be undone', {
      title: 'Database Rebuild Confirmation',
      showClose: false,
      closeOnClickModal: false,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      type: 'warning',
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          instance.confirmButtonLoading = true
          instance.confirmButtonText = 'Loading...'
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
    this.$log.error(`Database connect error - ${this.connectDatabaseFailMessage}`)
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

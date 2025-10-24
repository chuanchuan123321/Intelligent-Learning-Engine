import { defineStore } from 'pinia'
import * as dbStorage from '../utils/dbStorage'

// Key for storing app configuration in IndexedDB
const CONFIG_STORAGE_KEY = 'appConfiguration'

export const useAppConfigStore = defineStore('appConfig', {
  state: () => ({
    // Application settings with default values
    smallModelEnabled: true, // 默认启用小模型辅助功能
    isLoading: false
  }),
  
  actions: {
    // 初始化 - 从IndexedDB加载配置
    async initialize() {
      try {
        this.isLoading = true
        const storedConfig = await dbStorage.getItem(CONFIG_STORAGE_KEY)
        
        if (storedConfig) {
          const config = JSON.parse(storedConfig)
          // 更新状态，保留默认值作为后备
          this.smallModelEnabled = config.smallModelEnabled ?? true
        } else {
          // 没有存储的配置，使用默认值并保存
          await this.saveConfiguration()
        }
      } catch (error) {
        console.error('从IndexedDB加载配置失败:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 保存配置到IndexedDB
    async saveConfiguration() {
      try {
        this.isLoading = true
        const config = {
          smallModelEnabled: this.smallModelEnabled
        }
        await dbStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
        return true
      } catch (error) {
        console.error('保存配置到IndexedDB失败:', error)
        return false
      } finally {
        this.isLoading = false
      }
    },
    
    // 设置小模型辅助功能开关
    async setSmallModelEnabled(value) {
      this.smallModelEnabled = !!value
      return await this.saveConfiguration()
    },
    
    // 重置配置到默认值
    async resetToDefaults() {
      this.smallModelEnabled = true
      return await this.saveConfiguration()
    }
  }
}) 
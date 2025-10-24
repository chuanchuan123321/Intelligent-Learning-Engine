import './assets/main.css'
import './assets/code-styles.css'
import 'element-plus/dist/index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router'
import App from './App.vue'

// 完全禁用Vue Devtools的localStorage存储
// 防止localStorage配额问题
try {
  // 重写localStorage.setItem方法以拦截Vue Devtools的存储操作
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    // 如果是Vue Devtools相关的键，则不保存
    if (key && key.includes('__VUE_DEVTOOLS')) {
      console.log('拦截Vue Devtools存储:', key);
      return;
    }
    // 否则使用原始方法
    originalSetItem.apply(this, arguments);
  };
} catch (e) {
  console.error('禁用Vue Devtools存储失败:', e);
}

// 创建应用实例
const app = createApp(App)

// 初始化Pinia状态管理
const pinia = createPinia()
app.use(pinia)

// 注册路由
app.use(router)

// 注册Element Plus
app.use(ElementPlus)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 挂载应用
app.mount('#app')

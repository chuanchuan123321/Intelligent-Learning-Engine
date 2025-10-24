<script setup>
import { ref, computed, onMounted, provide, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import TheWelcome from './components/TheWelcome.vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { useAuthStore } from './stores/authStore'
import { useKnowledgeStore } from './stores/knowledgeStore'
import { useAppConfigStore } from './stores/appConfigStore'

const authStore = useAuthStore()
const knowledgeStore = useKnowledgeStore()
const appConfigStore = useAppConfigStore()
const router = useRouter()
const route = useRoute()
const locale = ref(zhCn)

// 计算当前激活的菜单项
const activeMenuItem = computed(() => {
  // 首先尝试从localStorage中读取上次的选中状态
  const savedMenuItem = localStorage.getItem('activeMenuItem')
  
  // 根据一级路径确定激活项
  const path = route.path
  if (path === '/') return '/'
  if (path.startsWith('/chat')) return '/chat'
  if (path.startsWith('/knowledge-base')) return '/knowledge-base'
  if (path.startsWith('/multi-agent')) return '/multi-agent'
  if (path.startsWith('/dashboard')) return '/dashboard'
  if (path.startsWith('/admin')) return '/admin'
  
  // 如果当前路径不匹配任何菜单项且有保存的菜单项，则返回保存的菜单项
  if (savedMenuItem && !['/', '/chat', '/knowledge-base', '/multi-agent', '/dashboard', '/admin'].includes(path)) {
    return savedMenuItem
  }
  
  // 默认返回当前路径
  return path
})

// 监听activeMenuItem变化，保存到localStorage
watch(() => activeMenuItem.value, (newValue) => {
  if (newValue) {
    localStorage.setItem('activeMenuItem', newValue)
  }
})

// 处理菜单选择事件
function handleSelect(index) {
  // 保存选中的菜单项到本地存储
  localStorage.setItem('activeMenuItem', index)
}

// 向量库关键配置
const AI_API_KEY = 'sk-ECDknwAwbrjRDOVegNuk5Zk2zOfXqFthxL36Z7miazL3QGO6'

// 检查向量库状态并初始化
onMounted(async () => {
  console.log('正在检查向量库状态...')
  
  try {
    // 初始化应用配置
    await appConfigStore.initialize()
    
    // 加载所有知识库文档
    await knowledgeStore.getAdminDocuments()
    
    // 提供API_KEY给后代组件使用
    provide('API_KEY', AI_API_KEY)
    
    // 自动判断是否有文档需要向量化
    const documentsNeedVectorization = knowledgeStore.adminDocuments.some(doc => !doc.vectorized)
    
    // 如果有未向量化的文档，从先前会话，可以在控制台提示
    if (documentsNeedVectorization) {
      console.info('检测到未向量化的文档，可以在管理页面手动触发向量化')
    }
    
    // 初始化导航菜单状态
    const currentPath = route.path
    const menuItems = ['/', '/chat', '/knowledge-base', '/multi-agent', '/dashboard', '/admin']
    
    // 如果当前路径是受支持的菜单项，则保存到localStorage
    if (menuItems.some(item => currentPath === item || currentPath.startsWith(item + '/'))) {
      const activeItem = menuItems.find(item => currentPath === item || currentPath.startsWith(item + '/'))
      if (activeItem) {
        localStorage.setItem('activeMenuItem', activeItem)
      }
    }
  } catch (error) {
    console.error('初始化向量库失败:', error)
  }
})

// 其他应用初始化代码...
</script>

<template>
  <div class="app-container">
    <el-header class="header">
      <div class="logo-container">
        <img src="./assets/logo.png" alt="Learning System Logo" class="logo" />
        <span class="logo-text">自适应学习路径规划系统</span>
      </div>
      
      <el-menu
        :default-active="activeMenuItem"
        mode="horizontal"
        router
        class="nav-menu"
        :ellipsis="false"
        @select="handleSelect"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/chat">学习诊断</el-menu-item>
        <el-menu-item index="/knowledge-base">知识图谱</el-menu-item>
        <el-menu-item index="/multi-agent">多智能体协作</el-menu-item>
        <el-menu-item index="/dashboard">效果分析</el-menu-item>
        <el-menu-item index="/admin" class="admin-link">管理员</el-menu-item>
      </el-menu>
    </el-header>
    
    <el-main class="main-content">
      <router-view />
    </el-main>
    
    <el-footer class="footer">
      <div>自适应学习路径规划系统 © {{ new Date().getFullYear() }} - 基于深度推理大模型与动态知识图谱双驱动框架</div>
    </el-footer>
    </div>
</template>

<style>
/* Global styles */
:root {
  --primary-color: #409EFF;
  --secondary-color: #67C23A;
  --text-color: #303133;
  --text-color-light: #606266;
  --border-color: #DCDFE6;
  --background-color: #F5F7FA;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-color);
  background-color: var(--background-color);
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  height: 40px;
  margin-right: 10px;
}

.logo-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--primary-color);
}

.nav-menu {
  border-bottom: none;
  flex-wrap: nowrap;
}

.nav-menu .el-menu-item {
  font-size: 14px;
  height: 60px;
  line-height: 60px;
}

.admin-link {
  color: var(--primary-color) !important;
  font-weight: bold;
}

.main-content {
  flex: 1;
  padding: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.footer {
  background-color: #fff;
  text-align: center;
  color: var(--text-color-light);
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

/* Router transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .nav-menu .el-menu-item {
    padding: 0 10px;
    font-size: 14px;
  }
}
</style>

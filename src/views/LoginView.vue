<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <img src="../assets/logo.png" alt="Learning System Logo" class="login-logo" />
          <h2>管理员登录</h2>
        </div>
      </template>
      
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="loginRules" 
        label-position="top"
        class="login-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="输入用户名"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <div class="login-options">
            <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
            <el-button type="text">忘记密码?</el-button>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="authStore.isLoading" 
            class="login-button"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div v-if="authStore.error" class="login-error">
        <el-alert
          :title="authStore.error"
          type="error"
          show-icon
          :closable="false"
        />
      </div>
      
      <div class="login-note">
        <p>提示: 使用 admin / admin123 登录管理员账号</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref(null)

const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3到20个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在6到20个字符之间', trigger: 'blur' }
  ]
}

async function handleLogin() {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    
    const success = await authStore.login(loginForm.username, loginForm.password)
    
    if (success) {
      ElMessage.success('登录成功，欢迎回来！')
      router.push('/admin')
    }
  } catch (error) {
    console.error('Login validation failed:', error)
    ElMessage.error('登录失败，请重试')
  }
}
</script>

<style scoped>
.login-container {
  min-height: calc(100vh - 120px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: var(--el-bg-color-page);
}

.login-card {
  width: 100%;
  max-width: 450px;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}

.login-logo {
  height: 60px;
  margin-bottom: 1rem;
}

.login-header h2 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 1.8rem;
}

.login-form {
  margin-top: 1rem;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.login-button {
  width: 100%;
  margin-top: 1rem;
  padding: 12px 20px;
  font-size: 1.1rem;
}

.login-error {
  margin-top: 1rem;
}

.login-note {
  margin-top: 2rem;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

@media (max-width: 480px) {
  .login-container {
    padding: 1rem;
  }
  
  .login-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style> 
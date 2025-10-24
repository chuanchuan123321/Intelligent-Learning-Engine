import { defineStore } from 'pinia'

// IndexedDB helper functions
const dbName = 'ip-expert-db'
const dbVersion = 1
const authStoreName = 'auth'

// Initialize the database
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion)
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error)
      reject(event.target.error)
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(authStoreName)) {
        db.createObjectStore(authStoreName, { keyPath: 'id' })
      }
    }
    
    request.onsuccess = (event) => {
      resolve(event.target.result)
    }
  })
}

// Save data to IndexedDB
async function saveToIndexedDB(key, value) {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(authStoreName, 'readwrite')
      const store = transaction.objectStore(authStoreName)
      
      const request = store.put({ id: key, value })
      
      request.onsuccess = () => resolve(true)
      request.onerror = (event) => {
        console.error('Error saving to IndexedDB:', event.target.error)
        reject(event.target.error)
      }
    })
  } catch (error) {
    console.error('IndexedDB save error:', error)
    return false
  }
}

// Get data from IndexedDB
async function getFromIndexedDB(key) {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(authStoreName, 'readonly')
      const store = transaction.objectStore(authStoreName)
      
      const request = store.get(key)
      
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null)
      }
      
      request.onerror = (event) => {
        console.error('Error getting from IndexedDB:', event.target.error)
        reject(event.target.error)
      }
    })
  } catch (error) {
    console.error('IndexedDB get error:', error)
    return null
  }
}

// Remove data from IndexedDB
async function removeFromIndexedDB(key) {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(authStoreName, 'readwrite')
      const store = transaction.objectStore(authStoreName)
      
      const request = store.delete(key)
      
      request.onsuccess = () => resolve(true)
      request.onerror = (event) => {
        console.error('Error removing from IndexedDB:', event.target.error)
        reject(event.target.error)
      }
    })
  } catch (error) {
    console.error('IndexedDB remove error:', error)
    return false
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAdmin: false,
    userInfo: null,
    isLoading: false,
    error: null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.userInfo,
    isAdminUser: (state) => state.isAdmin,
  },
  
  actions: {
    async login(username, password) {
      this.isLoading = true
      this.error = null
      
      try {
        // In a real implementation, this would make an API call to authenticate
        // const response = await axios.post('/api/auth/login', { username, password })
        
        // For demo purposes, we'll use a mock login
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // Check admin credentials (in a real app, this would be done on the server)
        if (username === 'admin' && password === 'admin123') {
          this.userInfo = {
            id: 1,
            username: 'admin',
            name: '系统管理员',
            email: 'admin@example.com',
          }
          this.isAdmin = true
          
          // Store admin state in IndexedDB
          await saveToIndexedDB('isAdmin', true)
          
          return true
        } else {
          throw new Error('用户名或密码错误')
        }
      } catch (error) {
        this.error = error.message || '登录失败'
        return false
      } finally {
        this.isLoading = false
      }
    },
    
    async logout() {
      this.userInfo = null
      this.isAdmin = false
      
      // Clear data from IndexedDB
      await removeFromIndexedDB('isAdmin')
    },
    
    async checkAuth() {
      try {
        // Get admin state from IndexedDB
        const isAdmin = await getFromIndexedDB('isAdmin')
        
        if (isAdmin) {
          this.isAdmin = true
          this.userInfo = {
            id: 1,
            username: 'admin',
            name: '系统管理员',
            email: 'admin@example.com',
          }
        }
        
        return !!isAdmin
      } catch (error) {
        console.error('Error checking auth state:', error)
        return false
      }
    }
  }
}) 
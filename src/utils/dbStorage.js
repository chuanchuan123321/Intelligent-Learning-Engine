/**
 * IndexedDB存储工具
 * 提供类似localStorage的API，但使用IndexedDB作为存储引擎
 */

const DB_NAME = 'ip-expert-app-storage';
const STORE_NAME = 'app-data';
const DB_VERSION = 2;

// 初始化数据库
function initDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('初始化IndexedDB失败:', event.target.error);
      reject(event.target.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
}

/**
 * 存储键值对
 * @param {string} key - 键名
 * @param {any} value - 值(会被JSON.stringify序列化)
 * @returns {Promise<void>}
 */
export async function setItem(key, value) {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // 序列化值
      let serializedValue;
      try {
        serializedValue = JSON.stringify(value);
      } catch (e) {
        reject(new Error('无法序列化值'));
        return;
      }
      
      const request = store.put({ key, value: serializedValue });
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error('IndexedDB存储失败:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('IndexedDB setItem错误:', error);
    throw error;
  }
}

/**
 * 获取键对应的值
 * @param {string} key - 键名
 * @returns {Promise<any>} - 返回值(已反序列化)，不存在则返回null
 */
export async function getItem(key) {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const data = request.result;
        if (!data) {
          resolve(null);
          return;
        }
        
        // 反序列化值
        try {
          const value = JSON.parse(data.value);
          resolve(value);
        } catch (e) {
          console.error('反序列化失败:', e);
          resolve(data.value); // 返回原始字符串
        }
      };
      
      request.onerror = (event) => {
        console.error('IndexedDB获取失败:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('IndexedDB getItem错误:', error);
    return null;
  }
}

/**
 * 删除键值对
 * @param {string} key - 键名
 * @returns {Promise<void>}
 */
export async function removeItem(key) {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error('IndexedDB删除失败:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('IndexedDB removeItem错误:', error);
    throw error;
  }
}

/**
 * 清空所有数据
 * @returns {Promise<void>}
 */
export async function clear() {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error('IndexedDB清空失败:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('IndexedDB clear错误:', error);
    throw error;
  }
}

/**
 * 获取所有键
 * @returns {Promise<string[]>} - 所有键的数组
 */
export async function keys() {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        console.error('IndexedDB获取键失败:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('IndexedDB keys错误:', error);
    return [];
  }
}

// 创建一个模拟localStorage的对象
export const dbStorage = {
  setItem,
  getItem,
  removeItem,
  clear,
  keys
};

export default dbStorage; 
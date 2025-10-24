import { defineStore } from 'pinia'
import axios from 'axios'
import mammoth from 'mammoth'
import { storeDocumentVectors, deleteDocumentVectors } from '../utils/vectorStore'

// 配置参数
const AI_API_KEY = 'sk-ECDknwAwbrjRDOVegNuk5Zk2zOfXqFthxL36Z7miazL3QGO6'

// IndexedDB for document storage
const dbName = 'ip-expert-docs-db'
const dbVersion = 2
const docStoreName = 'documents'

// Initialize the database
function initDocsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion)
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error)
      reject(event.target.error)
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(docStoreName)) {
        const store = db.createObjectStore(docStoreName, { keyPath: 'id', autoIncrement: true })
        // Create indexes for search
        store.createIndex('title', 'title', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('category', 'category', { unique: false })
        store.createIndex('uploadDate', 'uploadDate', { unique: false })
      }
    }
    
    request.onsuccess = (event) => {
      resolve(event.target.result)
    }
  })
}

// Save document to IndexedDB
async function saveDocumentToIndexedDB(document) {
  try {
    const db = await initDocsDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(docStoreName, 'readwrite')
      const store = transaction.objectStore(docStoreName)
      
      const request = store.add(document)
      
      request.onsuccess = (event) => {
        document.id = event.target.result // Get the auto-generated id
        resolve(document)
      }
      
      request.onerror = (event) => {
        console.error('Error saving document to IndexedDB:', event.target.error)
        reject(event.target.error)
      }
    })
  } catch (error) {
    console.error('IndexedDB save document error:', error)
    throw error
  }
}

// Get all documents from IndexedDB
async function getAllDocumentsFromIndexedDB() {
  try {
    const db = await initDocsDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(docStoreName, 'readonly')
      const store = transaction.objectStore(docStoreName)
      
      const request = store.getAll()
      
      request.onsuccess = () => {
        resolve(request.result)
      }
      
      request.onerror = (event) => {
        console.error('Error getting documents from IndexedDB:', event.target.error)
        reject(event.target.error)
      }
    })
  } catch (error) {
    console.error('IndexedDB get documents error:', error)
    return []
  }
}

// Get document by ID from IndexedDB
async function getDocumentFromIndexedDB(id) {
  try {
    const db = await initDocsDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(docStoreName, 'readonly')
      const store = transaction.objectStore(docStoreName)
      
      const request = store.get(id)
      
      request.onsuccess = () => {
        resolve(request.result)
      }
      
      request.onerror = (event) => {
        console.error('Error getting document from IndexedDB:', event.target.error)
        reject(event.target.error)
      }
    })
  } catch (error) {
    console.error('IndexedDB get document error:', error)
    return null
  }
}

// Delete document from IndexedDB
async function deleteDocumentFromIndexedDB(id) {
  try {
    const db = await initDocsDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(docStoreName, 'readwrite')
      const store = transaction.objectStore(docStoreName)
      
      const request = store.delete(id)
      
      request.onsuccess = () => {
        resolve(true)
      }
      
      request.onerror = (event) => {
        console.error('Error deleting document from IndexedDB:', event.target.error)
        reject(event.target.error)
      }
    })
  } catch (error) {
    console.error('IndexedDB delete document error:', error)
    throw error
  }
}

// Parse DOCX file content
async function parseDocxContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async function(event) {
      try {
        const arrayBuffer = event.target.result
        
        // Extract content from DOCX using mammoth.js
        const result = await mammoth.extractRawText({ arrayBuffer })
        
        resolve(result.value)
      } catch (err) {
        console.error('Error parsing DOCX content:', err)
        reject(err)
      }
    }
    
    reader.onerror = function(event) {
      console.error('File reading error:', event.target.error)
      reject(event.target.error)
    }
    
    reader.readAsArrayBuffer(file)
  })
}

export const useKnowledgeStore = defineStore('knowledge', {
  state: () => ({
    knowledgeFragments: [],
    isLoading: false,
    // Admin document management
    adminDocuments: [],
    userValidatedSolutions: [], // 用户验证的解决方案
    vectorizationProgress: {
      inProgress: false,
      total: 0,
      processed: 0,
      success: 0,
      failed: 0
    },
    statistics: {
      totalDocuments: 0,
      categoryCounts: {
        'VPN': 0,
        'Routing': 0,
        'IP Addressing': 0,
        'Security': 0
      },
      topSearches: [
        { term: 'OSPF neighbor issues', count: 127 },
        { term: 'IP address conflict', count: 98 },
        { term: 'BGP not establishing', count: 76 },
        { term: 'VPN tunnel down', count: 65 },
        { term: 'MTU problems', count: 42 }
      ]
    }
  }),
  
  actions: {
    async searchKnowledge(query) {
      this.isLoading = true
      try {
        // Search in local documents from IndexedDB
        const allDocuments = await getAllDocumentsFromIndexedDB()
        
        if (allDocuments.length === 0) {
          this.knowledgeFragments = []
          return
        }
        
        // Simple search implementation (can be improved with proper search algorithms)
        const queryLower = query.toLowerCase()
        const matchingDocuments = allDocuments.filter(doc => {
          const titleMatch = doc.title.toLowerCase().includes(queryLower)
          const contentMatch = doc.content && doc.content.toLowerCase().includes(queryLower)
          const categoryMatch = doc.category.toLowerCase().includes(queryLower)
          
          return titleMatch || contentMatch || categoryMatch
        })
        
        // Transform documents to knowledge fragments format
        this.knowledgeFragments = matchingDocuments.map(doc => {
          // Extract a relevant snippet from the content if it matches the query
          let snippet = ''
          if (doc.content) {
            const contentLower = doc.content.toLowerCase()
            const queryIndex = contentLower.indexOf(queryLower)
            
            if (queryIndex >= 0) {
              // Get a snippet around the match
              const startPos = Math.max(0, queryIndex - 100)
              const endPos = Math.min(doc.content.length, queryIndex + queryLower.length + 100)
              snippet = doc.content.substring(startPos, endPos)
              
              // Add ellipsis if needed
              if (startPos > 0) snippet = '...' + snippet
              if (endPos < doc.content.length) snippet = snippet + '...'
            } else {
              // If no direct match in content, just take the beginning
              snippet = doc.content.substring(0, 200) + '...'
            }
          }
          
          return {
            id: doc.id,
            title: doc.title,
            content: snippet || doc.description,
            source: `${getDocumentTypeLabel(doc.type)} - ${doc.title}`,
            relevance: 0.95, // Simple relevance score
            tags: [doc.category, doc.type]
          }
        })
      } catch (error) {
        console.error('Error searching knowledge base:', error)
        this.knowledgeFragments = []
      } finally {
        this.isLoading = false
      }
    },
    
    async addFeedback(fragmentId, isHelpful, comment = '') {
      // In a real implementation, you might want to store feedback
      console.log(`Feedback added for fragment ${fragmentId}: ${isHelpful ? 'Helpful' : 'Not helpful'} - ${comment}`)
    },
    
    async getStatistics() {
      try {
        const allDocuments = await getAllDocumentsFromIndexedDB()
        
        this.statistics.totalDocuments = allDocuments.length
        
        // Reset counts
        this.statistics.categoryCounts = {
          'VPN': 0,
          'Routing': 0,
          'IP Addressing': 0,
          'Security': 0
        }
        
        // Count documents by category
        allDocuments.forEach(doc => {
          if (doc.category === '路由协议') {
            this.statistics.categoryCounts['Routing']++
          } else if (doc.category === 'VPN技术') {
            this.statistics.categoryCounts['VPN']++
          } else if (doc.category === 'IP寻址') {
            this.statistics.categoryCounts['IP Addressing']++
          } else if (doc.category === '安全协议') {
            this.statistics.categoryCounts['Security']++
          }
        })
      } catch (error) {
        console.error('Error fetching statistics:', error)
      }
    },

    // Admin document management functions
    async getAdminDocuments() {
      try {
        const allDocuments = await getAllDocumentsFromIndexedDB()
        
        // 转换和处理数据
        this.adminDocuments = allDocuments.map(doc => {
          // 确保文档有大小信息
          if (!doc.size && doc.content) {
            // 估算内容大小
            const contentSizeBytes = new Blob([doc.content]).size;
            doc.size = formatFileSize(contentSizeBytes);
            doc.sizeBytes = contentSizeBytes;
            
            // 更新数据库中的文档
            try {
              initDocsDB().then(db => {
                const transaction = db.transaction(docStoreName, 'readwrite');
                const store = transaction.objectStore(docStoreName);
                store.put(doc);
              });
            } catch (e) {
              console.error('更新文档大小信息失败:', e);
            }
          }
          
          return doc
        })
        
        // 更新统计信息
        this.statistics.totalDocuments = this.adminDocuments.length
        
        // 重置计数
        this.statistics.categoryCounts = {
          'VPN': 0,
          'Routing': 0,
          'IP Addressing': 0,
          'Security': 0
        }
        
        // 按类别统计文档
        this.adminDocuments.forEach(doc => {
          if (doc.category === '路由协议') {
            this.statistics.categoryCounts['Routing']++
          } else if (doc.category === 'VPN技术') {
            this.statistics.categoryCounts['VPN']++
          } else if (doc.category === 'IP寻址') {
            this.statistics.categoryCounts['IP Addressing']++
          } else if (doc.category === '安全协议') {
            this.statistics.categoryCounts['Security']++
          }
        })
        
        return this.adminDocuments
      } catch (error) {
        console.error('获取管理员文档失败:', error)
        this.adminDocuments = []
        return []
      }
    },
    
    /**
     * 将文档内容向量化并存储
     * @param {Object|Array} documents - 要向量化的单个文档或文档数组
     * @returns {Promise<Object>} - 处理结果
     */
    async vectorizeDocuments(documents) {
      this.vectorizationProgress.inProgress = true
      this.vectorizationProgress.total = Array.isArray(documents) ? documents.length : 1
      this.vectorizationProgress.processed = 0
      this.vectorizationProgress.success = 0
      this.vectorizationProgress.failed = 0
      
      try {
        // 转换为数组处理
        const docsArray = Array.isArray(documents) ? documents : [documents]
        
        // 逐个处理文档
        for (const doc of docsArray) {
          try {
            // 获取完整文档内容（如果传入的只有元数据）
            let fullDoc = doc
            if (!doc.content) {
              fullDoc = await getDocumentFromIndexedDB(doc.id)
            }
            
            if (!fullDoc || !fullDoc.content) {
              console.error('文档内容缺失:', doc.id)
              this.vectorizationProgress.failed++
              continue
            }
            
            // 向量化文档
            console.log(`开始向量化文档: ${fullDoc.title}`);
            const vectorCount = await storeDocumentVectors(fullDoc, AI_API_KEY);
            console.log(`文档向量化完成: ${fullDoc.title}, 创建了 ${vectorCount} 个向量块`);
            
            // 更新文档的向量化状态
            const updatedDoc = { 
              ...fullDoc, 
              vectorized: true, 
              vectorizedAt: new Date() 
            }
            
            // 更新IndexedDB中的文档
            await new Promise((resolve, reject) => {
              initDocsDB().then(db => {
                const transaction = db.transaction(docStoreName, 'readwrite')
                const store = transaction.objectStore(docStoreName)
                
                const request = store.put(updatedDoc)
                
                request.onsuccess = () => resolve()
                request.onerror = (event) => reject(event.target.error)
              }).catch(err => reject(err))
            })
            
            this.vectorizationProgress.success++
          } catch (error) {
            console.error('向量化文档失败:', error, doc.id)
            this.vectorizationProgress.failed++
          } finally {
            this.vectorizationProgress.processed++
          }
        }
        
        return {
          total: this.vectorizationProgress.total,
          success: this.vectorizationProgress.success,
          failed: this.vectorizationProgress.failed
        }
      } catch (error) {
        console.error('批量向量化文档失败:', error)
        throw error
      } finally {
        this.vectorizationProgress.inProgress = false
      }
    },
    
    /**
     * 向量化所有知识库文档
     * @returns {Promise<Object>} - 处理结果
     */
    async vectorizeAllDocuments() {
      try {
        // 获取所有未向量化的文档
        const allDocuments = await getAllDocumentsFromIndexedDB()
        const nonVectorized = allDocuments.filter(doc => !doc.vectorized)
        
        if (nonVectorized.length === 0) {
          return { total: 0, success: 0, message: '所有文档已向量化' }
        }
        
        // 分批处理，每批10个文档
        const batchSize = 10
        const batches = Math.ceil(nonVectorized.length / batchSize)
        
        this.vectorizationProgress.inProgress = true
        this.vectorizationProgress.total = nonVectorized.length
        this.vectorizationProgress.processed = 0
        this.vectorizationProgress.success = 0
        this.vectorizationProgress.failed = 0
        
        for (let i = 0; i < batches; i++) {
          const start = i * batchSize
          const end = Math.min(start + batchSize, nonVectorized.length)
          const batch = nonVectorized.slice(start, end)
          
          await this.vectorizeDocuments(batch)
        }
        
        return {
          total: this.vectorizationProgress.total,
          success: this.vectorizationProgress.success,
          failed: this.vectorizationProgress.failed
        }
      } catch (error) {
        console.error('向量化所有文档失败:', error)
        throw error
      } finally {
        this.vectorizationProgress.inProgress = false
      }
    },
    
    /**
     * 批量上传多个文档文件并向量化
     * @param {Object} data - 文档数据，包含多个文件
     * @returns {Promise<Object>} - 处理结果
     */
    async uploadDocuments(data) {
      try {
        this.isLoading = true;
        
        if (!data.files || !Array.isArray(data.files) || data.files.length === 0) {
          throw new Error('未提供有效的文件');
        }
        
        // 验证所有文件大小
        const maxSize = 100 * 1024 * 1024; // 100MB
        const oversizedFiles = data.files.filter(file => file.size > maxSize);
        if (oversizedFiles.length > 0) {
          throw new Error(`以下文件超过大小限制(100MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
        }
        
        // 上传进度跟踪
        const uploadProgress = {
          total: data.files.length,
          processed: 0,
          success: 0,
          failed: 0,
          details: []
        };
        
        // 处理每个文件
        const savedDocs = [];
        
        for (const file of data.files) {
          try {
            // 提取文档内容
            let content = '';
            const fileSizeBytes = file.size;
            const fileSize = formatFileSize(fileSizeBytes);
            
            // 根据文件类型处理文档
            if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              content = await parseDocxContent(file);
            } else if (file.type === 'text/plain' || file.type === 'application/pdf') {
              content = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e.target.error);
                reader.readAsText(file);
              });
            }
            
            if (!content) {
              throw new Error(`无法提取文件 ${file.name} 的内容`);
            }
            
            // 生成文档标题（如果未提供）
            let title;
            let fileName = file.name;
            
            if (data.title) {
              // 如果提供了标题，将其作为原始文件名的前缀
              title = `${data.title} - ${file.name}`;
            } else {
              // 如果没有提供标题，使用原始文件名
              title = file.name;
            }
            
            // 创建文档对象
            const document = {
              title: title,
              type: data.type || 'manual',
              category: data.category || 'General',
              tags: data.tags || [],
              content: content,
              summary: data.description || '',
              fileName: fileName,
              author: data.author || 'System',
              uploadDate: new Date().toLocaleDateString('zh-CN'),
              lastModified: new Date().toLocaleDateString('zh-CN'),
              vectorized: false,
              size: fileSize,
              sizeBytes: fileSizeBytes
            };
            
            // 保存到IndexedDB
            const savedDoc = await saveDocumentToIndexedDB(document);
            savedDocs.push(savedDoc);
            
            // 尝试向量化文档
            try {
              await this.vectorizeDocuments(savedDoc);
            } catch (e) {
              console.error(`文档 ${file.name} 向量化失败（已保存文档）:`, e);
            }
            
            uploadProgress.success++;
            uploadProgress.details.push({
              fileName: file.name,
              status: 'success',
              docId: savedDoc.id
            });
            
          } catch (error) {
            console.error(`处理文件 ${file.name} 失败:`, error);
            uploadProgress.failed++;
            uploadProgress.details.push({
              fileName: file.name,
              status: 'failed',
              error: error.message
            });
          } finally {
            uploadProgress.processed++;
          }
        }
        
        // 更新管理员文档列表
        await this.getAdminDocuments();
        
        // 返回所有成功保存的文档及状态摘要
        return {
          savedDocuments: savedDocs,
          progress: uploadProgress
        };
        
      } catch (error) {
        console.error('批量上传文档失败:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    // 修改uploadDocument方法，添加向量化步骤
    async uploadDocument(documentData) {
      try {
        this.isLoading = true
        
        // 验证文件大小
        if (documentData.file) {
          const maxSize = 100 * 1024 * 1024; // 100MB in bytes
          if (documentData.file.size > maxSize) {
            throw new Error('文件大小超过限制，最大允许 100MB');
          }
        }
        
        // 提取文档内容
        let content = ''
        
        // 计算文件大小并格式化
        let fileSize = '未知'
        if (documentData.file) {
          const fileSizeBytes = documentData.file.size
          fileSize = formatFileSize(fileSizeBytes)
          
          if (documentData.file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // DOCX文件处理
            content = await parseDocxContent(documentData.file)
          } else if (documentData.file.type === 'text/plain' || documentData.file.type === 'application/pdf') {
            // 简单文本文件处理
            content = await new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = (e) => resolve(e.target.result)
              reader.onerror = (e) => reject(e.target.error)
              reader.readAsText(documentData.file)
            })
          }
        } else if (documentData.content) {
          content = documentData.content
          // 估算文本内容的大小
          fileSize = formatFileSize(new Blob([content]).size)
        }
        
        if (!content) {
          throw new Error('无法提取文档内容')
        }
        
        // 生成文档标题（如果未提供）
        let title;
        let fileName = documentData.file ? documentData.file.name : '未命名文档';
        
        if (documentData.title) {
          // 如果提供了标题，将其作为原始文件名的前缀
          title = `${documentData.title} - ${fileName}`;
        } else {
          // 如果没有提供标题，使用原始文件名
          title = fileName;
        }
        
        // 创建文档对象
        const document = {
          title: title,
          type: documentData.type || 'manual',
          category: documentData.category || 'General',
          tags: documentData.tags || [],
          content: content,
          summary: documentData.summary || '',
          fileName: fileName,
          author: documentData.author || 'System',
          uploadDate: new Date().toLocaleDateString('zh-CN'),
          lastModified: new Date().toLocaleDateString('zh-CN'),
          vectorized: false,
          size: fileSize,
          sizeBytes: documentData.file ? documentData.file.size : new Blob([content]).size
        }
        
        // 保存到IndexedDB
        const savedDoc = await saveDocumentToIndexedDB(document)
        
        // 向量化文档
        try {
          await this.vectorizeDocuments(savedDoc)
        } catch (e) {
          console.error('文档向量化失败（文档已保存）:', e)
        }
        
        // 更新管理员文档列表
        await this.getAdminDocuments()
        
        return savedDoc
      } catch (error) {
        console.error('上传文档失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 修改deleteDocument方法，删除向量数据
    async deleteDocument(documentId) {
      try {
        this.isLoading = true
        
        // 先删除向量数据
        await deleteDocumentVectors(documentId)
        
        // 然后删除文档
        await deleteDocumentFromIndexedDB(documentId)
        
        // 更新文档列表
        await this.getAdminDocuments()
        
        return true
      } catch (error) {
        console.error('删除文档失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    async getDocumentContent(documentId) {
      try {
        const document = await getDocumentFromIndexedDB(documentId)
        return document
      } catch (error) {
        console.error('Error fetching document content:', error)
        throw error
      }
    },
    
    /**
     * 清除搜索结果
     */
    clearSearchResults() {
      this.knowledgeFragments = [];
      this.isLoading = false;
      console.log('搜索结果已清除');
    },
    
    /**
     * 获取用户验证的解决方案
     */
    async getUserValidatedSolutions() {
      try {
        this.isLoading = true
        
        // 从管理员文档中过滤出用户验证的解决方案
        const documents = await getAllDocumentsFromIndexedDB()
        
        // 过滤出类型为 validated-solution 的文档
        this.userValidatedSolutions = documents.filter(doc => 
          doc.type === 'validated-solution' || 
          (doc.metadata && doc.metadata.fromUserFeedback === true)
        )
        
        console.log(`找到 ${this.userValidatedSolutions.length} 个用户验证的解决方案`)
        
        return this.userValidatedSolutions
      } catch (error) {
        console.error('获取用户验证的解决方案失败:', error)
        return []
      } finally {
        this.isLoading = false
      }
    },
    
    /**
     * 初始化 - 加载所有必要的数据
     */
    async initialize() {
      try {
        // 获取管理员文档
        await this.getAdminDocuments()
        
        // 获取用户验证的解决方案
        await this.getUserValidatedSolutions()
        
        // 获取统计数据
        await this.getStatistics()
      } catch (error) {
        console.error('初始化知识库数据失败:', error)
      }
    }
  }
})

// Helper function to get document type label
function getDocumentTypeLabel(type) {
  const labels = {
    theory: '基础理论',
    method: '学习方法',
    diagnosis: '认知诊断',
    case: '案例分析'
  }
  return labels[type] || type
}

// 添加文件大小格式化函数
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 
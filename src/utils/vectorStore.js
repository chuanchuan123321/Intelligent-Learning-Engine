/**
 * 向量存储工具
 * 实现基于文档内容的向量化存储和检索功能
 */

// IndexedDB 向量存储配置
const DB_NAME = 'ip-expert-vector-db';
const STORE_NAME = 'vector-embeddings';
const DB_VERSION = 2;

// OpenAI API 配置
const EMBEDDING_MODEL = 'text-embedding-3-small'; 
const EMBEDDING_API_URL = 'https://xiaoai.plus/v1/embeddings'; // 假设使用与AI服务相同的代理

/**
 * 初始化向量数据库
 * @returns {Promise<IDBDatabase>}
 */
function initVectorDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('初始化向量数据库失败:', event.target.error);
      reject(event.target.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('documentId', 'documentId', { unique: false });
        store.createIndex('title', 'title', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
}

/**
 * 创建文本的嵌入向量
 * @param {string} text - 要向量化的文本
 * @param {string} apiKey - API密钥
 * @returns {Promise<number[]>} - 嵌入向量
 */
async function createEmbedding(text, apiKey) {
  try {
    const response = await fetch(EMBEDDING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text
      })
    });
    
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('创建嵌入向量失败:', error);
    throw error;
  }
}

/**
 * 计算两个向量之间的余弦相似度
 * @param {number[]} vecA - 向量A
 * @param {number[]} vecB - 向量B
 * @returns {number} - 相似度(0-1之间的值)
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 将文档分块并存储向量
 * @param {Object} document - 文档对象
 * @param {string} document.id - 文档ID
 * @param {string} document.title - 文档标题
 * @param {string} document.content - 文档内容
 * @param {string} document.type - 文档类型
 * @param {string} apiKey - API密钥
 * @returns {Promise<number>} - 成功存储的向量块数量
 */
export async function storeDocumentVectors(document, apiKey) {
  if (!document.content || document.content.trim() === '') {
    console.error('文档内容为空');
    return 0;
  }
  
  try {
    // 估算文档tokens数量（英文约1.3个字符/token，中文约1个字符/token）
    const contentLength = document.content.length;
    const estimatedTokens = Math.ceil(contentLength * 0.8); // 粗略估算
    
    console.log(`文档 "${document.title}" 内容长度: ${contentLength} 字符，估计 ${estimatedTokens} tokens`);
    
    // 检查文档是否过大 (超过1M估计需要特殊处理)
    const isLargeDocument = contentLength > 1000000; // 超过100万字符约1MB
    
    // 使用3000字符的固定块大小
    const chunkSize = 3000;  // 固定为3000字符
    const overlap = 200;  // 重叠200字符，保留上下文连贯性
    
    // 按字符分块而不是按词分块
    const chunks = [];
    let startPos = 0;
    
    while (startPos < document.content.length) {
      // 计算结束位置（考虑重叠）
      let endPos = startPos + chunkSize;
      
      // 如果不是第一块，需要减去重叠部分
      if (startPos > 0) {
        startPos -= overlap;
      }
      
      // 提取当前块
      const chunk = document.content.substring(startPos, endPos);
      
      if (chunk.trim() !== '') {
        chunks.push(chunk);
      }
      
      // 移动到下一个起始位置
      startPos = endPos;
      
      // 大文件保护：如果块太多，添加限制
      if (chunks.length >= 500) {
        console.warn(`文档 "${document.title}" 分块过多（${chunks.length}），截断处理。`);
        break;
      }
    }
    
    console.log(`文档 "${document.title}" 已分割为 ${chunks.length} 个文本块`);
    
    const db = await initVectorDB();
    let storedCount = 0;
    
    // 为每个块创建向量并存储
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        
        // 不再进行额外的截断，因为我们已经控制了块大小为3000字符
        const trimmedChunk = chunk;
          
        // 创建向量（使用错误重试逻辑）
        let embedding;
        try {
          embedding = await createEmbedding(trimmedChunk, apiKey);
        } catch (embeddingError) {
          console.error(`块 ${i+1}/${chunks.length} 向量化失败，尝试截断内容后重试:`, embeddingError);
          // 重试：使用更短的内容
          const shorterChunk = trimmedChunk.substring(0, 2000);
          try {
            embedding = await createEmbedding(shorterChunk, apiKey);
          } catch (retryError) {
            // 再次尝试更短的内容
            console.error(`块 ${i+1}/${chunks.length} 第二次尝试失败，使用最短内容重试:`, retryError);
            const shortestChunk = trimmedChunk.substring(0, 1000);
            embedding = await createEmbedding(shortestChunk, apiKey);
          }
        }
        
        // 构建要存储的向量对象
        const vectorObject = {
          documentId: document.id,
          title: document.title,
          type: document.type,
          chunkIndex: i,
          totalChunks: chunks.length,
          content: trimmedChunk,
          vector: embedding,
          createdAt: new Date()
        };
        
        // 存储向量
        await new Promise((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          const request = store.add(vectorObject);
          
          request.onsuccess = () => {
            storedCount++;
            resolve();
          };
          
          request.onerror = (event) => {
            console.error('存储向量失败:', event.target.error);
            reject(event.target.error);
          };
        });
        
        // 大文档处理：每5个块暂停一下，避免API限流
        if (isLargeDocument && i % 5 === 4) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (chunkError) {
        console.error(`处理文档 "${document.title}" 的第 ${i+1}/${chunks.length} 块时出错:`, chunkError);
        // 继续处理下一个块，而不是完全失败
        continue;
      }
    }
    
    console.log(`文档 "${document.title}" 向量化完成, 成功存储 ${storedCount}/${chunks.length} 个向量块,分块大小3000字符`);
    return storedCount;
  } catch (error) {
    console.error(`存储文档 "${document.title}" 的向量失败:`, error);
    throw error;
  }
}

/**
 * 删除文档的所有向量
 * @param {string|number} documentId - 文档ID
 * @returns {Promise<boolean>} - 是否成功删除
 */
export async function deleteDocumentVectors(documentId) {
  try {
    const db = await initVectorDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('documentId');
      
      const request = index.openCursor(IDBKeyRange.only(documentId));
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve(true);
        }
      };
      
      request.onerror = (event) => {
        console.error('删除文档向量失败:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('删除文档向量失败:', error);
    return false;
  }
}

/**
 * 搜索相关文档
 * @param {string} query - 搜索查询
 * @param {string} apiKey - API密钥
 * @param {number} limit - 返回结果数量限制
 * @param {number} threshold - 相关性阈值，仅用于标记，不再过滤结果
 * @returns {Promise<Array>} - 相关文档列表
 */
export async function searchSimilarDocuments(query, apiKey, limit = 5, threshold = 0.2) {
  try {
    // 创建查询的向量表示
    const queryVector = await createEmbedding(query, apiKey);
    
    // 获取所有文档向量
    const db = await initVectorDB();
    const vectors = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('获取向量失败:', event.target.error);
        reject(event.target.error);
      };
    });
    
    // 没有向量数据，返回空结果
    if (!vectors || vectors.length === 0) {
      console.log('向量数据库为空，没有可搜索的文档');
      return [];
    }
    
    console.log(`向量搜索过程: 数据库中共有 ${vectors.length} 个文档向量块`);
    
    // 计算相似度并排序
    const withSimilarity = vectors.map(item => ({
      ...item,
      similarity: cosineSimilarity(queryVector, item.vector),
      // 添加百分比相关度，便于显示
      relevance: Math.max(0, Math.min(1, cosineSimilarity(queryVector, item.vector)))
    }));
    
    withSimilarity.sort((a, b) => b.relevance - a.relevance);
    
    console.log(`向量相似度计算完成，相关度前5的文档块:`);
    withSimilarity.slice(0, 5).forEach((item, index) => {
      console.log(`[${index+1}] ${item.title} (块 ${item.chunkIndex+1}/${item.totalChunks}): ${(item.relevance * 100).toFixed(2)}%`);
    });
    
    // 不再过滤结果，始终返回排序后的前N个结果
    const results = withSimilarity.slice(0, limit).map(item => ({
      id: item.id,
      documentId: item.documentId,
      title: item.title,
      type: item.type,
      content: item.content,
      chunkIndex: item.chunkIndex,
      totalChunks: item.totalChunks,
      relevance: item.relevance, // 相关度
      belowThreshold: item.relevance < threshold // 标记是否低于阈值，但仍然返回
    }));
    
    return results;
  } catch (error) {
    console.error('搜索相似文档失败:', error);
    return [];
  }
}

export default {
  storeDocumentVectors,
  deleteDocumentVectors,
  searchSimilarDocuments
}; 
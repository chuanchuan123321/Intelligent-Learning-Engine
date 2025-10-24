import axios from 'axios';
import { searchSimilarDocuments } from '../utils/vectorStore';
import { useKnowledgeStore } from '../stores/knowledgeStore';

// 配置参数
const AI_API_URL = 'https://xiaoai.plus/v1';
const AI_API_KEY = 'sk-ECDknwAwbrjRDOVegNuk5Zk2zOfXqFthxL36Z7miazL3QGO6';
const AI_MODEL = 'gpt-4o';
const MAX_REFERENCES = 3; // 最大参考文献数量

// 创建API客户端实例
const apiClient = axios.create({
  baseURL: AI_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AI_API_KEY}`
  },
  // 增加超时时间以处理图片
  timeout: 120000 // 120秒, 图像处理需要更多时间
});

/**
 * 处理图片文件，转换成base64格式
 * @param {File|Blob|string} imageFile - 图片文件对象、Blob或URL
 * @returns {Promise<string>} - base64编码的图片数据
 */
function processImageFile(imageFile) {
  return new Promise((resolve, reject) => {
    // 如果是字符串URL
    if (typeof imageFile === 'string') {
      // 如果是已经是base64数据，直接返回
      if (imageFile.startsWith('data:')) {
        resolve(imageFile);
        return;
      }
      
      // 如果是object URL，需要先获取blob
      fetch(imageFile)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = err => {
            console.error('读取URL图片失败:', err);
            reject(err);
          };
          reader.readAsDataURL(blob);
        })
        .catch(err => {
          console.error('获取URL图片失败:', err);
          reject(err);
        });
      return;
    }
    
    // 处理File或Blob对象
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      resolve(base64Data);
    };
    
    reader.onerror = (error) => {
      console.error('读取图片文件失败:', error);
      reject(error);
    };
    
    reader.readAsDataURL(imageFile);
  });
}

/**
 * 向AI发送问题并获取回答
 * @param {string} message - 用户消息
 * @param {Array} history - 对话历史
 * @param {Array} files - 用户上传的文件
 * @returns {Promise<Object>} - AI回答及其相关信息
 */
export async function sendMessageToAI(message, history = [], files = []) {
  try {
    // 获取知识库文档数量，用于计算检索数量
    let docCount = 12; // 默认值，防止初始化时读取不到
    
    try {
      const knowledgeStore = useKnowledgeStore();
      // 如果知识库文档数已加载，使用实际数量
      if (knowledgeStore && knowledgeStore.adminDocuments && knowledgeStore.adminDocuments.length > 0) {
        docCount = knowledgeStore.adminDocuments.length;
        console.log(`知识库文档数量: ${docCount}`);
      }
    } catch (err) {
      console.log('无法获取知识库数量，使用默认值(12):', err);
    }
    
    // 检索文档数量设为知识库文档数的两倍
    const searchLimit = Math.max(docCount * 2, 20); // 至少20个，确保有足够结果
    
    // 使用向量数据库搜索相关文档
    console.log(`向量检索开始，查询：${message}，检索数量：${searchLimit}`);
    const relevantDocuments = await searchSimilarDocuments(message, AI_API_KEY, searchLimit, 0.2);
    console.log(`向量检索完成，找到 ${relevantDocuments.length} 个相关文档`);
    if (relevantDocuments.length > 0) {
      console.log(`相关度最高的文档: ${relevantDocuments[0].title}, 相关度: ${relevantDocuments[0].relevance}`);
    }
    
    // 在控制台输出所有找到的文档块内容（便于调试）
    console.log("\n========== 向量检索找到的文档块（完整内容）==========");
    if (relevantDocuments.length > 0) {
      relevantDocuments.forEach((doc, i) => {
        console.log(`\n----- 文档 ${i+1} -----`);
        console.log(`ID: ${doc.documentId}-${doc.chunkIndex}`);
        console.log(`标题: ${doc.title}`);
        console.log(`类型: ${doc.type}`);
        console.log(`相关度: ${(doc.relevance * 100).toFixed(2)}%`);
        console.log(`片段索引: ${doc.chunkIndex + 1}/${doc.totalChunks}`);
        console.log(`\n内容:\n${doc.content}`);
        console.log("\n-----------------------------");
      });
    } else {
      console.log("未找到相关文档块");
    }
    console.log("========== 文档块输出结束 ==========\n");
    
    // 对同一文档的多个块进行合并与相关度增强处理
    const documentGroups = {};
    
    // 按文档ID和标题分组
    relevantDocuments.forEach(doc => {
      const docKey = `${doc.documentId}-${doc.title}`;
      
      if (!documentGroups[docKey]) {
        documentGroups[docKey] = {
          documentId: doc.documentId,
          title: doc.title,
          type: doc.type,
          blocks: [],
          // 初始化该文档相关度为0
          maxRelevance: 0,
          totalChunks: doc.totalChunks
        };
      }
      
      // 添加块并更新最大相关度
      documentGroups[docKey].blocks.push(doc);
      if (doc.relevance > documentGroups[docKey].maxRelevance) {
        documentGroups[docKey].maxRelevance = doc.relevance;
      }
    });
    
    // 将分组转换为合并后的文档列表
    const mergedDocuments = Object.values(documentGroups).map(group => {
      // 对于有多个块的文档，增强相关度
      const blockCount = group.blocks.length;
      let enhancedRelevance = group.maxRelevance;
      
      if (blockCount > 1) {
        // 有多个块被检索到，说明文档整体相关性更高，进行相关度增强
        enhancedRelevance = Math.min(1.0, group.maxRelevance * (1 + 0.1 * Math.min(blockCount, 3)));
        console.log(`文档 "${group.title}" 有 ${blockCount} 个块被检索，相关度从 ${(group.maxRelevance * 100).toFixed(1)}% 提升到 ${(enhancedRelevance * 100).toFixed(1)}%`);
      }
      
      // 按相关度排序所有块，选择最相关的块内容
      group.blocks.sort((a, b) => b.relevance - a.relevance);
      const bestBlock = group.blocks[0];
      
      return {
        documentId: group.documentId,
        title: group.title,
        type: group.type,
        content: bestBlock.content,
        chunkIndex: bestBlock.chunkIndex,
        totalChunks: group.totalChunks,
        relevance: enhancedRelevance,
        blockCount: blockCount, // 记录该文档有多少个块被检索到
        allBlocks: group.blocks, // 保存所有相关块
        belowThreshold: enhancedRelevance < 0.2 // 标记是否低于阈值
      };
    });
    
    // 按增强后的相关度排序文档
    mergedDocuments.sort((a, b) => b.relevance - a.relevance);
    
    // 输出合并后的文档信息
    console.log("\n========== 合并后的文档（每个文档只显示一次）==========");
    mergedDocuments.forEach((doc, i) => {
      console.log(`文档 ${i+1}: ${doc.title}`);
      console.log(`最终相关度: ${(doc.relevance * 100).toFixed(1)}%（${doc.blockCount}个块被检索）`);
    });
    console.log("========== 合并文档结束 ==========\n");
    
    // 过滤掉相关度小于20%的文档，并取最相关的前3个文档
    const filteredDocuments = mergedDocuments
      .filter(doc => doc.relevance >= 0.2) // 相关度至少20%
      .slice(0, MAX_REFERENCES); // 最多3个
    
    console.log(`过滤后剩余 ${filteredDocuments.length} 个相关文档 (相关度阈值: 20%)`);
    if (filteredDocuments.length > 0) {
      filteredDocuments.forEach((doc, i) => {
        console.log(`文档 ${i+1}: ${doc.title}, 相关度: ${(doc.relevance * 100).toFixed(1)}%`);
      });
    }
    
    // 输出最终用于AI回答的文档内容
    console.log("\n========== 最终用于AI回答的文档内容 ==========");
    if (filteredDocuments.length > 0) {
      filteredDocuments.forEach((doc, i) => {
        console.log(`\n----- 文档 ${i+1} -----`);
        console.log(`标题: ${doc.title}`);
        console.log(`相关度: ${(doc.relevance * 100).toFixed(2)}%`);
        console.log(`文档块索引: ${doc.chunkIndex+1}/${doc.totalChunks}`);
        console.log(`\n内容:\n${doc.content}`);
      });
    } else {
      console.log("没有达到相关度阈值(20%)的文档，AI将使用自身知识回答");
    }
    console.log("========== AI参考文档输出结束 ==========\n");
    
    // 构建提示词，包含相关文档内容作为上下文
    let systemPrompt = `你是一个专业的自适应学习路径规划助手，基于深度推理大模型与动态知识图谱双驱动框架，具备以下核心能力：

【核心功能】
1. 认知诊断：精准分析学习者的认知状态，诊断准确率≥65%
2. 路径规划：制定个性化学习路径，推荐匹配度≥65%
3. 多智能体协同：整合多个专业智能体的分析结果
4. 深度推理：在STEM学科中进行可靠的深度推理，避免"幻觉输出"

【主要任务】
- 评估用户的学习基础和认知状态
- 识别学习困难和知识薄弱环节
- 制定循序渐进的个性化学习路径
- 推荐适合的学习资源和方法
- 动态调整学习策略和节奏
- 监督学习进度并提供反馈

【响应原则】
1. 基于深度推理进行分析，确保逻辑严密
2. 提供具体可操作的学习建议
3. 考虑学习者的个体差异
4. 注重学习效率和效果平衡
5. 支持多模态学习资源整合

请始终以专业、耐心、个性化的方式为学习者提供最适合的学习路径规划和指导。`;
    
    // 如果找到相关内容，添加到系统提示中
    if (filteredDocuments && filteredDocuments.length > 0) {
      systemPrompt += '\n\n以下是与用户问题可能相关的知识库内容，请优先参考这些内容回答问题：\n\n';
      
      filteredDocuments.forEach((doc, index) => {
        systemPrompt += `文档 ${index + 1}: ${doc.title}\n${doc.content}\n\n`;
      });
      
      systemPrompt += '请基于以上知识库内容，结合你的知识，尽可能准确地回答用户问题。如果知识库内容不足以回答问题，可以使用你自己的知识补充。';
    }
    
    // 输出系统提示内容
    console.log("\n========== 系统提示词内容 ==========");
    console.log(systemPrompt);
    console.log("========== 系统提示词结束 ==========\n");
    
    // 构建发送到API的消息历史
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history
    ];
    
    // 处理图片附件，如果有的话
    let userContent = message;
    
    // 如果有图片文件，处理它们
    if (files && files.length > 0) {
      // 记录图片数量
      console.log(`处理附加文件: ${files.length}个文件`);
      
      let imageFiles = files.filter(file => 
        (file.type && file.type.startsWith('image/'))
      );
      
      if (imageFiles.length > 0) {
        console.log(`包含${imageFiles.length}个图片文件`);
        
        // 处理每个图片文件
        const imageContents = [];
        for (const imgFile of imageFiles) {
          try {
            // 获取图片数据
            let imageUrl;
            
            // 如果已经是base64格式，直接使用
            if (imgFile.isBase64 && imgFile.url) {
              imageUrl = imgFile.url;
              console.log('使用已准备的base64数据，长度:', imageUrl.length);
            }
            // 如果有URL但不是base64
            else if (imgFile.url) {
              // 处理URL
              console.log('处理URL:', typeof imgFile.url === 'string' ? imgFile.url.substring(0, 30) + '...' : 'non-string URL');
              imageUrl = await processImageFile(imgFile.url);
            }
            // 如果有原始文件
            else if (imgFile.raw) {
              // 处理原始文件
              console.log('处理原始文件生成base64');
              imageUrl = await processImageFile(imgFile.raw);
            }
            else {
              console.error(`图片 ${imgFile.name} 缺少有效数据源`);
              continue;
            }
            
            if (!imageUrl) {
              console.error(`无法获取 ${imgFile.name} 的图片数据`);
              continue;
            }
            
            console.log('图片数据格式:', 
              typeof imageUrl === 'string' 
                ? `字符串(${imageUrl.substring(0, 20)}...)` 
                : typeof imageUrl);
            
            console.log('图片文件信息:', { 
              name: imgFile.name, 
              type: imgFile.type,
              size: imgFile.size || (imgFile.raw ? imgFile.raw.size : 'unknown'),
              dataLength: typeof imageUrl === 'string' ? imageUrl.length : 'unknown'
            });
            
            // 添加图片到内容 - 使用OpenAI的格式
            imageContents.push({
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            });
            
            console.log(`成功处理图片: ${imgFile.name}`);
          } catch (err) {
            console.error(`处理图片 ${imgFile.name} 时出错:`, err);
          }
        }
        
        if (imageContents.length > 0) {
          // 添加消息和图片内容
          const multiModalMessage = {
            role: 'user',
            content: [
              { type: "text", text: userContent || "请分析这张图片" },
              ...imageContents
            ]
          };
          
          messages.push(multiModalMessage);
          
          // 调试输出最终发送的消息结构
          console.log('多模态消息结构:', {
            role: 'user',
            contentTypes: multiModalMessage.content.map(c => c.type),
            imageCount: imageContents.length,
            textContent: userContent || "请分析这张图片"
          });
        } else {
          // 没有成功处理任何图片，退回到纯文本消息
          messages.push({ role: 'user', content: userContent });
          console.log('无法处理图片，发送纯文本消息');
        }
      } else {
        // 没有图片，只添加文本
        messages.push({ role: 'user', content: userContent });
      }
    } else {
      // 没有文件，只添加文本
      messages.push({ role: 'user', content: userContent });
    }
    
    // 检查是否为多模态请求（包含图像）
    const isMultiModal = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(item => item.type === 'image_url')
    );
    
    console.log("是否为多模态请求:", isMultiModal);
    
    // 配置请求参数
    const requestData = {
      model: AI_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000
    };
    
    // 如果是多模态请求，添加额外参数
    if (isMultiModal) {
      console.log("发送多模态请求，使用模型:", AI_MODEL);
      
      // 记录消息内容，便于调试
      console.log("多模态消息内容:", JSON.stringify(messages.map(msg => {
        if (Array.isArray(msg.content)) {
          return {
            role: msg.role,
            contentTypes: msg.content.map(c => c.type),
            contentCount: msg.content.length
          };
        } else {
          return {
            role: msg.role,
            contentType: typeof msg.content
          };
        }
      })));
    }
    
    // 记录最后一条消息以验证格式
    const lastMessage = messages[messages.length - 1];
    console.log("最后一条消息格式:", lastMessage.role, 
              Array.isArray(lastMessage.content) 
                ? `[Array with ${lastMessage.content.length} items]` 
                : typeof lastMessage.content);
    
    console.log("发送API请求...");
    const response = await apiClient.post('/chat/completions', requestData);
    
    console.log("API响应状态:", response.status);
    console.log("API响应头:", response.headers);
    
    // 提取AI回答
    const aiResponse = response.data.choices[0].message.content;
    
    // 返回AI回答及相关文档作为源引用
    return {
      content: aiResponse,
      sources: filteredDocuments.length > 0 
        ? filteredDocuments.map(doc => ({
            title: doc.title,
            relevance: doc.relevance,
            belowThreshold: doc.belowThreshold,
            blockCount: doc.blockCount || 1 // 包含块数量信息
          }))
        : [], // 不再使用模拟数据，如果没有相关文档，则返回空数组
      raw: response.data,
      // 添加完整文档内容到响应中，用于参考卡片点击显示
      fullDocContents: filteredDocuments.reduce((acc, doc) => {
        // 整合最相关块的内容
        acc[doc.title] = doc.content;
        
        // 如果有多个块，在完整内容中添加额外信息
        if (doc.blockCount > 1) {
          acc[doc.title] += `\n\n---\n\n该文档有 ${doc.blockCount} 个相关片段被检索。这是相关度最高的片段内容。`;
        }
        
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('AI调用错误:', error);
    throw new Error('与AI服务通信时发生错误');
  }
}

/**
 * 生成模拟的知识库相关度信息
 * @param {string} query - 查询问题
 * @param {string} response - AI回答
 * @returns {Array} - 相关度信息
 */
function generateMockSources(query, response) {
  // 根据问题提取关键词来模拟不同的相关文档
  const keywords = {
    'ospf': { title: 'RFC 2328: OSPF Version 2', relevance: 0.95 },
    'bgp': { title: 'RFC 4271: BGP-4 Protocol', relevance: 0.93 },
    'mpls': { title: 'RFC 3031: MPLS Architecture', relevance: 0.92 },
    'vpn': { title: 'IPsec VPN配置指南', relevance: 0.90 },
    'ip': { title: 'IP寻址与子网划分', relevance: 0.88 },
    'switch': { title: '交换机配置手册', relevance: 0.87 },
    'route': { title: '路由协议最佳实践', relevance: 0.89 },
    'security': { title: '网络安全防护指南', relevance: 0.86 },
    'troubleshoot': { title: '网络故障排查手册', relevance: 0.92 }
  };
  
  // 提取关键词
  let sources = [];
  Object.keys(keywords).forEach(key => {
    if (query.toLowerCase().includes(key) || response.toLowerCase().includes(key)) {
      sources.push({
        title: keywords[key].title,
        relevance: keywords[key].relevance,
        belowThreshold: false
      });
    }
  });
  
  // 如果没有匹配的关键词，添加一个低相关度的文档
  if (sources.length === 0) {
    sources.push({
      title: '网络技术基础手册',
      relevance: 0.42,
      belowThreshold: false
    });
  }
  
  // 最多返回3个
  return sources.slice(0, 3);
}

/**
 * 根据文档内容生成思维导图
 * @param {Object} document - 文档对象，包含title和content
 * @returns {Promise<Object>} - 返回包含Mermaid格式的思维导图
 */
export async function generateMindMapFromDocument(document) {
  try {
    const prompt = `
请基于以下文档内容，生成一个清晰的思维导图。请严格按照Mermaid格式输出，并遵循以下要求：

1. 使用mindmap类型的图表
2. 从主题开始，最多展开3-4层级
3. 每个节点使用简洁的中文描述
4. 确保逻辑结构清晰，重点突出
5. 只输出Mermaid代码，不要包含其他文字说明

文档标题：${document.title}
文档内容：${document.content || document.description || '无详细内容'}

请生成Mermaid mindmap格式的思维导图代码：
`;

    const response = await apiClient.post('/chat/completions', {
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: "你是一个专业的知识图谱和思维导图专家，擅长将复杂信息转化为清晰的可视化结构。请严格按照Mermaid mindmap语法生成思维导图。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiResponse = response.data.choices[0].message.content;
    
    // 提取Mermaid代码
    let mermaidCode = aiResponse.trim();
    
    // 如果返回的内容包含代码块，提取其中的代码
    const codeBlockMatch = mermaidCode.match(/```(?:mermaid)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      mermaidCode = codeBlockMatch[1].trim();
    }
    
    // 确保是mindmap格式
    if (!mermaidCode.startsWith('mindmap')) {
      mermaidCode = `mindmap\n  root((${document.title}))\n${mermaidCode}`;
    }

    console.log('生成的思维导图代码:', mermaidCode);

    return {
      success: true,
      mermaidCode: mermaidCode,
      title: document.title
    };

  } catch (error) {
    console.error('生成思维导图失败:', error);
    
    // 返回一个默认的思维导图
    const defaultMindMap = `mindmap
  root((${document.title}))
    内容概览
      主要信息
      关键要点
    核心结构
      组织框架
      逻辑关系
    应用价值
      实际用途
      参考意义`;

    return {
      success: false,
      mermaidCode: defaultMindMap,
      title: document.title,
      error: error.message
    };
  }
}

// 默认导出
export default {
  sendMessageToAI
} 
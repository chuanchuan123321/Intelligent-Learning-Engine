/**
 * 问题分类服务 - 用于对用户问题进行智能分类
 */
import axios from 'axios';
import * as dbStorage from '../utils/dbStorage';

// 配置参数
const AI_API_URL = 'https://xiaoai.plus/v1';
const AI_API_KEY = 'sk-ECDknwAwbrjRDOVegNuk5Zk2zOfXqFthxL36Z7miazL3QGO6';
const AI_MINI_MODEL = 'gpt-4o-mini'; // 使用小模型进行分类

// IndexedDB存储键
const QUESTION_CATEGORIES_KEY = 'questionCategories';
const QUESTION_CATEGORY_MAPPING_KEY = 'questionCategoryMapping';

/**
 * 创建API客户端实例
 */
const miniApiClient = axios.create({
  baseURL: AI_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AI_API_KEY}`
  },
  timeout: 30000 // 30秒
});

/**
 * 加载所有问题类别
 * @returns {Promise<Array>} 问题类别列表
 */
export async function getQuestionCategories() {
  try {
    const categories = await dbStorage.getItem(QUESTION_CATEGORIES_KEY);
    return categories ? JSON.parse(categories) : [];
  } catch (error) {
    console.error('加载问题类别失败:', error);
    return [];
  }
}

/**
 * 加载问题-类别映射
 * @returns {Promise<Object>} 问题-类别映射对象
 */
export async function getQuestionCategoryMapping() {
  try {
    const mapping = await dbStorage.getItem(QUESTION_CATEGORY_MAPPING_KEY);
    return mapping ? JSON.parse(mapping) : {};
  } catch (error) {
    console.error('加载问题-类别映射失败:', error);
    return {};
  }
}

/**
 * 保存问题类别
 * @param {Array} categories - 问题类别列表
 */
async function saveQuestionCategories(categories) {
  try {
    await dbStorage.setItem(QUESTION_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('保存问题类别失败:', error);
  }
}

/**
 * 保存问题-类别映射
 * @param {Object} mapping - 问题-类别映射对象
 */
async function saveQuestionCategoryMapping(mapping) {
  try {
    await dbStorage.setItem(QUESTION_CATEGORY_MAPPING_KEY, JSON.stringify(mapping));
  } catch (error) {
    console.error('保存问题-类别映射失败:', error);
  }
}

/**
 * 对用户问题进行分类，并更新类别结构
 * @param {string} question - 用户问题
 * @returns {Promise<Object>} 包含类别信息的对象
 */
export async function categorizeQuestion(question) {
  try {
    // 规范化问题文本 - 简化为标准形式
    const normalizedQuestion = question
      .replace(/[.,?!;:""'']/g, '')
      .toLowerCase()
      .trim();
    
    // 如果问题长度过短，忽略
    if (normalizedQuestion.length < 5) {
      return { success: false, reason: '问题太短，无法分类' };
    }
    
    // 获取现有类别和映射
    const categories = await getQuestionCategories();
    const categoryMapping = await getQuestionCategoryMapping();
    
    // 检查问题是否已有映射
    if (categoryMapping[normalizedQuestion]) {
      const categoryId = categoryMapping[normalizedQuestion];
      const category = categories.find(cat => cat.id === categoryId);
      
      if (category) {
        // 更新此类别的计数
        category.count = (category.count || 0) + 1;
        await saveQuestionCategories(categories);
        
        return {
          success: true,
          newCategory: false,
          categoryId: category.id,
          categoryName: category.name,
          count: category.count
        };
      }
    }
    
    // 问题未分类或类别不存在，使用小模型进行分类
    console.log('开始对问题进行AI分类...');
    console.log('问题文本:', question);
    console.log('现有类别数量:', categories.length);
    
    // 构建系统提示词，指导小模型进行问题分类
    const systemPrompt = `你是一个学习需求分类助手，负责识别相似的学习需求并将它们分到同一类别中。

任务：分析用户的学习需求，判断它的主题类别，无论具体表述如何变化，相似的学习需求应该归类到同一类别中。

现有学习需求类别：
${categories.map(cat => `- ID: ${cat.id}, 名称: ${cat.name}, 描述: ${cat.description || '(无描述)'}, 问题数: ${cat.count || 0}`).join('\n')}

判断流程：
1. 分析学习需求的核心主题和学科领域（例如：数学基础、编程思维、科学推理等）
2. 忽略需求中的具体细节和表述差异，专注于识别学习需求的基本主题
3. 如果学习需求主题与现有类别本质相同，即使表述不同也应使用现有类别
4. 只有当学习需求主题真正不同时，才创建新类别

例如，以下几个需求虽然表述不同，但都应该归类到同一个"数学基础诊断"类别：
- "评估我的数学基础，制定微积分学习路径"
- "诊断我在高等数学方面的认知状态"
- "分析我的数学学习困难，优化学习策略"

给出响应时：
- 如果匹配现有类别，返回类别ID和名称
- 如果创建新类别，类别名称应简洁明了，着重突出学习主题（如"数学基础"，"编程思维"）
- 提供详细推理过程，解释为什么归入特定类别`;

    // 构建发送给API的请求体
    const requestData = {
      model: AI_MINI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请对以下问题进行分类：${question}` }
      ],
      functions: [
        {
          name: 'classifyQuestion',
          description: '将用户问题分类到现有类别或创建新类别',
          parameters: {
            type: 'object',
            properties: {
              matchesExistingCategory: {
                type: 'boolean',
                description: '是否匹配现有类别'
              },
              categoryId: {
                type: 'string',
                description: '如果匹配现有类别，提供类别ID'
              },
              newCategoryName: {
                type: 'string',
                description: '如果创建新类别，提供新类别名称，简洁明了'
              },
              newCategoryDescription: {
                type: 'string',
                description: '如果创建新类别，提供新类别简短描述'
              },
              reasoning: {
                type: 'string',
                description: '分类决策的简短解释'
              }
            },
            required: ['matchesExistingCategory']
          }
        }
      ],
      function_call: { name: 'classifyQuestion' }
    };

    const response = await miniApiClient.post('/chat/completions', requestData);
    
    // 解析响应中的函数调用结果
    if (response.data && 
        response.data.choices && 
        response.data.choices[0] && 
        response.data.choices[0].message && 
        response.data.choices[0].message.function_call) {
      
      try {
        // 解析函数调用参数
        const functionArgs = JSON.parse(response.data.choices[0].message.function_call.arguments);
        
        console.log('问题分类结果:', functionArgs);
        
        // 处理分类结果
        if (functionArgs.matchesExistingCategory) {
          // 匹配到现有类别
          const categoryId = functionArgs.categoryId;
          const category = categories.find(cat => cat.id === categoryId);
          
          if (category) {
            // 更新此类别的计数
            category.count = (category.count || 0) + 1;
            
            // 添加问题到类别映射
            categoryMapping[normalizedQuestion] = categoryId;
            
            // 保存更新
            await saveQuestionCategories(categories);
            await saveQuestionCategoryMapping(categoryMapping);
            
            return {
              success: true,
              newCategory: false,
              categoryId: category.id,
              categoryName: category.name,
              count: category.count,
              reasoning: functionArgs.reasoning || ''
            };
          }
        } else {
          // 创建新类别
          const newCategoryName = functionArgs.newCategoryName;
          const newCategoryDescription = functionArgs.newCategoryDescription;
          
          if (newCategoryName) {
            // 生成新类别ID
            const newCategoryId = `cat_${Date.now()}`;
            
            // 创建新类别
            const newCategory = {
              id: newCategoryId,
              name: newCategoryName,
              description: newCategoryDescription || '',
              count: 1,
              createdAt: new Date().toISOString()
            };
            
            // 添加到类别列表
            categories.push(newCategory);
            
            // 添加问题到类别映射
            categoryMapping[normalizedQuestion] = newCategoryId;
            
            // 保存更新
            await saveQuestionCategories(categories);
            await saveQuestionCategoryMapping(categoryMapping);
            
            return {
              success: true,
              newCategory: true,
              categoryId: newCategoryId,
              categoryName: newCategoryName,
              categoryDescription: newCategoryDescription,
              count: 1,
              reasoning: functionArgs.reasoning || ''
            };
          }
        }
      } catch (error) {
        console.error('解析问题分类响应出错:', error);
      }
    }
    
    return { 
      success: false, 
      reason: '无法对问题进行分类' 
    };
  } catch (error) {
    console.error('问题分类失败:', error);
    return { 
      success: false, 
      reason: '分类过程出错' 
    };
  }
}

/**
 * 获取按类别分组的问题统计
 * @returns {Promise<Array>} 类别统计列表
 */
export async function getQuestionCategoryStats() {
  try {
    const categories = await getQuestionCategories();
    
    // 计算总数
    const totalCount = categories.reduce((sum, cat) => sum + (cat.count || 0), 0);
    
    // 转换为统计数据格式
    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      count: cat.count || 0,
      percentage: totalCount > 0 ? Math.round((cat.count || 0) / totalCount * 100) : 0
    })).sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('获取问题类别统计失败:', error);
    return [];
  }
}

/**
 * 清除所有类别数据
 * @returns {Promise<boolean>} 操作是否成功
 */
export async function clearAllCategoryData() {
  try {
    // 清除类别列表
    await dbStorage.removeItem(QUESTION_CATEGORIES_KEY);
    
    // 清除问题-类别映射
    await dbStorage.removeItem(QUESTION_CATEGORY_MAPPING_KEY);
    
    console.log('所有问题分类数据已清除');
    return true;
  } catch (error) {
    console.error('清除问题分类数据失败:', error);
    return false;
  }
}

export default {
  categorizeQuestion,
  getQuestionCategories,
  getQuestionCategoryStats,
  clearAllCategoryData
}; 
/**
 * 分析服务 - 用于跟踪和分析用户对话数据
 */
import * as dbStorage from '../utils/dbStorage'
import { v4 as uuidv4 } from 'uuid'
import questionCategoryService from './questionCategoryService'

// IndexedDB存储键
const CONVERSATION_ANALYTICS_KEY = 'conversationAnalytics'
const QUESTION_FREQUENCY_KEY = 'questionFrequencyData'
const LOG_ANALYSIS_KEY = 'logAnalysisData'

/**
 * 记录用户对话数据
 * @param {Object} message - 用户消息对象
 * @param {String} conversationId - 对话ID
 */
export async function trackUserQuestion(message, conversationId) {
  try {
    // 只跟踪用户发送的消息
    if (message.sender !== 'user') return
    
    // 获取当前存储的分析数据
    let analyticsData = await loadAnalyticsData()
    
    // 创建新的问题记录
    const questionRecord = {
      id: uuidv4(),
      conversationId,
      question: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
      hasFiles: message.files && message.files.length > 0,
      fileCount: message.files ? message.files.length : 0,
      fileTypes: message.files ? message.files.map(f => f.type) : []
    }
    
    // 将新记录添加到分析数据中
    analyticsData.questions.push(questionRecord)
    
    // 更新问题频率数据 - 这是基于原始文本的统计，仍然保留
    await updateQuestionFrequency(message.content)
    
    // 进行问题分类 - 使用更智能的分类机制
    try {
      console.log('开始对问题进行分类:', message.content);
      
      // 获取现有类别数量
      const categories = await questionCategoryService.getQuestionCategories();
      console.log(`当前已有 ${categories.length} 个问题类别`);
      
      // 执行分类
      const categoryResult = await questionCategoryService.categorizeQuestion(message.content);
      
      if (categoryResult.success) {
        // 将分类结果添加到问题记录中
        questionRecord.category = {
          id: categoryResult.categoryId,
          name: categoryResult.categoryName,
          isNewCategory: categoryResult.newCategory,
          reasoning: categoryResult.reasoning || ''
        }
        
        console.log(`问题已分类到: ${categoryResult.categoryName}${categoryResult.newCategory ? ' (新类别)' : ' (现有类别)'}`);
        console.log(`分类理由: ${categoryResult.reasoning || '无'}`);
      } else {
        console.warn('问题分类失败，原因:', categoryResult.reason);
      }
    } catch (catError) {
      console.error('问题分类过程出错:', catError);
    }
    
    // 保存更新后的分析数据
    await saveAnalyticsData(analyticsData)
    
    console.log('已记录用户问题用于分析', questionRecord.id);
    return questionRecord;
  } catch (error) {
    console.error('记录分析数据失败:', error)
    return null;
  }
}

/**
 * 记录AI回复数据
 * @param {Object} message - AI回复消息对象
 * @param {String} conversationId - 对话ID
 * @param {Object} userData - 相关的用户问题数据
 */
export async function trackAIResponse(message, conversationId, userQuestion) {
  try {
    // 只跟踪AI回复的消息
    if (message.sender !== 'assistant') return
    
    // 获取当前存储的分析数据
    let analyticsData = await loadAnalyticsData()
    
    // 创建新的回复记录
    const responseRecord = {
      id: uuidv4(),
      conversationId,
      relatedToQuestion: userQuestion ? userQuestion.id : null,
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
      hasSources: message.sources && message.sources.length > 0,
      sourceCount: message.sources ? message.sources.length : 0,
      isClarification: message.isClarification || false
    }
    
    // 将新记录添加到分析数据中
    analyticsData.responses.push(responseRecord)
    
    // 保存更新后的分析数据
    await saveAnalyticsData(analyticsData)
    
    console.log('已记录AI回复用于分析', responseRecord.id)
  } catch (error) {
    console.error('记录AI回复分析数据失败:', error)
  }
}

/**
 * 更新问题频率数据
 * @param {String} question - 用户问题
 */
async function updateQuestionFrequency(question) {
  try {
    // 获取当前的问题频率数据
    let frequencyData = await dbStorage.getItem(QUESTION_FREQUENCY_KEY)
    
    // 如果没有数据，初始化
    if (!frequencyData) {
      frequencyData = JSON.stringify({})
    }
    
    // 解析数据
    let parsedData = JSON.parse(frequencyData)
    
    // 处理问题文本 - 简化为标准形式
    // 去除标点符号和多余空格
    const normalizedQuestion = question
      .replace(/[.,?!;:""'']/g, '')
      .toLowerCase()
      .trim()
    
    // 如果问题长度过短，忽略
    if (normalizedQuestion.length < 5) return
    
    // 更新计数
    if (parsedData[normalizedQuestion]) {
      parsedData[normalizedQuestion]++
    } else {
      parsedData[normalizedQuestion] = 1
    }
    
    // 保存更新后的数据
    await dbStorage.setItem(QUESTION_FREQUENCY_KEY, JSON.stringify(parsedData))
  } catch (error) {
    console.error('更新问题频率数据失败:', error)
  }
}

/**
 * 获取热门问题数据
 * @param {Number} limit - 返回的问题数量
 * @returns {Array} 热门问题列表
 */
export async function getTopQuestions(limit = 10) {
  try {
    // 获取问题频率数据
    let frequencyData = await dbStorage.getItem(QUESTION_FREQUENCY_KEY)
    
    if (!frequencyData) {
      return []
    }
    
    // 解析数据
    const parsedData = JSON.parse(frequencyData)
    
    // 转换为数组并排序
    const sortedQuestions = Object.entries(parsedData)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
    
    return sortedQuestions
  } catch (error) {
    console.error('获取热门问题失败:', error)
    return []
  }
}

/**
 * 获取问题类别统计数据
 * @returns {Promise<Array>} 问题类别统计
 */
export async function getQuestionCategoryStats() {
  try {
    return await questionCategoryService.getQuestionCategoryStats()
  } catch (error) {
    console.error('获取问题类别统计失败:', error)
    return []
  }
}

/**
 * 获取问答统计数据
 * @returns {Object} 统计数据
 */
export async function getStatistics() {
  try {
    const analyticsData = await loadAnalyticsData()
    
    // 计算当月问答次数
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const monthlyQuestions = analyticsData.questions.filter(q => {
      const date = new Date(q.timestamp)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    }).length
    
    // 问题解决率计算 - 简单估算，不含有后续问题的对话视为已解决
    const conversationIds = [...new Set(analyticsData.questions.map(q => q.conversationId))]
    let resolvedCount = 0
    
    for (const convId of conversationIds) {
      const questionsInConv = analyticsData.questions.filter(q => q.conversationId === convId)
      
      // 如果对话中只有1-2个问题，视为已解决
      if (questionsInConv.length <= 2) {
        resolvedCount++
      }
    }
    
    const resolutionRate = conversationIds.length > 0 
      ? Math.round((resolvedCount / conversationIds.length) * 100) 
      : 0
      
    return {
      totalQuestions: analyticsData.questions.length,
      totalResponses: analyticsData.responses.length,
      monthlyQuestions,
      resolutionRate: `${resolutionRate}%`
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return {
      totalQuestions: 0,
      totalResponses: 0,
      monthlyQuestions: 0,
      resolutionRate: '0%'
    }
  }
}

/**
 * 获取问题趋势数据
 * @param {String} timeRange - 时间范围：'day', 'week', 'month', 'year'
 * @returns {Object} 趋势数据
 */
export async function getQuestionTrends(timeRange = 'month') {
  try {
    const analyticsData = await loadAnalyticsData()
    const now = new Date()
    
    // 根据时间范围确定开始日期
    let startDate = new Date()
    if (timeRange === 'day') {
      startDate.setHours(0, 0, 0, 0)
    } else if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7)
    } else if (timeRange === 'month') {
      startDate.setMonth(now.getMonth() - 1)
    } else if (timeRange === 'year') {
      startDate.setFullYear(now.getFullYear() - 1)
    }
    
    // 过滤此时间范围内的问题
    const filteredQuestions = analyticsData.questions.filter(q => 
      new Date(q.timestamp) >= startDate
    )
    
    // 按日期分组
    const questionsByDate = {}
    
    filteredQuestions.forEach(q => {
      const date = new Date(q.timestamp)
      const dateStr = date.toLocaleDateString()
      
      if (!questionsByDate[dateStr]) {
        questionsByDate[dateStr] = 0
      }
      
      questionsByDate[dateStr]++
    })
    
    // 转换为需要的格式
    const dates = Object.keys(questionsByDate).sort((a, b) => 
      new Date(a) - new Date(b)
    )
    
    const counts = dates.map(date => questionsByDate[date])
    
    return { dates, counts }
  } catch (error) {
    console.error('获取问题趋势数据失败:', error)
    return { dates: [], counts: [] }
  }
}

/**
 * 获取按问题类别分组的数据
 * @returns {Promise<Object>} 分类数据
 */
export async function getCategoryData() {
  try {
    // 获取所有问题类别统计
    const categoryStats = await questionCategoryService.getQuestionCategoryStats()
    
    // 转换为图表所需格式
    const chartData = categoryStats.map(cat => ({
      name: cat.name,
      value: cat.count
    }))
    
    return chartData
  } catch (error) {
    console.error('获取问题分类数据失败:', error)
    return []
  }
}

/**
 * 加载分析数据
 * @returns {Object} 分析数据
 */
async function loadAnalyticsData() {
  try {
    const data = await dbStorage.getItem(CONVERSATION_ANALYTICS_KEY)
    
    if (data) {
      return JSON.parse(data)
    }
    
    // 如果没有数据，返回初始结构
    return {
      questions: [],
      responses: [],
      feedback: []
    }
  } catch (error) {
    console.error('加载分析数据失败:', error)
    return {
      questions: [],
      responses: [],
      feedback: []
    }
  }
}

/**
 * 保存分析数据
 * @param {Object} data - 要保存的分析数据
 */
async function saveAnalyticsData(data) {
  try {
    await dbStorage.setItem(CONVERSATION_ANALYTICS_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('保存分析数据失败:', error)
  }
}

/**
 * 清除所有分析数据
 * @returns {Promise<boolean>} 操作是否成功
 */
export async function clearAllAnalyticsData() {
  try {
    // 清除问题频率数据
    await dbStorage.removeItem(QUESTION_FREQUENCY_KEY)
    
    // 清除对话分析数据
    await dbStorage.removeItem(CONVERSATION_ANALYTICS_KEY)
    
    // 清除问题类别数据
    await questionCategoryService.clearAllCategoryData()
    
    console.log('所有分析数据已清除')
    return true
  } catch (error) {
    console.error('清除分析数据失败:', error)
    return false
  }
}

/**
 * 记录用户反馈数据
 * @param {Object} feedback - 反馈数据对象
 * @returns {Promise<void>}
 */
export async function trackFeedback(feedback) {
  try {
    // 获取当前存储的分析数据
    let analyticsData = await loadAnalyticsData()
    
    // 确保有反馈数组
    if (!analyticsData.feedback) {
      analyticsData.feedback = []
    }
    
    // 确保反馈数据包含必要的字段
    const feedbackData = {
      ...feedback,
      id: feedback.id || uuidv4(),
      timestamp: feedback.timestamp || new Date().toISOString(),
      // 确保recentAIMessages存在，且最多包含3条消息
      recentAIMessages: (feedback.recentAIMessages || []).slice(0, 3).map(msg => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp,
        // 只保留来源的有用信息，减少存储体积
        sources: (msg.sources || []).map(src => ({
          title: src.title,
          relevance: src.relevance
        }))
      }))
    }
    
    // 将反馈添加到分析数据
    analyticsData.feedback.push(feedbackData)
    
    // 保存更新后的分析数据
    await saveAnalyticsData(analyticsData)
    
    // 如果添加到知识库，增加相应的反馈评分计数
    if (feedback.helpful) {
      await updateFeedbackCounts('helpful')
      
      if (feedback.addToKnowledge) {
        await updateFeedbackCounts('addedToKnowledge')
      }
    } else {
      await updateFeedbackCounts('notHelpful')
    }
    
    console.log('已记录用户反馈用于分析', feedback.id)
  } catch (error) {
    console.error('记录用户反馈失败:', error)
  }
}

/**
 * 更新反馈计数
 * @param {String} type - 反馈类型 
 * @returns {Promise<void>}
 */
async function updateFeedbackCounts(type) {
  try {
    // 反馈计数键
    const FEEDBACK_COUNTS_KEY = 'feedbackCounts'
    
    // 获取当前计数
    let countsData = await dbStorage.getItem(FEEDBACK_COUNTS_KEY)
    
    // 如果没有数据，初始化
    if (!countsData) {
      countsData = JSON.stringify({
        helpful: 0,
        notHelpful: 0,
        addedToKnowledge: 0
      })
    }
    
    // 解析数据
    const counts = JSON.parse(countsData)
    
    // 更新计数
    if (counts[type] !== undefined) {
      counts[type]++
    } else {
      counts[type] = 1
    }
    
    // 保存更新后的数据
    await dbStorage.setItem(FEEDBACK_COUNTS_KEY, JSON.stringify(counts))
  } catch (error) {
    console.error('更新反馈计数失败:', error)
  }
}

/**
 * 获取反馈计数统计
 * @returns {Promise<Object>} 反馈计数统计
 */
export async function getFeedbackCounts() {
  try {
    // 反馈计数键
    const FEEDBACK_COUNTS_KEY = 'feedbackCounts'
    
    // 获取当前计数
    let countsData = await dbStorage.getItem(FEEDBACK_COUNTS_KEY)
    
    // 如果没有数据，返回默认值
    if (!countsData) {
      return {
        helpful: 0,
        notHelpful: 0,
        addedToKnowledge: 0
      }
    }
    
    // 解析并返回数据
    return JSON.parse(countsData)
  } catch (error) {
    console.error('获取反馈计数统计失败:', error)
    return {
      helpful: 0,
      notHelpful: 0,
      addedToKnowledge: 0
    }
  }
}

/**
 * 记录日志分析数据
 * @param {Object} logData - 日志数据对象
 * @param {Object} analysisResult - 分析结果
 * @returns {Promise<void>}
 */
export async function trackLogAnalysis(logData, analysisResult) {
  try {
    // 获取当前存储的日志分析数据
    let analysisData = await getLogAnalysisData();
    
    // 创建新的日志分析记录
    const logAnalysisRecord = {
      id: analysisResult.id || uuidv4(),
      timestamp: new Date().toISOString(),
      deviceType: logData.deviceType,
      logType: logData.logType,
      contentLength: logData.logContent ? logData.logContent.length : 0,
      severity: analysisResult.severity,
      issuesCount: analysisResult.issues ? analysisResult.issues.length : 0,
      issueTypes: analysisResult.issues ? analysisResult.issues.map(issue => issue.title) : []
    };
    
    // 将记录添加到分析数据中
    analysisData.push(logAnalysisRecord);
    
    // 保存更新后的分析数据
    await saveLogAnalysisData(analysisData);
    
    console.log('已记录日志分析用于统计', logAnalysisRecord.id);
  } catch (error) {
    console.error('记录日志分析统计数据失败:', error);
  }
}

/**
 * 获取日志分析历史数据
 * @param {Number} limit - 限制返回的数量，默认无限制
 * @returns {Promise<Array>} - 日志分析历史
 */
export async function getLogAnalysisHistory(limit = 0) {
  try {
    const data = await getLogAnalysisData();
    
    // 按时间倒序排序
    const sortedData = data.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // 如果设置了限制，则截取相应数量
    return limit > 0 ? sortedData.slice(0, limit) : sortedData;
  } catch (error) {
    console.error('获取日志分析历史失败:', error);
    return [];
  }
}

/**
 * 获取日志分析统计信息
 * @returns {Promise<Object>} - 统计信息
 */
export async function getLogAnalysisStats() {
  try {
    const data = await getLogAnalysisData();
    
    // 获取总分析次数
    const totalCount = data.length;
    
    // 最近30天的分析次数
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCount = data.filter(item => 
      new Date(item.timestamp) >= thirtyDaysAgo
    ).length;
    
    // 按严重程度统计
    const severityCounts = data.reduce((counts, item) => {
      const severity = item.severity || 'unknown';
      counts[severity] = (counts[severity] || 0) + 1;
      return counts;
    }, {});
    
    // 按设备类型统计
    const deviceTypeCounts = data.reduce((counts, item) => {
      const deviceType = item.deviceType || 'unknown';
      counts[deviceType] = (counts[deviceType] || 0) + 1;
      return counts;
    }, {});
    
    // 按日志类型统计
    const logTypeCounts = data.reduce((counts, item) => {
      const logType = item.logType || 'unknown';
      counts[logType] = (counts[logType] || 0) + 1;
      return counts;
    }, {});
    
    // 常见问题类型统计
    const issueTypeCounts = {};
    data.forEach(item => {
      if (item.issueTypes && Array.isArray(item.issueTypes)) {
        item.issueTypes.forEach(issueType => {
          issueTypeCounts[issueType] = (issueTypeCounts[issueType] || 0) + 1;
        });
      }
    });
    
    // 转换为排序后的数组
    const topIssueTypes = Object.entries(issueTypeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalCount,
      recentCount,
      severityCounts,
      deviceTypeCounts,
      logTypeCounts,
      topIssueTypes
    };
  } catch (error) {
    console.error('获取日志分析统计信息失败:', error);
    return {
      totalCount: 0,
      recentCount: 0,
      severityCounts: {},
      deviceTypeCounts: {},
      logTypeCounts: {},
      topIssueTypes: []
    };
  }
}

/**
 * 加载日志分析数据
 * @returns {Promise<Array>} - 日志分析数据数组
 */
async function getLogAnalysisData() {
  try {
    const data = await dbStorage.getItem(LOG_ANALYSIS_KEY);
    
    if (data) {
      return JSON.parse(data);
    }
    
    // 如果没有数据，返回空数组
    return [];
  } catch (error) {
    console.error('加载日志分析数据失败:', error);
    return [];
  }
}

/**
 * 保存日志分析数据
 * @param {Array} data - 要保存的日志分析数据
 */
async function saveLogAnalysisData(data) {
  try {
    await dbStorage.setItem(LOG_ANALYSIS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('保存日志分析数据失败:', error);
  }
}

export default {
  trackUserQuestion,
  trackAIResponse,
  getTopQuestions,
  getStatistics,
  getQuestionTrends,
  getQuestionCategoryStats,
  getCategoryData,
  clearAllAnalyticsData,
  trackFeedback,
  getFeedbackCounts,
  trackLogAnalysis,
  getLogAnalysisHistory,
  getLogAnalysisStats
} 
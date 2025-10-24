import axios from 'axios';

// 配置参数
const AI_API_URL = 'https://xiaoai.plus/v1';
const AI_API_KEY = 'sk-ECDknwAwbrjRDOVegNuk5Zk2zOfXqFthxL36Z7miazL3QGO6';
const AI_MINI_MODEL = 'gpt-4o-mini'; // 使用小模型进行判断

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
 * 判断用户问题是否需要额外澄清或者补充信息
 * @param {string} userQuery - 用户问题
 * @param {Array} history - 对话历史
 * @returns {Promise<Object>} - 包含判断结果和建议的问题
 */
export async function checkNeedsClarification(userQuery, history = []) {
  try {
    console.log('开始评估问题是否需要澄清...');
    
    // 构建系统提示词，指导小模型评估问题是否需要澄清
    const systemPrompt = `你是一个学习路径规划助手，负责判断用户的学习需求是否需要更多信息才能制定准确的个性化学习路径。
    
任务：分析用户的学习需求并决定是否需要请求更多具体信息进行认知诊断。

判断标准：
1. 学习目标不明确，无法确定具体的学习方向或深度要求
2. 缺少当前学习基础信息，无法进行准确的认知诊断
3. 学习时间、节奏偏好等个性化要求不清楚
4. 学习困难或薄弱环节描述模糊，需要更多细节进行分析
5. 学习资源偏好（文本、视频、实践等）未明确
6. 问题太笼统，无法制定具体的学习路径

判断过程：
1. 判断用户问题是否属于学习规划相关需求
2. 如果是，评估信息的完整性，特别是认知诊断所需的关键信息
3. 确定是否需要额外信息才能制定有效的学习路径
4. 如果需要，准备1-2个最关键的诊断性问题

只有在明确确定需要更多信息进行认知诊断时才返回需要澄清的问题。如果信息已足够制定基础学习路径，则回答不需要澄清。`;

    // 构建发送给API的请求体
    const requestData = {
      model: AI_MINI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-3), // 只取最近3轮对话作为上下文
        { role: 'user', content: userQuery }
      ],
      functions: [
        {
          name: 'clarificationResponse',
          description: '返回是否需要澄清以及澄清问题',
          parameters: {
            type: 'object',
            properties: {
              needsClarification: {
                type: 'boolean',
                description: '是否需要用户提供更多信息'
              },
              clarificationQuestions: {
                type: 'array',
                description: '需要用户回答的问题列表，最多2个问题',
                items: {
                  type: 'string',
                  description: '一个明确、具体的问题，例如"请提供show interface命令的输出"或"请说明您使用的路由器型号"'
                }
              },
              reasoning: {
                type: 'string',
                description: '为什么需要或不需要澄清的简短解释'
              }
            },
            required: ['needsClarification']
          }
        }
      ],
      function_call: { name: 'clarificationResponse' } // 强制调用此函数
    };

    console.log('发送判断请求到小模型...');
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
        
        console.log('小模型判断结果:', functionArgs);
        return {
          needsClarification: functionArgs.needsClarification,
          clarificationQuestions: functionArgs.clarificationQuestions || [],
          reasoning: functionArgs.reasoning || ''
        };
      } catch (error) {
        console.error('解析小模型响应出错:', error);
        return { needsClarification: false };
      }
    }
    
    // 如果没有正确获取结果，默认不需要澄清
    return { needsClarification: false };
  } catch (error) {
    console.error('调用小模型判断服务失败:', error);
    // 出错时默认不需要澄清
    return { needsClarification: false };
  }
}

/**
 * 生成澄清消息
 * @param {Array} questions - 澄清问题列表
 * @returns {string} - 格式化的澄清消息
 */
export function generateClarificationMessage(questions) {
  if (!questions || questions.length === 0) {
    return "为了更好地回答您的问题，我需要一些额外信息。请提供更多详细信息。";
  }
  
  let message = "为了能够更准确地回答您的问题，我需要一些额外信息：\n\n";
  
  questions.forEach((question, index) => {
    message += `${index + 1}. ${question}\n`;
  });
  
  message += "\n请提供这些信息，这将帮助我给出更准确的解答。";
  
  return message;
}

export default {
  checkNeedsClarification,
  generateClarificationMessage
}; 
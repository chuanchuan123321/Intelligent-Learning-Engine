/**
 * 日志分析服务 - 用于分析网络设备日志并提供排障建议
 */
import aiService from './aiService'
import analyticsService from './analyticsService'
import { v4 as uuidv4 } from 'uuid'

/**
 * 分析网络设备日志
 * @param {Object} logData - 日志数据对象，包含设备类型、日志类型和日志内容
 * @returns {Promise<Object>} - 分析结果
 */
export async function analyzeNetworkLog(logData) {
  try {
    console.log('开始分析网络日志:', logData.logType);
    
    // 构建分析提示语
    const analysisPrompt = buildAnalysisPrompt(logData);
    
    // 通过AI服务发送分析请求
    const response = await callAIForLogAnalysis(analysisPrompt);
    
    // 解析AI回复，转换为结构化数据
    const analysisResult = parseAIResponse(response);
    
    // 记录分析请求用于统计
    await analyticsService.trackLogAnalysis(logData, analysisResult);
    
    console.log('日志分析完成，发现问题数:', analysisResult.issues?.length || 0);
    return analysisResult;
  } catch (error) {
    console.error('日志分析失败:', error);
    throw new Error('日志分析过程中出现错误，请稍后再试');
  }
}

/**
 * 构建日志分析提示语
 * @param {Object} logData - 日志数据对象
 * @returns {String} - 分析提示语
 */
function buildAnalysisPrompt(logData) {
  // 根据设备类型和日志类型构建专业的提示语
  const deviceTypeText = getDeviceTypeText(logData.deviceType);
  const logTypeText = getLogTypeText(logData.logType);
  
  return `你是一位专业的网络工程师，现在需要分析以下${deviceTypeText}的${logTypeText}输出内容。
请详细分析日志，查找可能存在的网络问题，特别是MTU不匹配、接口错误、路由异常等常见网络故障。

日志内容:
\`\`\`
${logData.logContent}
\`\`\`

请根据以上日志输出：
1. 确定是否存在网络异常和问题程度（正常、警告或严重）
2. 提供问题的清晰摘要
3. 分析每个发现的问题，包括:
   - 问题描述
   - 根本原因分析
   - 具体的修复命令（如"interface GigabitEthernet0/0 mtu 1500"）
   - 解决方案的详细说明
   - 验证问题是否已修复的命令和方法

请以JSON格式返回分析结果，格式如下:
\`\`\`json
{
  "severity": "info|warning|critical",
  "summary": "问题概述",
  "issues": [
    {
      "title": "问题标题",
      "description": "详细描述",
      "rootCause": "根本原因",
      "commands": ["修复命令1", "修复命令2"],
      "solution": "解决方案详细说明",
      "verification": "验证方法说明",
      "verificationCommands": ["验证命令1", "验证命令2"]
    }
  ],
  "rawDetails": "完整的分析详情"
}
\`\`\`

请确保返回的是有效的JSON格式，不要包含额外的文本说明。`;
}

/**
 * 获取设备类型文本
 * @param {String} deviceType - 设备类型代码
 * @returns {String} - 设备类型描述文本
 */
function getDeviceTypeText(deviceType) {
  switch (deviceType) {
    case 'huawei':
      return '华为设备';
    case 'cisco':
      return '思科设备';
    case 'other':
      return '网络设备';
    default:
      return '网络设备';
  }
}

/**
 * 获取日志类型文本
 * @param {String} logType - 日志类型代码
 * @returns {String} - 日志类型描述文本
 */
function getLogTypeText(logType) {
  switch (logType) {
    case 'debug_ip_packet':
      return 'debug ip packet';
    case 'interface_status':
      return '接口状态';
    case 'routing_table':
      return '路由表';
    case 'other':
      return '日志';
    default:
      return '日志';
  }
}

/**
 * 调用AI服务进行日志分析
 * @param {String} prompt - 分析提示语
 * @returns {Object} - AI回复内容
 */
async function callAIForLogAnalysis(prompt) {
  try {
    // 构建提交到AI服务的内容
    const history = []; // 无需历史记录，每次都是独立的分析
    
    // 使用现有的AI服务发送消息
    const aiResponse = await aiService.sendMessageToAI(prompt, history, []);
    
    return aiResponse;
  } catch (error) {
    console.error('调用AI服务进行日志分析失败:', error);
    throw error;
  }
}

/**
 * 解析AI回复，提取JSON数据
 * @param {Object} aiResponse - AI回复内容
 * @returns {Object} - 结构化的分析结果
 */
function parseAIResponse(aiResponse) {
  try {
    const content = aiResponse.content || '';
    
    // 提取JSON内容
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    
    if (jsonMatch && jsonMatch[1]) {
      // 成功提取到JSON
      const jsonStr = jsonMatch[1];
      const analysisResult = JSON.parse(jsonStr);
      
      return {
        ...analysisResult,
        id: uuidv4()  // 添加唯一ID，便于引用
      };
    } else {
      // 尝试从全文中解析JSON
      const possibleJson = content.trim();
      try {
        const analysisResult = JSON.parse(possibleJson);
        return {
          ...analysisResult,
          id: uuidv4()
        };
      } catch (jsonError) {
        console.error('无法从AI回复中解析JSON:', jsonError);
        
        // 构建一个基本的错误结果
        return {
          id: uuidv4(),
          severity: 'warning',
          summary: '无法解析分析结果，但原始分析内容已保存',
          issues: [],
          rawDetails: content
        };
      }
    }
  } catch (error) {
    console.error('解析AI回复失败:', error);
    return {
      id: uuidv4(),
      severity: 'warning',
      summary: '分析过程出错，请查看原始详情或重试',
      issues: [],
      rawDetails: aiResponse.content || '无内容'
    };
  }
}

/**
 * 格式化分析结果为Markdown格式(用于聊天窗口展示)
 * @param {Object} analysisResult - 分析结果对象
 * @returns {String} - Markdown格式的文本
 */
export function formatAnalysisToMarkdown(analysisResult) {
  if (!analysisResult) {
    return '分析结果为空，请重新分析';
  }
  
  let markdown = `## 网络日志分析结果\n\n`;
  
  // 添加严重程度和摘要
  const severityMap = {
    'info': '✅ 网络状态正常',
    'warning': '⚠️ 发现潜在问题',
    'critical': '❌ 发现严重问题'
  };
  
  markdown += `**${severityMap[analysisResult.severity] || '分析完成'}**\n\n`;
  markdown += `### 摘要\n${analysisResult.summary || '无摘要信息'}\n\n`;
  
  // 添加发现的问题
  if (analysisResult.issues && analysisResult.issues.length > 0) {
    markdown += `### 发现的问题\n\n`;
    
    analysisResult.issues.forEach((issue, index) => {
      markdown += `#### ${index + 1}. ${issue.title}\n\n`;
      markdown += `**问题描述**：${issue.description}\n\n`;
      markdown += `**根本原因**：${issue.rootCause}\n\n`;
      
      // 添加修复命令
      if (issue.commands && issue.commands.length > 0) {
        markdown += `**修复命令**：\n\`\`\`\n${issue.commands.join('\n')}\n\`\`\`\n\n`;
      }
      
      markdown += `**解决方案**：${issue.solution}\n\n`;
      
      // 添加验证方法
      markdown += `**验证方法**：${issue.verification}\n\n`;
      
      if (issue.verificationCommands && issue.verificationCommands.length > 0) {
        markdown += `**验证命令**：\n\`\`\`\n${issue.verificationCommands.join('\n')}\n\`\`\`\n\n`;
      }
      
      // 添加分隔线
      if (index < analysisResult.issues.length - 1) {
        markdown += `---\n\n`;
      }
    });
  } else {
    markdown += `未发现具体问题，如需更详细分析，请提供更完整的日志信息。\n\n`;
  }
  
  return markdown;
}

export default {
  analyzeNetworkLog,
  formatAnalysisToMarkdown
} 
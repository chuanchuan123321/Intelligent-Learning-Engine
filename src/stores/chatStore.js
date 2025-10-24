import { defineStore } from 'pinia'
import axios from 'axios'
import aiService from '../services/aiService'
import clarificationService from '../services/clarificationService'
import analyticsService from '../services/analyticsService'
import { useKnowledgeStore } from './knowledgeStore'
import { useAppConfigStore } from './appConfigStore'
import * as dbStorage from '../utils/dbStorage'

// Key for storing conversations in IndexedDB
const STORAGE_KEY = 'chatConversations'

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [],
    currentConversation: {
      id: null,
      messages: []
    },
    isLoading: false,
    knowledgeBaseSources: [],
    clarificationMode: false, // 标记是否处于澄清模式
    feedbackData: [] // 存储用户反馈数据
  }),
  
  actions: {
    // 初始化 - 从IndexedDB加载对话
    async initialize() {
      try {
        const storedConversations = await dbStorage.getItem(STORAGE_KEY)
        if (storedConversations) {
          this.conversations = JSON.parse(storedConversations)
          
          if (this.conversations.length > 0) {
            // 设置最后一个对话为当前对话
            this.currentConversation = this.conversations[this.conversations.length - 1]
          } else {
            this.startNewConversation()
          }
        } else {
          // 没有存储的对话，创建新对话
          this.startNewConversation()
        }
      } catch (error) {
        console.error('从IndexedDB加载对话失败:', error)
        // 出错时创建新对话
        this.startNewConversation()
      }
    },
    
    // 保存对话到IndexedDB
    async saveConversations() {
      try {
        await dbStorage.setItem(STORAGE_KEY, JSON.stringify(this.conversations))
      } catch (error) {
        console.error('保存对话到IndexedDB失败:', error)
      }
    },
    
    async sendMessage(message, includeFiles = []) {
      this.isLoading = true
      
      // Add user message to conversation
      const userMessage = {
        id: Date.now(),
        sender: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        files: includeFiles
      }
      
      this.currentConversation.messages.push(userMessage)
      
      // 记录用户问题用于分析
      await analyticsService.trackUserQuestion(userMessage, this.currentConversation.id)
      
      try {
        // 准备历史消息以格式化为API所需格式
        const history = this.currentConversation.messages
          .slice(0, -1) // 排除刚添加的用户消息
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          }));
        
        // 获取应用配置，判断是否启用小模型
        const appConfigStore = useAppConfigStore()
        
        // 如果不是处于澄清模式并且小模型功能已启用，使用小模型判断是否需要澄清
        if (!this.clarificationMode && appConfigStore.smallModelEnabled) {
          // 使用小模型判断是否需要澄清
          const clarificationResult = await clarificationService.checkNeedsClarification(message, history);
          
          // 如果需要澄清
          if (clarificationResult.needsClarification && clarificationResult.clarificationQuestions.length > 0) {
            console.log('小模型判断需要澄清，提问:', clarificationResult.clarificationQuestions);
            
            // 生成澄清消息
            const clarificationMessage = clarificationService.generateClarificationMessage(
              clarificationResult.clarificationQuestions
            );
            
            // 添加AI澄清回复
            const clarificationResponse = {
              id: Date.now() + 1,
              sender: 'assistant',
              content: clarificationMessage,
              timestamp: new Date().toISOString(),
              isClarification: true, // 标记这是一个澄清消息
              reasoning: clarificationResult.reasoning // 保存推理过程，便于调试
            };
            
            this.currentConversation.messages.push(clarificationResponse);
            
            // 记录澄清回复用于分析
            await analyticsService.trackAIResponse(clarificationResponse, this.currentConversation.id, userMessage);
            
            // 设置澄清模式
            this.clarificationMode = true;
            
            // 保存到IndexedDB
            await this.saveConversations();
            
            // 不需要进一步处理，直接返回
            this.isLoading = false;
            return;
          }
        } else if (this.clarificationMode) {
          // 如果处于澄清模式，表示这是用户对澄清问题的回复
          // 重置澄清模式
          this.clarificationMode = false;
          console.log('用户回复了澄清问题，继续处理...');
        }
        
        // 使用新的AI服务发送消息
        const aiResponse = await aiService.sendMessageToAI(message, history, includeFiles);
        
        // 添加AI回复到会话
        const botResponse = {
          id: Date.now() + 1,
          sender: 'assistant',
          content: aiResponse.content,
          timestamp: new Date().toISOString(),
          sources: aiResponse.sources,
          // 存储完整的文档内容，用于参考卡片点击显示
          _fullContent: {}
        }
        
        // 如果有文档内容，从响应中提取并存储
        if (aiResponse.sources && aiResponse.sources.length > 0 && aiResponse.fullDocContents) {
          botResponse._fullContent = aiResponse.fullDocContents;
        }
        
        this.currentConversation.messages.push(botResponse)
        
        // 记录AI回复用于分析
        await analyticsService.trackAIResponse(botResponse, this.currentConversation.id, userMessage);
        
        // 保存到IndexedDB
        await this.saveConversations()
      } catch (error) {
        console.error('Error sending message:', error)
        const errorResponse = {
          id: Date.now() + 1,
          sender: 'assistant',
          content: '对不起，我在处理您的请求时遇到了错误。请稍后再试。',
          timestamp: new Date().toISOString(),
          isError: true
        };
        
        this.currentConversation.messages.push(errorResponse)
        
        // 记录错误回复
        await analyticsService.trackAIResponse(errorResponse, this.currentConversation.id, userMessage);
        
        // 重置澄清模式
        this.clarificationMode = false;
        
        // 即使出错也保存
        await this.saveConversations()
      } finally {
        this.isLoading = false
      }
    },
    
    async startNewConversation() {
      this.currentConversation = {
        id: Date.now(),
        messages: []
      }
      
      if (this.conversations.length > 0) {
        this.conversations.push(this.currentConversation)
      } else {
        this.conversations = [this.currentConversation]
      }
      
      // 保存到IndexedDB
      await this.saveConversations()
    },
    
    // 清空当前会话
    async clearCurrentConversation() {
      this.currentConversation.messages = []
      
      // 保存到IndexedDB
      await this.saveConversations()
    },
    
    // 导出当前会话
    exportCurrentConversation() {
      if (!this.currentConversation || this.currentConversation.messages.length === 0) {
        return null
      }
      
      // 格式化会话内容
      const conversationTitle = `IP智慧问答会话记录_${new Date().toLocaleDateString().replace(/\//g, '-')}`
      
      let exportContent = `# ${conversationTitle}\n\n`
      exportContent += `导出时间: ${new Date().toLocaleString()}\n\n`
      
      this.currentConversation.messages.forEach(message => {
        const sender = message.sender === 'user' ? '用户' : 'IP智慧助手'
        const time = new Date(message.timestamp).toLocaleString()
        
        exportContent += `## ${sender} (${time})\n\n`
        exportContent += `${message.content}\n\n`
        
        if (message.sources && message.sources.length > 0) {
          exportContent += `参考资料:\n`
          message.sources.forEach(source => {
            exportContent += `- ${source.title} (相关度: ${Math.round(source.relevance * 100)}%)\n`
          })
          exportContent += '\n'
        }
      })
      
      // 创建并下载文件
      const blob = new Blob([exportContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${conversationTitle}.md`
      link.click()
      
      // 清理
      URL.revokeObjectURL(url)
      
      return true
    },
    
    // 删除对话
    async deleteConversation(conversationId) {
      const index = this.conversations.findIndex(c => c.id === conversationId)
      if (index !== -1) {
        this.conversations.splice(index, 1)
        
        // 如果删除的是当前对话，则切换到最后一个对话
        if (this.currentConversation.id === conversationId) {
          if (this.conversations.length > 0) {
            this.currentConversation = this.conversations[this.conversations.length - 1]
          } else {
            // 没有对话了，创建新对话
            await this.startNewConversation()
            return
          }
        }
        
        // 保存更改
        await this.saveConversations()
      }
    },
    
    // 增加批量删除对话方法
    async deleteMultipleConversations(conversationIds) {
      if (!conversationIds || conversationIds.length === 0) return;
      
      // 过滤出要保留的对话
      this.conversations = this.conversations.filter(conv => !conversationIds.includes(conv.id));
      
      // 如果当前对话被删除，则切换到最后一个对话
      if (conversationIds.includes(this.currentConversation.id)) {
        if (this.conversations.length > 0) {
          this.currentConversation = this.conversations[this.conversations.length - 1];
        } else {
          // 没有对话了，创建新对话
          await this.startNewConversation();
          return;
        }
      }
      
      // 保存更改
      await this.saveConversations();
    },
    
    /**
     * 提交对AI回答的反馈
     * @param {Object} feedbackData - 反馈数据对象
     * @param {Object} message - AI回答消息对象
     * @param {Object} userMessage - 用户问题消息对象
     * @returns {Promise<boolean>} - 是否成功
     */
    async submitFeedback(feedbackData, message, userMessage) {
      try {
        // 收集最近三轮AI回答
        const currentMessageIndex = this.currentConversation.messages.findIndex(m => m.id === message.id);
        let recentAIMessages = [];
        
        if (currentMessageIndex !== -1) {
          // 从当前消息向前搜索，最多收集三轮AI回答
          let count = 0;
          let index = currentMessageIndex;
          
          // 首先添加当前反馈的消息
          recentAIMessages.push({
            id: message.id,
            content: message.content,
            timestamp: message.timestamp,
            sources: message.sources || []
          });
          count++;
          
          // 向前搜索更多的AI回答
          while (count < 3 && index > 0) {
            index--;
            const prevMessage = this.currentConversation.messages[index];
            
            // 只收集AI助手的回答
            if (prevMessage.sender === 'assistant') {
              recentAIMessages.push({
                id: prevMessage.id,
                content: prevMessage.content,
                timestamp: prevMessage.timestamp,
                sources: prevMessage.sources || []
              });
              count++;
            }
          }
        }
        
        // 创建反馈记录
        const feedback = {
          id: Date.now(),
          messageId: message.id,
          conversationId: this.currentConversation.id,
          timestamp: new Date().toISOString(),
          recentAIMessages: recentAIMessages, // 存储最近三轮AI回答
          ...feedbackData
        }
        
        // 将反馈数据添加到状态中
        this.feedbackData.push(feedback)
        
        // 将反馈标记存入消息中
        const messageIndex = this.currentConversation.messages.findIndex(m => m.id === message.id)
        if (messageIndex !== -1) {
          this.currentConversation.messages[messageIndex].feedback = {
            helpful: feedbackData.helpful,
            addedToKnowledge: feedbackData.addToKnowledge,
            timestamp: feedback.timestamp
          }
        }
        
        // 保存对话到 IndexedDB
        await this.saveConversations()
        
        // 记录反馈用于分析
        await analyticsService.trackFeedback(feedback)
        
        // 如果用户认为有帮助并希望添加到知识库
        if (feedbackData.helpful && feedbackData.addToKnowledge) {
          // 从相关消息中获取上下文
          const userQuestion = userMessage ? userMessage.content : "未知问题"
          
          // 将解决方案添加到知识库
          await this.addSolutionToKnowledgeBase({
            title: feedbackData.title || `解决方案: ${userQuestion.substring(0, 50)}...`,
            content: message.content,
            category: feedbackData.category || "Troubleshooting",
            userQuestion: userQuestion,
            sources: message.sources || [],
            recentAIMessages: recentAIMessages
          })
        }
        
        return true
      } catch (error) {
        console.error('提交反馈失败:', error)
        return false
      }
    },
    
    /**
     * 将解决方案添加到知识库
     * @param {Object} solution - 解决方案对象
     * @param {Array} recentAIMessages - 最近的AI消息数组
     * @returns {Promise<boolean>} - 是否成功
     */
    async addSolutionToKnowledgeBase(solution) {
      try {
        const knowledgeStore = useKnowledgeStore()
        
        // 准备知识库文档数据
        const documentData = {
          title: solution.title,
          content: solution.content,
          category: solution.category,
          type: 'validated-solution',
          description: `用户验证的解决方案，回答问题: "${solution.userQuestion}"`,
          metadata: {
            fromUserFeedback: true,
            originalQuestion: solution.userQuestion,
            sources: solution.sources || [],
            validationDate: new Date().toISOString(),
            // 如果有提供最近的AI回答，添加到元数据中
            previousResponses: solution.recentAIMessages || []
          },
          // 自动生成标签
          tags: await this.generateSolutionTags(solution)
        }
        
        // 上传到知识库
        await knowledgeStore.uploadDocument(documentData)
        
        // 更新用户验证的解决方案列表
        await knowledgeStore.getUserValidatedSolutions()
        
        console.log('解决方案已添加到知识库:', documentData.title)
        return true
      } catch (error) {
        console.error('将解决方案添加到知识库失败:', error)
        return false
      }
    },
    
    /**
     * 为解决方案生成标签
     * @param {Object} solution - 解决方案对象
     * @returns {Promise<Array>} - 生成的标签数组
     */
    async generateSolutionTags(solution) {
      try {
        // 这里可以添加调用AI服务生成标签的逻辑
        // 简单实现示例，从问题中抽取关键词
        const keywords = solution.userQuestion
          .toLowerCase()
          .split(/\s+/)
          .filter(word => 
            word.length > 3 && 
            !['what', 'when', 'where', 'which', 'how', 'why', 'this', 'that', 'these', 'those', 'from', 'with'].includes(word)
          )
        
        // 提取协议名称或技术名称
        const protocolRegex = /\b(ospf|bgp|eigrp|rip|isis|mpls|vpn|ipsec|nat|acl|stp|vlan|qos|dhcp|dns|tcp|udp|icmp|http|ftp|ssh|telnet)\b/ig
        const matches = [...solution.userQuestion.matchAll(protocolRegex)]
        const protocols = matches.map(match => match[0].toUpperCase())
        
        // 合并并去重
        const allTags = [...new Set([...keywords, ...protocols])]
        
        // 限制标签数量
        return allTags.slice(0, 5)
      } catch (error) {
        console.error('生成解决方案标签失败:', error)
        return []
      }
    }
  }
}) 
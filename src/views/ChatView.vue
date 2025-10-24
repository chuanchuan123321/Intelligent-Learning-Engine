<template>
  <div class="chat-container">
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <h3>会话历史</h3>
        <div class="sidebar-actions">
          <el-button size="small" @click="toggleSelectionMode" v-if="!selectionMode && chatStore.conversations.length > 0">
            <el-icon><Delete /></el-icon> 批量删除
          </el-button>
          <el-button type="primary" size="small" @click="startNewChat" v-if="!selectionMode">
            <el-icon><Plus /></el-icon> 新对话
          </el-button>
          <template v-if="selectionMode">
            <el-button size="small" type="danger" @click="confirmDeleteSelected" :disabled="selectedConversations.length === 0">
              删除 ({{ selectedConversations.length }})
            </el-button>
            <el-button size="small" @click="toggleSelectionMode">取消</el-button>
          </template>
        </div>
      </div>
      
      <div class="conversation-list">
        <div 
          v-for="(conversation, index) in chatStore.conversations" 
          :key="conversation.id"
          class="conversation-item"
          :class="{ 
            active: conversation.id === chatStore.currentConversation.id,
            'selection-mode': selectionMode 
          }"
        >
          <div class="conversation-select" v-if="selectionMode">
            <el-checkbox 
              v-model="conversation.selected" 
              @change="updateSelectedConversations"
            />
          </div>
          <div 
            class="conversation-content" 
            @click="selectionMode ? toggleConversationSelection(conversation) : selectConversation(conversation)"
          >
            <div class="conversation-info">
              <span class="conversation-title">会话 {{ index + 1 }}</span>
              <span class="conversation-timestamp">{{ formatDate(getFirstMessageTime(conversation)) }}</span>
            </div>
            <div class="conversation-preview" v-if="conversation.messages.length > 0">
              {{ getConversationPreview(conversation) }}
            </div>
          </div>
          <div class="conversation-actions" v-if="!selectionMode">
            <el-button 
              type="danger" 
              size="small" 
              circle 
              @click.stop="confirmDeleteConversation(conversation)" 
              class="delete-btn"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-main">
      <div class="chat-header">
        <div class="current-conversation">
          <h2>智能学习诊断助手</h2>
          <p>基于深度推理大模型进行认知诊断，制定个性化学习路径</p>
        </div>
        
        <div class="header-actions">
          <el-button-group>
            <el-tooltip content="上传学习资料">
              <el-upload
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleImageChange"
                :accept="'.jpg,.jpeg,.png,.gif,.webp'"
                class="image-upload"
              >
                <el-button size="small" type="default">
                  <el-icon><Picture /></el-icon>
                </el-button>
              </el-upload>
            </el-tooltip>
            <el-tooltip content="导出会话">
              <el-button size="small" @click="exportConversation" :disabled="!hasMessages">
                <el-icon><Download /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="清空会话">
              <el-button size="small" @click="confirmClearConversation" :disabled="!hasMessages">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
          </el-button-group>
        </div>
      </div>
      
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="chatStore.currentConversation.messages.length === 0" class="empty-state">
          <img src="../assets/network-diagram.svg" alt="Learning illustration" class="empty-state-image">
          <h3>开始您的个性化学习诊断</h3>
          <p>告诉我您的学习目标和当前状态，我将为您制定最适合的学习路径</p>
          
          <div class="quick-prompts">
            <h4>认知诊断示例</h4>
            <div class="prompt-buttons">
              <el-button @click="usePrompt('评估我的数学基础，制定微积分学习路径')" type="info" plain>评估我的数学基础，制定微积分学习路径</el-button>
              <el-button @click="usePrompt('诊断我的编程思维，规划算法学习方案')" type="info" plain>诊断我的编程思维，规划算法学习方案</el-button>
              <el-button @click="usePrompt('分析我的学习困难，优化学习策略')" type="info" plain>分析我的学习困难，优化学习策略</el-button>
              <el-button @click="usePrompt('制定STEM学科综合学习路径')" type="info" plain>制定STEM学科综合学习路径</el-button>
            </div>
          </div>
        </div>
        
        <template v-else>
          <div class="messages-date-divider">
            <span>{{ formatFullDate(getFirstMessageTime(chatStore.currentConversation)) }}</span>
          </div>
          
          <div 
            v-for="message in chatStore.currentConversation.messages" 
            :key="message.id"
            class="message"
            :class="[
              message.sender, 
              { 'message-error': message.isError },
              { 'message-clarification': message.isClarification }
            ]"
          >
            <div class="message-avatar">
              <el-avatar :icon="message.sender === 'user' ? User : ChatLineRound" :size="40" :color="message.sender === 'user' ? '#909399' : '#409EFF'" />
            </div>
            
            <div class="message-content">
              <div class="message-header">
                <span class="message-sender">{{ message.sender === 'user' ? '您' : '学习诊断助手' }}</span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                <el-tag size="small" v-if="message.isClarification" type="warning" class="clarification-tag">需要更多信息</el-tag>
              </div>
              
              <div v-if="message.files && message.files.length > 0" class="message-files">
                <div v-for="(file, i) in message.files" :key="i" class="file-preview">
                  <img :src="file.url" alt="Uploaded file" v-if="file.type.startsWith('image/')" />
                  <div class="file-info" v-else>
                    <el-icon><Document /></el-icon>
                    <span>{{ file.name }}</span>
                  </div>
                </div>
              </div>
              
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              
              <div v-if="message.sources && message.sources.length > 0 && message.sources.some(s => s.relevance >= 0.1)" class="message-sources">
                <h4>知识图谱参考</h4>
                <el-card 
                  v-for="(source, i) in message.sources.filter(s => s.relevance >= 0.1)" 
                  :key="i" 
                  class="source-item" 
                  shadow="hover"
                  @click="showReferenceContent(message, source)"
                >
                  <div class="source-content">
                    <el-icon class="source-icon"><Document /></el-icon>
                    <div class="source-info">
                      <div class="source-title">
                        {{ source.title }}
                        <span v-if="source.blockCount > 1" class="multi-block-badge">
                          {{ source.blockCount }}个片段
                        </span>
                        <el-tag v-if="source.belowThreshold" size="small" type="danger" class="low-relevance-tag">低相关</el-tag>
                      </div>
                      <el-progress 
                        :percentage="Math.round(source.relevance * 100)" 
                        :color="getRelevanceColor(source.relevance, source.belowThreshold, source.blockCount > 1)"
                        :format="percent => `相关度: ${percent}%`"
                        :stroke-width="10"
                        class="source-relevance"
                      />
                    </div>
                  </div>
                </el-card>
              </div>
              
              <div v-if="message.sender === 'assistant'" class="message-actions">
                <el-button type="text" size="small" @click="copyToClipboard(message.content)">
                  <el-icon><CopyDocument /></el-icon> 复制
                </el-button>
                <el-button type="text" size="small">
                  <el-icon><Star /></el-icon> 收藏
                </el-button>
                <el-button type="text" size="small" @click="openFeedbackDialog(message)">
                  <el-icon><QuestionFilled /></el-icon> 反馈
                </el-button>
              </div>
            </div>
          </div>
        </template>
        
        <div v-if="chatStore.isLoading" class="loading-indicator">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="typing-text">AI助手思考中...</span>
        </div>
      </div>
      
      <div class="chat-input">
        <div class="input-actions">
          <el-upload
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            class="file-upload"
          >
            <el-button size="small" type="default">
              <el-icon><Plus /></el-icon> 上传文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                单个文件不超过100MB
              </div>
            </template>
          </el-upload>
          
          <el-tooltip content="上传拓扑图">
            <el-upload
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleImageChange"
              :accept="'.jpg,.jpeg,.png,.gif,.webp'"
              class="image-upload"
            >
              <el-button size="small" type="default">
                <el-icon><Picture /></el-icon>
              </el-button>
            </el-upload>
          </el-tooltip>
          
          <el-tooltip content="设备配置">
            <el-button size="small" type="default">
              <el-icon><Setting /></el-icon>
            </el-button>
          </el-tooltip>
          
          <el-tooltip content="日志分析">
            <el-button size="small" type="default" @click="openLogAnalysisDialog">
              <el-icon><Document /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
        
        <div class="file-list" v-if="selectedFiles.length > 0">
          <el-tag 
            v-for="(file, index) in selectedFiles" 
            :key="index"
            closable
            @close="removeFile(index)"
            class="file-tag"
            :class="{'image-tag': isImageFile(file)}"
          >
            <el-icon class="file-icon" v-if="!isImageFile(file)"><Document /></el-icon>
            <el-icon class="file-icon" v-else><Picture /></el-icon>
            {{ file.name }}
          </el-tag>
        </div>
        
        <div class="image-preview" v-if="hasImageFiles">
          <div 
            v-for="(file, index) in selectedFiles.filter(isImageFile)" 
            :key="index"
            class="image-preview-item"
          >
            <img :src="getFilePreviewUrl(file)" :alt="file.name" />
            <div class="image-preview-close" @click="removeFile(selectedFiles.indexOf(file))">
              <el-icon><Close /></el-icon>
            </div>
          </div>
        </div>
        
        <div class="input-area">
          <el-input
            v-model="messageInput"
            type="textarea"
            :rows="3"
            :placeholder="inputPlaceholder"
            @keydown.ctrl.enter="sendMessage"
            resize="none"
          />
          <div class="input-footer">
            <span class="input-tips">按 Ctrl+Enter 发送</span>
            <el-button
              type="primary"
              :disabled="!messageInput.trim() && selectedFiles.length === 0"
              @click="sendMessage"
              :loading="chatStore.isLoading"
            >
              发送 <el-icon class="el-icon--right"><ArrowRightBold /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-panel" v-if="showKnowledgePanel">
      <div class="panel-header">
        <h3>知识图谱资料</h3>
        <el-button type="text" @click="toggleKnowledgePanel">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      
      <div class="panel-content">
        <el-tabs type="card">
          <!-- 基础理论标签页 -->
          <el-tab-pane label="基础理论">
            <div class="panel-section">
              <div v-if="documentCategories['RFC'].length > 0">
                <el-card 
                  v-for="doc in documentCategories['RFC']" 
                  :key="doc.id" 
                  class="knowledge-card" 
                  shadow="hover"
                  :class="{'relevant-doc': doc._relevanceScore > 0, 'high-relevance-doc': doc._highRelevance}"
                >
                  <h4>{{ doc.title }}</h4>
                  <p>{{ doc.description || '提供学科基础理论知识和原理解释。' }}</p>
                  <p v-if="doc._blockInfo" class="block-info">
                    <el-icon><Document /></el-icon> {{ doc._blockInfo }}
                  </p>
                  <div class="card-footer">
                    <el-button type="primary" link @click="viewDocumentDetails(doc.id)">
                      查看详情
                    </el-button>
                    <el-button type="info" link @click="copyDocumentContent(doc.id)">
                      <el-icon><CopyDocument /></el-icon> 复制
                    </el-button>
                    <div class="tag-container">
                      <el-tag size="small" type="info">{{ doc.category || '基础理论' }}</el-tag>
                      <el-tag v-if="doc._relevanceScore > 0" size="small" type="success" class="relevance-tag">
                        <el-icon><Star /></el-icon> {{ doc._highRelevance ? '高相关' : '相关' }}
                      </el-tag>
                    </div>
                  </div>
                </el-card>
              </div>
              <el-empty v-else description="暂无基础理论资料" />
            </div>
          </el-tab-pane>
          
          <!-- 学习方法标签页 -->
          <el-tab-pane label="学习方法">
            <div class="panel-section">
              <div v-if="documentCategories['Configuration'].length > 0">
                <el-card 
                  v-for="doc in documentCategories['Configuration']" 
                  :key="doc.id" 
                  class="knowledge-card" 
                  shadow="hover"
                  :class="{'relevant-doc': doc._relevanceScore > 0, 'high-relevance-doc': doc._highRelevance}"
                >
                  <h4>{{ doc.title }}</h4>
                  <p>{{ doc.description || (doc.content ? doc.content.substring(0, 100) + '...' : '学习方法和策略指导。') }}</p>
                  <p v-if="doc._blockInfo" class="block-info">
                    <el-icon><Document /></el-icon> {{ doc._blockInfo }}
                  </p>
                  <div class="card-footer">
                    <el-button type="primary" link @click="viewDocumentDetails(doc.id)">
                      查看详情
                    </el-button>
                    <el-button type="info" link @click="copyDocumentContent(doc.id)">
                      <el-icon><CopyDocument /></el-icon> 复制
                    </el-button>
                    <div class="tag-container">
                      <el-tag size="small" type="success">{{ doc.category || '学习方法' }}</el-tag>
                      <el-tag v-if="doc._relevanceScore > 0" size="small" type="success" class="relevance-tag">
                        <el-icon><Star /></el-icon> {{ doc._highRelevance ? '高相关' : '相关' }}
                      </el-tag>
                    </div>
                  </div>
                </el-card>
              </div>
              <el-empty v-else description="暂无学习方法指导" />
            </div>
          </el-tab-pane>
          
          <!-- 学习诊断标签页 -->
          <el-tab-pane label="学习诊断">
            <div class="panel-section">
              <div v-if="documentCategories['Troubleshooting'].length > 0">
                <el-card 
                  v-for="doc in documentCategories['Troubleshooting']" 
                  :key="doc.id" 
                  class="knowledge-card" 
                  shadow="hover"
                  :class="{'relevant-doc': doc._relevanceScore > 0, 'high-relevance-doc': doc._highRelevance}"
                >
                  <h4>{{ doc.title }}</h4>
                  <p>{{ doc.description || (doc.content ? doc.content.substring(0, 100) + '...' : '') }}</p>
                  <p v-if="doc._blockInfo" class="block-info">
                    <el-icon><Document /></el-icon> {{ doc._blockInfo }}
                  </p>
                  <div class="card-footer">
                    <el-button type="primary" link @click="viewDocumentDetails(doc.id)">
                      查看详情
                    </el-button>
                    <el-button type="info" link @click="copyDocumentContent(doc.id)">
                      <el-icon><CopyDocument /></el-icon> 复制
                    </el-button>
                    <div class="tag-container">
                      <el-tag size="small" type="warning">{{ doc.category || '学习诊断' }}</el-tag>
                      <el-tag v-if="doc._relevanceScore > 0" size="small" type="success" class="relevance-tag">
                        <el-icon><Star /></el-icon> {{ doc._highRelevance ? '高相关' : '相关' }}
                      </el-tag>
                    </div>
                  </div>
                </el-card>
              </div>
              <el-empty v-else description="暂无学习诊断文档" />
            </div>
          </el-tab-pane>
          
          <!-- 案例分析标签页 -->
          <el-tab-pane label="案例分析">
            <div class="panel-section">
              <div v-if="documentCategories['Case'].length > 0">
                <el-card 
                  v-for="doc in documentCategories['Case']" 
                  :key="doc.id" 
                  class="knowledge-card" 
                  shadow="hover"
                  :class="{'relevant-doc': doc._relevanceScore > 0, 'high-relevance-doc': doc._highRelevance}"
                >
                  <h4>{{ doc.title }}</h4>
                  <p>{{ doc.description || (doc.content ? doc.content.substring(0, 100) + '...' : '') }}</p>
                  <p v-if="doc._blockInfo" class="block-info">
                    <el-icon><Document /></el-icon> {{ doc._blockInfo }}
                  </p>
                  <div class="card-footer">
                    <el-button type="primary" link @click="viewDocumentDetails(doc.id)">
                      查看详情
                    </el-button>
                    <el-button type="info" link @click="copyDocumentContent(doc.id)">
                      <el-icon><CopyDocument /></el-icon> 复制
                    </el-button>
                    <div class="tag-container">
                      <el-tag size="small" type="primary">{{ doc.category || '案例' }}</el-tag>
                      <el-tag v-if="doc._relevanceScore > 0" size="small" type="success" class="relevance-tag">
                        <el-icon><Star /></el-icon> {{ doc._highRelevance ? '高相关' : '相关' }}
                      </el-tag>
                    </div>
                  </div>
                </el-card>
              </div>
              <el-empty v-else description="暂无案例分析文档" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    
    <!-- 参考文献详情对话框 -->
    <el-dialog
      v-model="referenceDialogVisible"
      :title="currentReference ? (currentReference.blockCount > 1 ? 
             `参考文献详情 (${currentReference.blockCount}个相关片段)` : '参考文献详情') : '参考文献详情'"
      width="60%"
      class="reference-dialog"
      destroy-on-close
    >
      <div v-if="currentReference" class="reference-dialog-content">
        <div class="reference-header">
          <h3>{{ currentReference.title }}</h3>
          <el-tag 
            :type="currentReference.relevance >= 0.7 ? 'success' : currentReference.relevance >= 0.4 ? 'warning' : 'danger'"
            size="large"
          >
            相关度: {{ Math.round(currentReference.relevance * 100) }}%
          </el-tag>
        </div>
        
        <el-divider content-position="left">文档片段内容</el-divider>
        
        <div class="reference-content">
          <pre class="content-block">{{ currentReferenceMessage && currentReferenceMessage._fullContent && currentReferenceMessage._fullContent[currentReference.title] ? currentReferenceMessage._fullContent[currentReference.title] : '未找到文档内容...' }}</pre>
          <p class="reference-note">* 此内容为系统通过语义搜索找到的与您问题最相关的文档片段</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="referenceDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="feedbackDialogVisible"
      title="解决方案反馈"
      width="500px"
      :close-on-click-modal="false"
      class="feedback-dialog"
    >
      <el-form :model="feedbackForm" label-position="top">
        <el-form-item label="这个回答有帮助吗？">
          <el-radio-group v-model="feedbackForm.helpful">
            <el-radio :label="true">有帮助</el-radio>
            <el-radio :label="false">需要改进</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="feedbackForm.helpful" label="是否希望将此解决方案添加到知识库？">
          <el-switch v-model="feedbackForm.addToKnowledge" active-text="添加到知识库" />
        </el-form-item>
        
        <el-form-item v-if="feedbackForm.addToKnowledge" label="解决方案标题">
          <el-input v-model="feedbackForm.title" placeholder="请输入一个描述性的标题" />
        </el-form-item>
        
        <el-form-item v-if="feedbackForm.addToKnowledge" label="解决方案类别">
          <el-select v-model="feedbackForm.category" placeholder="选择类别">
            <el-option label="基础理论" value="Theory" />
            <el-option label="学习方法" value="Method" />
            <el-option label="认知诊断" value="Diagnosis" />
            <el-option label="案例分析" value="Case" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="反馈意见(可选)">
          <el-input 
            v-model="feedbackForm.comment" 
            type="textarea" 
            :rows="3" 
            placeholder="请提供更多反馈或改进建议..."
          />
        </el-form-item>
        
        <el-form-item v-if="feedbackForm.addToKnowledge">
          <div class="feedback-notice">
            <el-alert
              title="系统将保存最近三轮对话内容作为完整解决方案"
              type="info"
              :closable="false"
              show-icon
            >
              <p>这有助于更好地捕捉问题解决的完整过程，提高知识库质量。</p>
            </el-alert>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="feedbackDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitFeedback" :loading="submittingFeedback">
            提交反馈
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Log Analysis Dialog -->
    <el-dialog
      v-model="logAnalysisDialogVisible"
      title="网络日志分析"
      width="70%"
      class="log-analysis-dialog"
      destroy-on-close
      fullscreen
    >
      <div class="log-analysis-layout">
        <div class="log-analysis-container">
                          <p class="log-analysis-description">
                  输入学习过程中的记录信息（如学习日志、错误记录等），系统将通过AI分析识别学习困难点并提供改进建议。
                </p>
          
          <el-form :model="logAnalysisForm">
            <div class="form-row">
              <el-form-item label="设备类型" class="form-item-half">
                <el-select v-model="logAnalysisForm.deviceType" placeholder="选择设备类型">
                  <el-option label="华为设备" value="huawei" />
                  <el-option label="思科设备" value="cisco" />
                  <el-option label="其他设备" value="other" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="日志类型" class="form-item-half">
                <el-select v-model="logAnalysisForm.logType" placeholder="选择日志类型">
                                      <el-option label="学习错误日志" value="learning_error_log" />
                  <el-option label="学习进度记录" value="learning_progress" />
                  <el-option label="练习错误分析" value="exercise_analysis" />
                  <el-option label="其他记录" value="other" />
                </el-select>
              </el-form-item>
            </div>
            
            <el-form-item label="日志内容">
              <el-input
                v-model="logAnalysisForm.logContent"
                type="textarea"
                :rows="10"
                placeholder="粘贴学习记录或错误日志内容..."
              />
            </el-form-item>
            
            <el-form-item>
              <div class="log-analysis-upload">
                <span>或者</span>
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleLogFileChange"
                  accept=".txt,.log"
                >
                  <el-button size="small" type="primary" plain>
                    <el-icon><Upload /></el-icon> 上传日志文件
                  </el-button>
                </el-upload>
              </div>
            </el-form-item>
            
            <el-form-item>
              <div class="analysis-control-buttons">
                <el-button type="primary" @click="analyzeLog" :loading="analyzingLog" :disabled="!logAnalysisForm.logContent.trim()">
                  <el-icon><Search /></el-icon> 开始分析
                </el-button>
                <el-button @click="logAnalysisDialogVisible = false">取消</el-button>
              </div>
            </el-form-item>
          </el-form>
        </div>
        
        <div v-if="logAnalysisResult" class="log-analysis-result">
          <div class="result-header">
            <el-divider content-position="left"><span class="divider-title">分析结果</span></el-divider>
            
            <el-alert
              v-if="logAnalysisResult.severity === 'critical'"
              title="检测到严重问题"
              type="error"
              :closable="false"
              show-icon
            />
            <el-alert
              v-else-if="logAnalysisResult.severity === 'warning'"
              title="检测到潜在问题"
              type="warning"
              :closable="false"
              show-icon
            />
            <el-alert
              v-else-if="logAnalysisResult.severity === 'info'"
              title="网络状态正常"
              type="success"
              :closable="false"
              show-icon
            />
            
            <div class="analysis-summary">
              <h3>问题摘要</h3>
              <div class="summary-content">{{ logAnalysisResult.summary }}</div>
            </div>
          </div>
          
          <div class="result-content-wrapper">
            <div v-if="logAnalysisResult.issues && logAnalysisResult.issues.length > 0" class="analysis-issues">
              <h3>发现的问题</h3>
              <el-collapse accordion>
                <el-collapse-item 
                  v-for="(issue, idx) in logAnalysisResult.issues" 
                  :key="idx"
                  :title="issue.title"
                  :name="idx"
                >
                  <div class="issue-details">
                    <el-card class="issue-card" shadow="hover">
                      <template #header>
                        <div class="issue-header">
                          <span class="issue-title">问题详情</span>
                        </div>
                      </template>
                      <p class="issue-description">{{ issue.description }}</p>
                      
                      <el-divider content-position="left">
                        <el-icon><Warning /></el-icon> 可能的根因
                      </el-divider>
                      <p class="root-cause">{{ issue.rootCause }}</p>
                      
                      <el-divider content-position="left">
                        <el-icon><SetUp /></el-icon> 修复建议
                      </el-divider>
                      <div class="fix-suggestions">
                        <div v-if="issue.commands && issue.commands.length > 0" class="fix-commands">
                          <h4 class="section-title">推荐配置命令</h4>
                          <div class="command-list">
                            <el-card
                              v-for="(cmd, cmdIdx) in issue.commands"
                              :key="cmdIdx"
                              class="command-card"
                              shadow="hover"
                            >
                              <div class="command-content">
                                <pre>{{ cmd }}</pre>
                                <el-button size="small" type="primary" @click="copyToClipboard(cmd)" class="copy-button">
                                  <el-icon><CopyDocument /></el-icon> 复制
                                </el-button>
                              </div>
                            </el-card>
                          </div>
                        </div>
                        <div class="fix-explanation">
                          <h4 class="section-title">解决方案说明</h4>
                          <p>{{ issue.solution }}</p>
                        </div>
                      </div>
                      
                      <el-divider content-position="left">
                        <el-icon><Check /></el-icon> 验证方法
                      </el-divider>
                      <div class="verification-steps">
                        <p>{{ issue.verification }}</p>
                        <div v-if="issue.verificationCommands && issue.verificationCommands.length > 0" class="verification-commands">
                          <h4 class="section-title">验证命令</h4>
                          <div class="command-list">
                            <el-card
                              v-for="(cmd, cmdIdx) in issue.verificationCommands"
                              :key="cmdIdx"
                              class="command-card"
                              shadow="hover"
                            >
                              <div class="command-content">
                                <pre>{{ cmd }}</pre>
                                <el-button size="small" type="primary" @click="copyToClipboard(cmd)" class="copy-button">
                                  <el-icon><CopyDocument /></el-icon> 复制
                                </el-button>
                              </div>
                            </el-card>
                          </div>
                        </div>
                      </div>
                    </el-card>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
            
            <div v-if="logAnalysisResult.rawDetails" class="raw-analysis">
              <el-collapse>
                <el-collapse-item title="完整分析详情" name="1">
                  <div class="raw-details-wrapper">
                    <pre>{{ logAnalysisResult.rawDetails }}</pre>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
          
          <div class="analysis-actions">
            <el-button type="primary" @click="sendAnalysisToChat">
              <el-icon><ChatLineRound /></el-icon> 发送到聊天窗口
            </el-button>
            <el-button type="default" @click="downloadAnalysisReport">
              <el-icon><Download /></el-icon> 下载分析报告
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { 
  Plus, Document, Picture, Download, Delete, 
  User, ChatLineRound, Setting, ArrowRightBold,
  CopyDocument, Star, QuestionFilled, Close,
  Upload, Search, Warning, SetUp, Check
} from '@element-plus/icons-vue'
import { useChatStore } from '../stores/chatStore'
import { useKnowledgeStore } from '../stores/knowledgeStore'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { ElDialog, ElDivider } from 'element-plus'
import logAnalysisService from '../services/logAnalysisService'

const chatStore = useChatStore()
const knowledgeStore = useKnowledgeStore()
const messageInput = ref('')
const selectedFiles = ref([])
const messagesContainer = ref(null)
const showKnowledgePanel = ref(true)
const selectionMode = ref(false)
const selectedConversations = ref([])

const inputPlaceholder = computed(() => {
  if (chatStore.isLoading) {
    return 'AI学习助手正在思考中...'
  }
  return '描述您的学习需求或目标（如：评估我的数学基础，制定微积分学习路径）'
})

// Initialize marked with syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true
})

// Initialize chat if empty
onMounted(async () => {
  // 从IndexedDB加载对话
  await chatStore.initialize()
  
  // 加载知识库文档
  await knowledgeStore.getAdminDocuments()
  
  // 分类知识库文档
  categorizeDocuments()
  
  // Scroll to bottom whenever messages change
  watch(() => chatStore.currentConversation.messages.length, () => {
    scrollToBottom()
  })
  
  // 页面加载完成后滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
})

function formatMessage(content) {
  return marked(content)
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString()
}

function formatFullDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  })
}

function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit'
  })
}

function getFirstMessageTime(conversation) {
  if (conversation.messages && conversation.messages.length > 0) {
    return conversation.messages[0].timestamp
  }
  return null
}

function getConversationPreview(conversation) {
  if (conversation.messages && conversation.messages.length > 0) {
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    // 获取第一行或者截取前20个字符
    let preview = lastMessage.content.split('\n')[0]
    return preview.length > 30 ? preview.substring(0, 30) + '...' : preview
  }
  return '空对话'
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      console.log('滚动到页面底部')
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      
      // 确保在任何动态内容加载后仍然滚动到底部
      setTimeout(() => {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }, 100)
    }
  })
}

function startNewChat() {
  chatStore.startNewConversation()
  messageInput.value = ''
  selectedFiles.value = []
}

function selectConversation(conversation) {
  chatStore.currentConversation = conversation
}

function handleFileChange(file) {
  console.log('File upload:', file);
  
  // Check file size (100MB limit)
  const maxSize = 100 * 1024 * 1024; // 100MB in bytes
  if (file.size > maxSize) {
    ElMessage.error(`文件大小超过限制，最大允许 100MB`);
    return false;
  }
  
  selectedFiles.value.push(file);
  ElMessage.success(`文件 "${file.name}" 已添加`);
}

function removeFile(index) {
  selectedFiles.value.splice(index, 1)
}

function usePrompt(prompt) {
  messageInput.value = prompt
}

function toggleKnowledgePanel() {
  showKnowledgePanel.value = !showKnowledgePanel.value
  
  // 当面板打开时，更新相关文档
  if (showKnowledgePanel.value && chatStore.currentConversation.messages.length > 0) {
    updateRelatedDocuments(chatStore.currentConversation.messages)
  }
}

function getRelevanceColor(relevance, belowThreshold, hasMultipleBlocks) {
  if (belowThreshold) return '#F56C6C';  // 低于阈值 - 红色
  
  // 有多个块被检索的文档使用更亮的颜色
  if (hasMultipleBlocks) {
    if (relevance >= 0.85) return '#55B543'; // 高相关加强 - 亮绿色
    if (relevance >= 0.7) return '#3399FF';  // 中高相关加强 - 亮蓝色
    if (relevance >= 0.4) return '#FFAA00';  // 中等相关加强 - 亮黄色
  }
  
  // 普通文档颜色
  if (relevance >= 0.85) return '#67C23A'; // 高相关 - 绿色
  if (relevance >= 0.7) return '#409EFF';  // 中高相关 - 蓝色
  if (relevance >= 0.4) return '#E6A23C';  // 中等相关 - 黄色
  return '#F56C6C';  // 低相关 - 红色
}

async function sendMessage() {
  if (messageInput.value.trim() || selectedFiles.value.length > 0) {
    try {
      // 保存当前输入内容
      const currentMessage = messageInput.value;
      const currentFiles = [...selectedFiles.value];
      
      // 立即清空输入框和文件列表 - 在发送请求前
      messageInput.value = '';
      const filesToClear = [...selectedFiles.value];
      selectedFiles.value = [];
      
      // 释放blob URLs以避免内存泄漏
      filesToClear.forEach(file => {
        if (file.url && typeof file.url === 'string' && file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url);
        }
      });
      
      console.log('输入框已立即重置为默认状态');
      
      // 处理文件为可发送的格式
      const files = await Promise.all(currentFiles.map(async (file) => {
        // 确保有raw对象
        const rawFile = file.raw || file;
        
        // 处理图片文件 - 预先转换为base64以避免后期处理问题
        let base64Data = null;
        if (rawFile.type && rawFile.type.startsWith('image/')) {
          try {
            base64Data = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = (e) => reject(e);
              reader.readAsDataURL(rawFile);
            });
            console.log('成功转换图片为base64，长度:', base64Data.length);
          } catch (err) {
            console.error('图片base64转换失败:', err);
          }
        }
        
        // 创建文件对象
        return {
          name: file.name,
          type: rawFile.type || 'application/octet-stream',
          size: rawFile.size,
          raw: rawFile,  // 保留原始文件对象
          url: base64Data || URL.createObjectURL(rawFile),  // 优先使用base64数据
          isBase64: !!base64Data  // 标记是否已经是base64数据
        };
      }));
      
      console.log('发送文件:', files.map(f => ({
        name: f.name, 
        type: f.type,
        isImage: f.type.startsWith('image/'),
        isBase64: f.isBase64,
        urlLength: f.url ? f.url.length : 0
      })));
      
      // 发送消息到聊天store
      await chatStore.sendMessage(currentMessage, files);
      
      // 滚动到底部查看最新消息
      scrollToBottom();
      
    } catch (error) {
      console.error('处理消息时出错:', error);
      ElMessage.error('发送消息失败');
    }
  }
}

// 计算属性：判断当前会话是否有消息
const hasMessages = computed(() => {
  return chatStore.currentConversation && 
         chatStore.currentConversation.messages && 
         chatStore.currentConversation.messages.length > 0
})

// 导出当前会话
function exportConversation() {
  if (!hasMessages.value) {
    ElMessage.warning('当前没有会话内容可导出')
    return
  }
  
  try {
    const result = chatStore.exportCurrentConversation()
    if (result) {
      ElMessage.success('会话导出成功')
    } else {
      ElMessage.warning('没有内容可导出')
    }
  } catch (error) {
    console.error('导出会话失败:', error)
    ElMessage.error('导出会话失败')
  }
}

// 确认清空当前会话
function confirmClearConversation() {
  if (!hasMessages.value) {
    ElMessage.warning('当前会话已经是空的')
    return
  }
  
  ElMessageBox.confirm(
    '确定要清空当前会话吗？此操作不可恢复。',
    '清空会话',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    chatStore.clearCurrentConversation()
    ElMessage.success('会话已清空')
  }).catch(() => {
    // 用户取消操作，不执行任何动作
  })
}

// 确认删除对话
function confirmDeleteConversation(conversation) {
  ElMessageBox.confirm(
    `确定要删除会话 "${getConversationPreview(conversation)}" 吗？此操作不可恢复。`,
    '删除会话',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await chatStore.deleteConversation(conversation.id)
    ElMessage.success('会话已删除')
  }).catch(() => {
    // 用户取消操作，不执行任何动作
  })
}

// 参考文献内容查看
const referenceDialogVisible = ref(false)
const currentReference = ref(null)
const currentReferenceMessage = ref(null)

// 显示参考文献详细内容
function showReferenceContent(message, reference) {
  currentReference.value = reference
  currentReferenceMessage.value = message
  referenceDialogVisible.value = true
  
  // 输出到控制台，便于调试
  console.log('点击查看参考文献:', reference.title, '相关度:', (reference.relevance * 100).toFixed(2) + '%')
  
  if (message._fullContent && message._fullContent[reference.title]) {
    console.log('参考文献内容:', message._fullContent[reference.title])
  } else {
    console.log('未找到参考文献完整内容')
  }
}

// 处理图片上传
function handleImageChange(file) {
  // 输出图片信息用于调试
  console.log('Image upload:', file);
  console.log('Raw image object:', file.raw);
  
  // 检查文件大小 (10MB limit for images)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    ElMessage.error(`图片大小超过限制，最大允许 10MB`);
    return false;
  }
  
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!file.raw || !file.raw.type || !allowedTypes.includes(file.raw.type)) {
    ElMessage.error(`不支持的图片格式，请上传 JPG、PNG、GIF 或 WebP 格式`);
    return false;
  }
  
  selectedFiles.value.push(file);
  
  // 创建预览图
  previewImage(file);
  
  // 显示成功消息
  ElMessage.success(`图片 "${file.name}" 已添加`);
  
  // 记录当前选择的所有文件
  console.log('Current selected files:', selectedFiles.value.map(f => ({
    name: f.name,
    type: f.raw ? f.raw.type : 'unknown',
    size: f.size
  })));
}

// 判断文件是否为图片
function isImageFile(file) {
  return file && file.raw && file.raw.type && file.raw.type.startsWith('image/');
}

// 获取文件预览URL
function getFilePreviewUrl(file) {
  if (file.url) return file.url;
  if (file.raw) return URL.createObjectURL(file.raw);
  return null;
}

// 创建图片预览
function previewImage(file) {
  if (!isImageFile(file)) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    file.url = e.target.result;
  };
  reader.readAsDataURL(file.raw);
}

// 计算属性：是否有图片文件
const hasImageFiles = computed(() => {
  return selectedFiles.value.some(isImageFile);
});

// 知识库文档分类
const documentCategories = ref({
  'RFC': [],
  'Configuration': [], // 学习方法
  'Troubleshooting': [], // 认知诊断
  'Case': [] // 案例分析
})

// 将知识库文档分类
function categorizeDocuments(sortByRelevance = false) {
  // 清空现有分类
  Object.keys(documentCategories.value).forEach(key => {
    documentCategories.value[key] = []
  })
  
  // 获取要分类的文档
  let docsToCategories = [...knowledgeStore.adminDocuments]
  
  // 如果需要按相关性排序
  if (sortByRelevance) {
    docsToCategories.sort((a, b) => {
      return (b._relevanceScore || 0) - (a._relevanceScore || 0)
    })
  }
  
  // 类型和分类的映射表
  const typeMap = {
    // 类型映射
    'theory': 'RFC',
    'method': 'Configuration',
    'diagnosis': 'Troubleshooting',
    'case': 'Case',
    
    // 分类映射
    'math': 'RFC',
    'programming': 'Configuration',
    'science': 'RFC',
    'language': 'RFC',
    'learning-strategy': 'Configuration',
    'cognitive-psychology': 'Troubleshooting',
    'education-method': 'Configuration'
  };
  
  // 遍历知识库文档进行分类
  docsToCategories.forEach(doc => {
    // 输出原始分类信息
    console.log(`分类文档: "${doc.title}", 原始类型: ${doc.type || '无'}, 原始分类: ${doc.category || '无'}`);
    
    // 直接根据type和category进行分类
    let category = null;
    
    // 1. 首先尝试根据类型进行匹配
    if (doc.type && typeMap[doc.type.toLowerCase()]) {
      category = typeMap[doc.type.toLowerCase()];
      console.log(`  => 根据类型 ${doc.type} 映射为: ${category}`);
    }
    // 2. 如果类型没有匹配上，则尝试根据分类进行匹配
    else if (doc.category && typeMap[doc.category.toLowerCase()]) {
      category = typeMap[doc.category.toLowerCase()];
      console.log(`  => 根据分类 ${doc.category} 映射为: ${category}`);
    }
    // 3. 如果仍无法匹配，尝试通过标题关键词匹配
    else if (doc.title) {
      if (doc.title.includes('理论') || doc.title.includes('基础') || doc.title.includes('数学') || doc.title.includes('科学') || doc.title.includes('语言')) {
        category = 'RFC';
        console.log(`  => 根据标题关键词"理论/基础"映射为: 基础理论`);
      } else if (doc.title.includes('方法') || doc.title.includes('策略') || doc.title.includes('技巧') || doc.title.includes('编程')) {
        category = 'Configuration';
        console.log(`  => 根据标题关键词"方法/策略"映射为: 学习方法`);
      } else if (doc.title.includes('诊断') || doc.title.includes('认知') || doc.title.includes('心理') || doc.title.includes('评估')) {
        category = 'Troubleshooting';
        console.log(`  => 根据标题关键词"诊断/认知"映射为: 认知诊断`);
      } else if (doc.title.includes('案例') || doc.title.includes('分析')) {
        category = 'Case';
        console.log(`  => 根据标题关键词"案例/分析"映射为: 案例分析`);
      }
    }
    
    // 为文档添加块信息描述（如果存在）
    if (doc._relevantBlocks > 0 && doc._totalBlocks > 0) {
      doc._blockInfo = `包含 ${doc._relevantBlocks}/${doc._totalBlocks} 个相关文本块`;
      
      // 如果相关块比例大于50%，添加高相关标记
      if (doc._relevantBlocks / doc._totalBlocks > 0.5) {
        doc._highRelevance = true;
      }
    }
    
    // 根据确定的分类将文档添加到相应类别
    if (category === 'RFC') {
      documentCategories.value['RFC'].push(doc);
      console.log(`  => 最终分类为: 基础理论`);
    } else if (category === 'Configuration') {
      documentCategories.value['Configuration'].push(doc);
      console.log(`  => 最终分类为: 学习方法`);
    } else if (category === 'Troubleshooting') {
      documentCategories.value['Troubleshooting'].push(doc);
      console.log(`  => 最终分类为: 认知诊断`);
    } else if (category === 'Case') {
      documentCategories.value['Case'].push(doc);
      console.log(`  => 最终分类为: 案例分析`);
    } else {
      // 如果仍然无法分类，根据ID平均分配
      console.log(`  => 无法确定分类，根据ID进行平均分配`);
      const index = (typeof doc.id === 'number' ? doc.id : 0) % 4;
      if (index === 0) {
        documentCategories.value['RFC'].push(doc);
        console.log(`  => 无法分类，平均分配到: 基础理论`);
      } else if (index === 1) {
        documentCategories.value['Configuration'].push(doc);
        console.log(`  => 无法分类，平均分配到: 学习方法`);
      } else if (index === 2) {
        documentCategories.value['Troubleshooting'].push(doc);
        console.log(`  => 无法分类，平均分配到: 认知诊断`);
      } else {
        documentCategories.value['Case'].push(doc);
        console.log(`  => 无法分类，平均分配到: 案例分析`);
      }
    }
  })
  
  // 记录文档数量
  console.log('知识库文档分类完成:', 
    Object.keys(documentCategories.value).map(key => 
      `${key}: ${documentCategories.value[key].length}篇`).join(', '))
}

// 查看文档详情
async function viewDocumentDetails(documentId) {
  try {
    const doc = await knowledgeStore.getDocumentContent(documentId)
    
    if (doc && doc.content) {
      // Format document content for display
      const contentPreview = doc.content.length > 800 
        ? doc.content.substring(0, 800) + '...' 
        : doc.content
        
      ElMessageBox.alert(
        `<div class="document-detail-container">
          <div class="document-detail-header">
            <h2>${doc.title}</h2>
            <div class="document-meta">
              <span><strong>类型:</strong> ${doc.type || '未指定'}</span>
              <span><strong>分类:</strong> ${doc.category || '未分类'}</span>
              <span><strong>上传日期:</strong> ${doc.uploadDate || '未知'}</span>
              <span><strong>文件大小:</strong> ${doc.size || '未知'}</span>
            </div>
          </div>
          <div class="document-description">
            <h3>描述</h3>
            <p>${doc.description || '无描述'}</p>
          </div>
          <div class="document-content">
            <h3>内容</h3>
            <div class="content-text">${contentPreview.replace(/\n/g, '<br>')}</div>
          </div>
        </div>`,
        '文档详情',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '关闭',
          customClass: 'wide-document-dialog'
        }
      )
    } else {
      ElMessage.warning('文档内容为空或未找到')
    }
  } catch (error) {
    console.error('加载文档内容失败:', error)
    ElMessage.error('无法加载文档内容')
  }
}

// 按相关性对知识库文档进行排序和推荐
const relatedDocuments = ref([])

// 每当当前对话变化时，更新相关文档
watch(() => chatStore.currentConversation.messages, async (newMessages) => {
  if (newMessages.length > 0) {
    await updateRelatedDocuments(newMessages)
  }
}, { deep: true })

// 更新相关文档
async function updateRelatedDocuments(messages) {
  if (!showKnowledgePanel.value) return
  
  // 提取用户最近三条消息
  const recentUserMessages = messages
    .filter(msg => msg.sender === 'user')
    .slice(-3)
    .map(msg => msg.content)
    .join(' ')
  
  if (!recentUserMessages) return
  
  console.log('更新相关文档，基于用户最近对话:', recentUserMessages.substring(0, 50) + '...')
  
  try {
    // 实现混合检索算法（BM25 + 向量相似度）
    const hybridRanking = (docs, query) => {
      // 1. 对查询进行分词处理
      const queryWords = query.toLowerCase()
        .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 1)
      
      // 2. 计算每个文档的BM25分数
      let avgDocLength = docs.reduce((sum, doc) => 
        sum + (doc.content ? doc.content.length : 0), 0) / docs.length;
      
      const k1 = 1.5;  // BM25参数 - 词频缩放
      const b = 0.75;  // BM25参数 - 文档长度归一化
      
      docs.forEach(doc => {
        if (!doc.content) {
          doc._bm25Score = 0;
          return;
        }
        
        // 计算BM25分数
        let bm25Score = 0;
        const docLength = doc.content.length;
        
        queryWords.forEach(word => {
          // 计算词频 (TF)
          const wordFreq = (doc.content.toLowerCase().match(new RegExp(word, 'g')) || []).length;
          
          // 计算文档频率 (DF)
          const docFreq = docs.filter(d => 
            d.content && d.content.toLowerCase().includes(word)).length;
          
          // 计算逆文档频率 (IDF)
          const idf = Math.log((docs.length - docFreq + 0.5) / (docFreq + 0.5) + 1);
          
          // BM25计算公式
          const tf = (wordFreq * (k1 + 1)) / 
            (wordFreq + k1 * (1 - b + b * (docLength / avgDocLength)));
          
          bm25Score += idf * tf;
        });
        
        // 标题和类别额外得分
        queryWords.forEach(word => {
          if (doc.title && doc.title.toLowerCase().includes(word)) {
            bm25Score += 2.0; // 标题匹配加权
          }
          if (doc.category && doc.category.toLowerCase().includes(word)) {
            bm25Score += 1.5; // 类别匹配加权
          }
        });
        
        // 存储BM25分数
        doc._bm25Score = bm25Score;
      });
      
      // 3. 模拟向量相似度分数（在实际应用中，这里会调用向量数据库进行检索）
      docs.forEach(doc => {
        if (!doc.content) {
          doc._vectorScore = 0;
          doc._relevantBlocks = 0;
          doc._totalBlocks = 0;
          return;
        }
        
        // 模拟向量相似度计算（cosine similarity）
        let vectorScore = 0;
        
        // 基于关键词共现的简化向量相似度模拟
        const docWords = doc.content.toLowerCase()
          .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 1);
        
        // 计算查询和文档的词汇重叠度
        const overlap = queryWords.filter(word => docWords.includes(word)).length;
        const queryLen = Math.sqrt(queryWords.length);
        const docLen = Math.sqrt(docWords.length || 1);
        
        // 模拟cosine相似度
        vectorScore = overlap / (queryLen * docLen + 0.001);
        
        // 存储向量相似度分数
        doc._vectorScore = vectorScore;
        
        // 计算文档中包含的相关向量块数量（简化模拟）
        const blockSize = 200; // 假设每200个字符为一个块
        let blockCount = 0;
        let relevantBlocks = 0;
        
        // 将文档分块
        const blocks = [];
        for (let i = 0; i < doc.content.length; i += blockSize) {
          blocks.push(doc.content.substr(i, blockSize));
          blockCount++;
        }
        
        // 计算每个块的相关性
        blocks.forEach(block => {
          const blockWords = block.toLowerCase()
            .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1);
          
          const blockOverlap = queryWords.filter(word => blockWords.includes(word)).length;
          if (blockOverlap > 0) {
            relevantBlocks++;
          }
        });
        
        // 存储相关块数量
        doc._relevantBlocks = relevantBlocks;
        doc._totalBlocks = blockCount;
      });
      
      // 4. 混合排名计算 (BM25 + 向量相似度 + 块权重)
      docs.forEach(doc => {
        // 归一化BM25分数和向量分数（0-1范围）
        const maxBM25 = Math.max(...docs.map(d => d._bm25Score || 0));
        const maxVector = Math.max(...docs.map(d => d._vectorScore || 0));
        
        const normBM25 = maxBM25 > 0 ? (doc._bm25Score || 0) / maxBM25 : 0;
        const normVector = maxVector > 0 ? (doc._vectorScore || 0) / maxVector : 0;
        
        // 块相关性权重因子（文档中相关块越多，权重越高）
        const blockWeight = doc._totalBlocks > 0 ? 
          (doc._relevantBlocks / doc._totalBlocks) * 0.5 + 0.5 : 0.5;
        
        // 最终混合得分（可调整权重）
        // BM25权重0.4，向量相似度权重0.6，再乘以块权重因子
        const hybridScore = (normBM25 * 0.4 + normVector * 0.6) * blockWeight;
        
        // 存储最终混合得分
        doc._relevanceScore = hybridScore;
        
        // 调试输出
        if (hybridScore > 0) {
          console.log(`文档 "${doc.title}" 评分: BM25=${normBM25.toFixed(3)}, 向量=${normVector.toFixed(3)}, 块=${doc._relevantBlocks}/${doc._totalBlocks}, 最终=${hybridScore.toFixed(3)}`);
        }
      });
      
      return docs;
    };
    
    // 应用混合排序
    const rankedDocs = hybridRanking([...knowledgeStore.adminDocuments], recentUserMessages);
    
    // 更新文档分类（保持原有顺序但增加相关度分数）
    knowledgeStore.adminDocuments.forEach(doc => {
      const rankedDoc = rankedDocs.find(d => d.id === doc.id);
      if (rankedDoc) {
        doc._relevanceScore = rankedDoc._relevanceScore || 0;
        doc._relevantBlocks = rankedDoc._relevantBlocks || 0;
        doc._totalBlocks = rankedDoc._totalBlocks || 0;
      }
    });
    
    // 按相关性排序并重新分类
    await categorizeDocuments(true);
    
    console.log('已更新知识面板的相关文档 (混合检索算法)');
  } catch (error) {
    console.error('更新相关文档失败:', error);
  }
}

function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) {
    // Clear all selections when exiting selection mode
    chatStore.conversations.forEach(conv => conv.selected = false)
    selectedConversations.value = []
  }
}

function toggleConversationSelection(conversation) {
  conversation.selected = !conversation.selected
  updateSelectedConversations()
}

function updateSelectedConversations() {
  selectedConversations.value = chatStore.conversations
    .filter(conv => conv.selected)
    .map(conv => conv.id)
}

function confirmDeleteSelected() {
  if (selectedConversations.value.length === 0) {
    ElMessage.warning('没有选择要删除的会话')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedConversations.value.length} 个会话吗？此操作不可恢复。`,
    '批量删除会话',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      for (const conversationId of selectedConversations.value) {
        await chatStore.deleteConversation(conversationId)
      }
      ElMessage.success(`已删除 ${selectedConversations.value.length} 个会话`)
      toggleSelectionMode() // Exit selection mode after deletion
    } catch (error) {
      console.error('批量删除会话失败:', error)
      ElMessage.error('删除会话时发生错误，请重试')
    }
  }).catch(() => {
    // User canceled, do nothing
  })
}

const feedbackDialogVisible = ref(false)
const feedbackForm = ref({
  helpful: true,
  addToKnowledge: false,
  title: '',
  category: 'Configuration',
  comment: ''
})
const submittingFeedback = ref(false)

function openFeedbackDialog(message) {
  // 设置当前反馈的消息
  currentFeedbackMessage.value = message
  
  // 生成标题建议（基于用户问题）
  let suggestedTitle = ''
  const messageIndex = chatStore.currentConversation.messages.findIndex(m => m.id === message.id)
  if (messageIndex > 0) {
    const prevMessage = chatStore.currentConversation.messages[messageIndex - 1]
    if (prevMessage.sender === 'user') {
      // 从用户问题中提取标题
      suggestedTitle = prevMessage.content
        .split(/[.?!。？！]/)[0] // 取第一句
        .trim()
        .substring(0, 40) // 限制长度
      
      if (suggestedTitle.length >= 40) {
        suggestedTitle += '...'
      }
    }
  }
  
  // 重置表单
  feedbackForm.value = {
    helpful: true,
    addToKnowledge: false,
    title: suggestedTitle,
    category: 'Troubleshooting',
    comment: ''
  }
  
  // 显示对话框
  feedbackDialogVisible.value = true
}

async function submitFeedback() {
  if (feedbackForm.value.addToKnowledge && !feedbackForm.value.title) {
    ElMessage.error('请为解决方案提供一个标题')
    return
  }
  
  submittingFeedback.value = true
  try {
    // 获取当前反馈的消息
    const message = currentFeedbackMessage.value
    if (!message) {
      ElMessage.error('无法找到消息')
      return
    }
    
    // 找到相关的用户问题
    let userMessage = null
    const messageIndex = chatStore.currentConversation.messages.findIndex(m => m.id === message.id)
    if (messageIndex > 0) {
      // 通常用户消息会在AI回答之前
      const prevMessage = chatStore.currentConversation.messages[messageIndex - 1]
      if (prevMessage.sender === 'user') {
        userMessage = prevMessage
      }
    }
    
    // 提交反馈到store
    const result = await chatStore.submitFeedback(feedbackForm.value, message, userMessage)
    
    if (result) {
      ElMessage.success(
        feedbackForm.value.addToKnowledge 
          ? '感谢您的反馈！解决方案已添加到知识库' 
          : '感谢您的反馈！'
      )
      feedbackDialogVisible.value = false
      
      // 如果添加到知识库，显示成功提示
      if (feedbackForm.value.addToKnowledge) {
        ElNotification({
          title: '解决方案已添加到知识库',
          message: `您的反馈帮助我们改进了系统。标题：${feedbackForm.value.title}`,
          type: 'success',
          duration: 5000
        })
      }
    } else {
      ElMessage.error('提交反馈失败，请稍后再试')
    }
  } catch (error) {
    console.error('提交反馈时出错:', error)
    ElMessage.error('提交反馈出错')
  } finally {
    submittingFeedback.value = false
  }
}

// 当前正在反馈的消息
const currentFeedbackMessage = ref(null)

// Log Analysis Dialog
const logAnalysisDialogVisible = ref(false)
const logAnalysisForm = ref({
  deviceType: 'huawei',
        logType: 'learning_error_log',
  logContent: ''
})
const logAnalysisResult = ref(null)
const analyzingLog = ref(false)

function openLogAnalysisDialog() {
  // 重置表单和结果
  logAnalysisForm.value = {
    deviceType: 'huawei',
    logType: 'learning_error_log',
    logContent: ''
  };
  logAnalysisResult.value = null;
  logAnalysisDialogVisible.value = true;
}

function handleLogFileChange(file) {
  if (!file) {
    ElMessage.error('文件上传失败，请重试');
    return;
  }
  
  console.log('Log file upload:', file);
  
  // 检查文件大小 (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error(`文件大小超过限制，最大允许 10MB`);
    return;
  }

  // 读取文件内容
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      logAnalysisForm.value.logContent = content;
      ElMessage.success(`日志文件 "${file.name}" 已加载，可以开始分析`);
    } catch (error) {
      console.error('读取日志文件失败:', error);
      ElMessage.error(`无法读取日志文件，请检查文件格式`);
    }
  };
  
  reader.onerror = (error) => {
    console.error('读取日志文件出错:', error);
    ElMessage.error(`读取日志文件失败，请重试`);
  };
  
  reader.readAsText(file.raw || file);
}

async function analyzeLog() {
  if (!logAnalysisForm.value.logContent.trim()) {
    ElMessage.warning('请输入或上传日志内容');
    return;
  }
  
  try {
    analyzingLog.value = true;
    
    // 在控制台显示分析信息，便于调试
    console.log('正在分析日志...');
    console.log('设备类型:', logAnalysisForm.value.deviceType);
    console.log('日志类型:', logAnalysisForm.value.logType);
    
    // 调用日志分析服务
    const result = await logAnalysisService.analyzeNetworkLog(logAnalysisForm.value);
    
    // 更新分析结果
    logAnalysisResult.value = result;
    
    console.log('日志分析完成:', result);
    
    // 显示成功消息
    ElMessage.success('日志分析完成');
  } catch (error) {
    console.error('日志分析失败:', error);
    ElMessage.error('日志分析失败: ' + (error.message || '未知错误'));
  } finally {
    analyzingLog.value = false;
  }
}

function copyToClipboard(text) {
  try {
    navigator.clipboard.writeText(text);
    ElMessage.success('已复制到剪贴板');
  } catch (error) {
    console.error('复制到剪贴板失败:', error);
    ElMessage.error('复制失败，请手动复制');
    
    // 创建一个临时文本区域
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      ElMessage.success('已复制到剪贴板');
    } catch (err) {
      console.error('fallback复制方法失败:', err);
      ElMessage.error('复制失败，请手动复制');
    }
    
    document.body.removeChild(textArea);
  }
}

function sendAnalysisToChat() {
  if (!logAnalysisResult.value) {
    ElMessage.warning('没有分析结果可发送');
    return;
  }
  
  try {
    // 将分析结果转换为Markdown格式
    const markdown = logAnalysisService.formatAnalysisToMarkdown(logAnalysisResult.value);
    
    // 设置消息内容
    messageInput.value = markdown;
    
    // 关闭对话框
    logAnalysisDialogVisible.value = false;
    
    // 显示成功消息
    ElMessage.success('分析结果已添加到输入框，可以发送到聊天窗口');
    
    // 聚焦输入框
    nextTick(() => {
      // 如果需要自动发送，可以调用sendMessage()
      // 这里先不自动发送，让用户确认后发送
      // sendMessage();
    });
  } catch (error) {
    console.error('发送分析结果到聊天失败:', error);
    ElMessage.error('发送分析结果失败');
  }
}

function downloadAnalysisReport() {
  if (!logAnalysisResult.value) {
    ElMessage.warning('没有分析结果可下载');
    return;
  }
  
  try {
    // 将分析结果转换为Markdown格式
    const markdown = logAnalysisService.formatAnalysisToMarkdown(logAnalysisResult.value);
    
    // 创建Blob对象
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `网络日志分析报告_${new Date().toISOString().slice(0, 10)}.md`;
    
    // 添加到文档并点击
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    
    ElMessage.success('分析报告已下载');
  } catch (error) {
    console.error('下载分析报告失败:', error);
    ElMessage.error('下载分析报告失败');
  }
}

// 知识库文档复制功能
async function copyDocumentContent(docId) {
  try {
    if (!docId) {
      ElMessage.error('文档ID无效，无法复制');
      return;
    }
    
    // 获取文档内容
    const doc = await knowledgeStore.getDocumentContent(docId);
    
    if (!doc || !doc.content) {
      ElMessage.warning('文档内容为空或未找到');
      return;
    }
    
    // 调用复制函数复制内容
    copyToClipboard(doc.content);
    
    // 提示成功
    ElMessage.success(`文档 "${doc.title}" 的内容已复制到剪贴板`);
  } catch (error) {
    console.error('复制文档内容失败:', error);
    ElMessage.error('复制文档内容失败');
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: calc(100vh - 60px);
  background-color: var(--el-bg-color-page);
  position: relative;
  color: var(--el-text-color-primary);
}

.chat-sidebar {
  width: 280px;
  background-color: #fff;
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-actions {
  display: flex;
  gap: 8px;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-item {
  padding: 12px;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 8px;
  border: 1px solid transparent;
  transition: all 0.3s;
  display: flex;
  align-items: center;
}

.conversation-item:hover {
  background-color: var(--el-bg-color-page);
  border-color: var(--el-border-color);
}

.conversation-item.active {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
}

.conversation-select {
  margin-right: 10px;
  display: flex;
  align-items: center;
}

.conversation-item.selection-mode .conversation-content {
  cursor: pointer;
}

.conversation-content {
  flex: 1;
  overflow: hidden;
}

.conversation-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.conversation-title {
  font-weight: 500;
}

.conversation-timestamp {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.conversation-preview {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-actions {
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.conversation-item:hover .conversation-actions {
  opacity: 1;
}

.delete-btn {
  padding: 4px;
  font-size: 12px;
  margin-left: 8px;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 0px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin: 0px;
  overflow: hidden;
}

.chat-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-conversation h2 {
  margin: 0;
  margin-bottom: 4px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.current-conversation p {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.chat-messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
}

.messages-date-divider {
  text-align: center;
  margin: 20px 0;
  position: relative;
}

.messages-date-divider:before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 1px;
  background-color: var(--el-border-color-lighter);
  z-index: 1;
}

.messages-date-divider span {
  display: inline-block;
  background-color: var(--el-bg-color-page);
  padding: 0 10px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  position: relative;
  z-index: 2;
}

.message {
  display: flex;
  margin-bottom: 24px;
}

.message-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  max-width: calc(100% - 60px);
}

.message-header {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.message-sender {
  font-weight: 500;
  margin-right: 8px;
}

.message-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.message-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.file-preview img {
  max-width: 250px;
  max-height: 200px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
}

.file-info {
  display: flex;
  align-items: center;
  background-color: var(--el-bg-color-page);
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
}

.message-text {
  background-color: var(--el-bg-color-page);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  word-break: break-word;
}

.message.user .message-text {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.message-sources {
  margin-top: 16px;
}

.message-sources h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.source-item {
  margin-bottom: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.source-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.source-content {
  display: flex;
  align-items: center;
}

.source-icon {
  font-size: 24px;
  color: var(--el-color-info);
  margin-right: 12px;
}

.source-info {
  flex: 1;
}

.source-title {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.low-relevance-tag {
  margin-left: 8px;
  font-size: 10px;
  padding: 0 4px;
  height: 18px;
  line-height: 16px;
}

.source-relevance {
  width: 100%;
}

.message-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  gap: 16px;
}

.chat-input {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--el-border-color-light);
  background-color: #fff;
}

.input-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.file-tag {
  display: flex;
  align-items: center;
}

.file-icon {
  margin-right: 4px;
}

.input-area {
  position: relative;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.input-tips {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.loading-indicator {
  display: flex;
  align-items: center;
  margin: 20px 0;
}

.typing-text {
  margin-left: 12px;
  color: var(--el-text-color-secondary);
}

.typing-indicator {
  display: flex;
  align-items: center;
}

.typing-indicator span {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 4px;
  background-color: var(--el-color-primary);
  border-radius: 50%;
  animation: typing 1.5s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.3s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.6s;
  margin-right: 0;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-5px);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 0 2rem;
}

.empty-state-image {
  width: 300px;
  max-width: 100%;
  margin-bottom: 24px;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}

.empty-state p {
  color: var(--el-text-color-secondary);
  margin-bottom: 24px;
  max-width: 500px;
}

.quick-prompts {
  width: 100%;
  max-width: 600px;
}

.quick-prompts h4 {
  margin-bottom: 16px;
  color: var(--el-text-color-secondary);
}

.prompt-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.chat-panel {
  width: 320px;
  background-color: #fff;
  border-left: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.panel-section {
  padding-top: 8px;
}

.knowledge-card {
  margin-bottom: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.knowledge-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.knowledge-card h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.knowledge-card p {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.panel-section {
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  padding-right: 5px;
}

.panel-section::-webkit-scrollbar {
  width: 5px;
}

.panel-section::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color);
  border-radius: 5px;
}

.panel-section::-webkit-scrollbar-track {
  background-color: var(--el-bg-color-page);
}

/* Markdown 样式 */
:deep(.message-text h1) {
  font-size: 1.5rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

:deep(.message-text h2) {
  font-size: 1.25rem;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
}

:deep(.message-text pre) {
  background-color: #282c34;
  border-radius: 4px;
  padding: 12px;
  overflow-x: auto;
  margin: 12px 0;
}

:deep(.message-text code) {
  font-family: monospace;
}

:deep(.message-text p) {
  margin: 8px 0;
}

:deep(.message-text ul, .message-text ol) {
  margin: 8px 0;
  padding-left: 20px;
}

/* 响应式调整 */
@media (max-width: 1100px) {
  .chat-panel {
    display: none;
  }
  
  .chat-sidebar {
    width: 250px;
  }
}

@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
    height: auto;
  }
  
  .chat-sidebar {
    width: 100%;
    height: 200px;
    overflow-y: auto;
  }
  
  .chat-main {
    height: calc(100vh - 260px);
  }
  
  .prompt-buttons {
    grid-template-columns: 1fr;
  }
}

.multi-block-badge {
  display: inline-block;
  background-color: #409EFF;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
  font-weight: normal;
}

/* 增强版参考文献卡片样式（多块文档） */
.source-item:has(.multi-block-badge) {
  border: 1px solid #409EFF;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.1);
}

.source-item:has(.multi-block-badge):hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(64, 158, 255, 0.2);
}

/* 在不支持:has()的浏览器上使用以下样式 */
.source-content {
  position: relative;
}

/* 为所有来源添加鼠标悬停提示 */
.source-title {
  cursor: pointer;
  display: flex;
  align-items: center;
}

/* 文件上传样式 */
.file-tag.image-tag {
  background-color: #ecf5ff;
  border-color: #409EFF;
}

.image-upload {
  display: inline-block;
}

/* 图片预览样式 */
.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  max-height: 150px;
  overflow-y: auto;
  padding: 5px;
}

.image-preview-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview-close {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(0,0,0,0.5);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.image-preview-close:hover {
  background-color: rgba(255,0,0,0.7);
  transform: scale(1.1);
}

/* 消息中的图片样式 */
.message-files .file-preview img {
  max-width: 300px;
  max-height: 200px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.message-files .file-preview img:hover {
  transform: scale(1.03);
}

/* 相关文档样式 */
.relevant-doc {
  border-color: var(--el-color-success-light-3);
  background-color: var(--el-color-success-lighter);
}

/* 高相关文档样式 */
.high-relevance-doc {
  border: 2px solid var(--el-color-success);
  box-shadow: 0 0 8px rgba(103, 194, 58, 0.3);
  transform: translateY(-2px);
}

.high-relevance-doc h4 {
  color: var(--el-color-success);
}

.high-relevance-doc:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(103, 194, 58, 0.4);
}

/* 文本块信息样式 */
.block-info {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--el-color-primary);
  background-color: rgba(64, 158, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
  margin-bottom: 8px;
}

.block-info .el-icon {
  margin-right: 4px;
  font-size: 14px;
}

/* 相关文档标签动画 */
.relevant-doc .relevance-tag {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.8;
  }
}

.relevance-tag {
  margin-left: 5px;
  display: inline-flex;
  align-items: center;
}

.relevance-tag .el-icon {
  margin-right: 2px;
}

.tag-container {
  display: flex;
  align-items: center;
}

/* 聊天消息中的代码块样式优化 */
:deep(.chat-message-ai pre) {
  background-color: #f5f7fa !important;
  color: #333 !important;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  margin: 8px 0;
  overflow-x: auto;
  line-height: 1.6;
}

:deep(.chat-message-ai code) {
  background-color: #f0f2f5 !important;
  color: #333 !important;
  font-family: 'Courier New', Courier, monospace;
  padding: 2px 4px;
  border-radius: 3px;
}

/* 暗色模式适配 */
:deep(.dark .chat-message-ai pre),
:deep(.dark .chat-message-ai code) {
  background-color: #283142 !important;
  color: #e6e6e6 !important;
  border-color: #4c4d4f;
}

.clarification-tag {
  margin-left: 5px;
  display: inline-flex;
  align-items: center;
}

.clarification-tag .el-icon {
  margin-right: 2px;
}

.message.message-error .message-text {
  background-color: #fef0f0;
  border-color: #fde2e2;
  color: #f56c6c;
}

.message.message-clarification .message-text {
  background-color: #fdf6ec;
  border-color: #faecd8;
  border-left: 4px solid #e6a23c;
}

/* 反馈对话框样式 */
.feedback-dialog .el-dialog__body {
  padding: 20px 24px;
}

.feedback-dialog .el-form-item {
  margin-bottom: 18px;
}

.feedback-dialog .el-radio-group {
  display: flex;
  justify-content: space-around;
}

.feedback-dialog .el-switch {
  margin-left: 10px;
}

.message-actions {
  opacity: 0.6;
  transition: opacity 0.2s;
}

.message:hover .message-actions {
  opacity: 1;
}

/* 标记已经反馈的消息 */
.message-with-feedback {
  position: relative;
}

.message-with-feedback::after {
  content: '已反馈';
  position: absolute;
  right: 10px;
  top: 10px;
  font-size: 12px;
  color: var(--el-color-success);
  background-color: rgba(103, 194, 58, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.ai-response code {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #e83e8c;
  background-color: #f8f9fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}

.feedback-notice {
  margin: 10px 0;
}

.feedback-notice .el-alert {
  border-radius: 4px;
}

.feedback-notice p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #909399;
}

/* 日志分析对话框样式 */
.log-analysis-dialog .el-dialog__body {
  padding: 0;
  height: calc(100% - 120px);
  overflow: hidden;
}

.log-analysis-dialog .el-dialog__header {
  padding: 16px 20px;
  margin: 0;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
}

.log-analysis-dialog .el-dialog__footer {
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
}

.log-analysis-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.log-analysis-container {
  padding: 20px;
  background-color: var(--el-bg-color);
}

.log-analysis-description {
  margin-bottom: 20px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  background-color: var(--el-color-primary-light-9);
  padding: 12px 16px;
  border-radius: 6px;
  border-left: 4px solid var(--el-color-primary);
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-item-half {
  flex: 1;
}

.log-analysis-upload {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.log-analysis-upload span {
  margin-right: 10px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.log-analysis-upload .el-upload {
  margin-left: 10px;
}

.analysis-control-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.log-analysis-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--el-bg-color-page);
  border-top: 1px solid var(--el-border-color-light);
}

.result-header {
  padding: 16px 20px;
  background-color: var(--el-bg-color);
}

.divider-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.analysis-summary {
  margin: 16px 0;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.analysis-summary h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: var(--el-text-color-primary);
  font-weight: bold;
}

.summary-content {
  color: var(--el-text-color-primary);
  line-height: 1.6;
}

.result-content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
}

.analysis-issues {
  margin-bottom: 20px;
}

.analysis-issues h3 {
  margin: 16px 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
  font-weight: bold;
}

.issue-details {
  margin-top: 5px;
}

.issue-card {
  margin-bottom: 16px;
}

.issue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.issue-title {
  font-size: 15px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.issue-description {
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.6;
}

.root-cause {
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  line-height: 1.6;
}

.section-title {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--el-color-primary);
}

.fix-suggestions {
  margin-bottom: 16px;
}

.fix-commands {
  margin-bottom: 16px;
}

.command-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.command-card {
  background-color: #f8f9fa;
}

.command-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.command-content pre {
  margin: 0;
  padding: 0;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  overflow-x: auto;
  flex: 1;
  color: var(--el-color-primary-dark-2);
}

.copy-button {
  margin-left: 10px;
  flex-shrink: 0;
}

.fix-explanation {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  line-height: 1.6;
}

.verification-steps {
  margin-top: 16px;
}

.verification-steps p {
  margin-bottom: 16px;
  line-height: 1.6;
}

.verification-commands {
  margin-top: 16px;
}

.raw-analysis {
  margin-top: 20px;
}

.raw-details-wrapper {
  max-height: 300px;
  overflow-y: auto;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
}

.raw-details-wrapper pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
}

.analysis-actions {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  gap: 10px;
  background-color: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
}
</style>

<!-- 添加全局CSS样式 -->
<style>
/* 图片对话框样式 */
.el-dialog.image-dialog .el-dialog__body {
  display: flex;
  justify-content: center;
  padding: 10px;
}

.el-dialog.image-dialog img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

/* 宽文档对话框样式 */
.el-dialog.wide-document-dialog {
  width: 80% !important;
  max-width: 1000px;
}

.el-dialog.wide-document-dialog .el-dialog__body {
  padding: 20px 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.document-detail-container {
  font-family: var(--el-font-family);
}

.document-detail-header {
  margin-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color);
  padding-bottom: 15px;
}

.document-detail-header h2 {
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--el-color-primary);
}

.document-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.document-meta span {
  background-color: var(--el-bg-color-page);
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 14px;
}

.document-description, .document-content {
  margin-bottom: 20px;
}

.document-description h3, .document-content h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.document-description p {
  margin: 0;
  padding: 10px;
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
  line-height: 1.6;
}

.content-text {
  padding: 15px;
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
  white-space: pre-wrap;
  line-height: 1.7;
  max-height: 400px;
  overflow-y: auto;
}

/* 参考文献对话框样式 */
.reference-dialog .el-dialog__body {
  padding: 20px 24px;
}

.reference-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.reference-header h3 {
  margin: 0;
  font-size: 18px;
}

.reference-content {
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
  margin-bottom: 16px;
}

.content-block {
  font-family: var(--el-font-family);
  padding: 16px;
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  font-size: 14px;
  line-height: 1.6;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  max-height: 400px;
  overflow-y: auto;
}

.reference-note {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
  font-style: italic;
}

.source-item {
  cursor: pointer !important;
  transition: transform 0.2s, box-shadow 0.2s !important;
}

.source-item:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

/* 增强多块文档的样式 */
.source-item .multi-block-badge + .el-progress .el-progress-bar__inner {
  background-image: linear-gradient(90deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent);
  background-size: 16px 16px;
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 16px 0;
  }
}
</style> 
<template>
  <div class="home-container">
    <div class="hero-section">
      <div class="hero-content">
        <h1>自适应学习路径规划系统</h1>
        <p class="subtitle">基于深度推理大模型智能体协作框架的智能化学习平台</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="goToChat">开始智能学习</el-button>
          <el-button type="default" size="large" @click="goToKnowledgeBase">浏览知识图谱</el-button>
        </div>
      </div>
      <div class="hero-image">
        <img src="../assets/network-diagram.svg" alt="Learning Network" class="network-image" />
      </div>
    </div>
    
    <div class="section-divider">
      <h2 class="section-title">核心功能</h2>
    </div>
    
    <div class="feature-cards">
      <el-card class="feature-card" shadow="hover" @click="goToChat">
        <div class="card-content">
          <el-icon class="icon"><ChatDotRound /></el-icon>
          <h2>智能认知诊断</h2>
          <p>基于深度推理大模型的多模态推理架构，精准分析学习者认知状态，诊断准确率≥65%，突破传统诊断瓶颈。</p>
          <el-button type="primary" plain>立即体验</el-button>
        </div>
      </el-card>
      
      <el-card class="feature-card" shadow="hover" @click="goToKnowledgeBase">
        <div class="card-content">
          <el-icon class="icon"><Document /></el-icon>
          <h2>动态知识图谱</h2>
          <p>实时构建学习知识网络，支持个性化内容推荐。动态更新知识关联，为自适应路径规划提供智能支撑。</p>
          <el-button type="primary" plain>探索知识图谱</el-button>
        </div>
      </el-card>
      
      <el-card class="feature-card" shadow="hover" @click="goToMultiAgent">
        <div class="card-content">
          <el-icon class="icon"><Connection /></el-icon>
          <h2>多智能体协作</h2>
          <p>基于多智能体协同的认知诊断系统框架，四大智能体协作决策，实现智能化学习路径规划与优化。</p>
          <el-button type="primary" plain>体验协作</el-button>
        </div>
      </el-card>
      
      <el-card class="feature-card" shadow="hover" @click="goToDashboard">
        <div class="card-content">
          <el-icon class="icon"><DataAnalysis /></el-icon>
          <h2>学习效果分析</h2>
          <p>多智能体协同决策，实时监控学习进度，路径推荐匹配度≥65%，动态调整学习策略提升效率。</p>
          <el-button type="primary" plain>查看分析</el-button>
        </div>
      </el-card>
    </div>
    
    <div class="section-divider">
      <h2 class="section-title">学习场景示例</h2>
    </div>
    
    <div class="common-issues">
      <div class="issue-category">
        <h3>数学与逻辑推理</h3>
        <div class="topic-list">
          <el-tag 
            v-for="topic in mathTopics" 
            :key="topic.label"
            @click="quickStartChat(topic.query)"
            class="topic-tag"
            :type="topic.type"
          >
            {{ topic.label }}
          </el-tag>
        </div>
      </div>
      
      <div class="issue-category">
        <h3>编程与算法思维</h3>
        <div class="topic-list">
          <el-tag 
            v-for="topic in programmingTopics" 
            :key="topic.label"
            @click="quickStartChat(topic.query)"
            class="topic-tag"
            :type="topic.type"
          >
            {{ topic.label }}
          </el-tag>
        </div>
      </div>
      
      <div class="issue-category">
        <h3>科学思维训练</h3>
        <div class="topic-list">
          <el-tag 
            v-for="topic in scienceTopics" 
            :key="topic.label"
            @click="quickStartChat(topic.query)"
            class="topic-tag"
            :type="topic.type"
          >
            {{ topic.label }}
          </el-tag>
        </div>
      </div>
    </div>
    
    <div class="stats-banner">
      <div class="stat-item">
        <div class="stat-value">≥65%</div>
        <div class="stat-label">认知诊断准确率</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">≥65%</div>
        <div class="stat-label">路径推荐匹配度</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">30%</div>
        <div class="stat-label">学习效率提升</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">100+</div>
        <div class="stat-label">学习风格适配</div>
      </div>
    </div>
    
    <div class="cta-section">
      <h2>开启您的个性化学习之旅</h2>
      <p>基于深度推理大模型与多智能体协同技术，为您规划最适合的学习路径</p>
      <el-button type="primary" size="large" @click="goToChat">开始学习</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChatDotRound, Document, DataAnalysis, Connection } from '@element-plus/icons-vue'
import { useChatStore } from '../stores/chatStore'

const router = useRouter()
const chatStore = useChatStore()

const mathTopics = ref([
  { label: '线性代数学习路径规划', query: '我想学习线性代数，请为我制定个性化学习路径', type: 'success' },
  { label: '微积分认知诊断', query: '评估我的微积分基础，诊断学习状态', type: 'danger' },
  { label: '概率论学习困难分析', query: '我在概率论学习中遇到困难，需要分析原因', type: 'info' },
  { label: '数理逻辑推理训练', query: '设计数理逻辑推理能力训练方案', type: 'warning' }
])

const programmingTopics = ref([
  { label: '算法思维培养路径', query: '制定算法思维培养的学习路径', type: 'warning' },
  { label: '编程语言学习诊断', query: '诊断我的编程语言学习状态', type: 'danger' },
  { label: '数据结构掌握评估', query: '评估我对数据结构的掌握程度', type: 'info' },
  { label: '问题解决能力训练', query: '提升编程问题解决能力的训练方案', type: 'success' }
])

const scienceTopics = ref([
  { label: '物理概念理解诊断', query: '诊断我对物理概念的理解程度', type: 'info' },
  { label: '化学实验思维培养', query: '培养化学实验设计思维能力', type: '' },
  { label: '生物系统性思维训练', query: '训练生物学系统性思维能力', type: 'danger' },
  { label: '科学推理能力评估', query: '评估我的科学推理和论证能力', type: 'warning' }
])

function goToChat() {
  router.push('/chat')
}

function goToKnowledgeBase() {
  router.push('/knowledge-base')
}

function goToMultiAgent() {
  router.push('/multi-agent')
}

function goToDashboard() {
  router.push('/dashboard')
}

function quickStartChat(query) {
  chatStore.startNewConversation()
  router.push('/chat')
  // Use setTimeout to ensure the chat view is loaded before sending the message
  setTimeout(() => {
    chatStore.sendMessage(query)
  }, 100)
}
</script>

<style scoped>
.home-container {
  max-width: 100%;
  margin: 0 auto;
}

.hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3rem 5rem;
  background: linear-gradient(135deg, var(--el-bg-color), #ebf5ff);
  border-radius: 0 0 20px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.hero-content {
  flex: 1;
  padding-right: 3rem;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--el-color-primary);
  line-height: 1.2;
}

.subtitle {
  font-size: 1.4rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 2rem;
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.network-image {
  max-width: 90%;
  height: auto;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.section-divider {
  text-align: center;
  margin: 3rem 0 2rem;
  position: relative;
}

.section-divider::before {
  content: '';
  position: absolute;
  width: 80%;
  height: 1px;
  background-color: var(--el-border-color-lighter);
  top: 50%;
  left: 10%;
  z-index: 0;
}

.section-title {
  display: inline-block;
  background-color: white;
  padding: 0 2rem;
  font-size: 1.8rem;
  color: var(--el-text-color-primary);
  position: relative;
  z-index: 1;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  padding: 0 5rem 2rem;
}

.feature-card {
  height: 100%;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  text-align: center;
  height: 100%;
}

.icon {
  font-size: 4rem;
  color: var(--el-color-primary);
  margin-bottom: 1.5rem;
}

.card-content h2 {
  margin-bottom: 1rem;
  color: var(--el-text-color-primary);
  font-size: 1.5rem;
}

.card-content p {
  flex: 1;
  margin-bottom: 1.5rem;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.common-issues {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  padding: 0 5rem 3rem;
}

.issue-category {
  background-color: var(--el-bg-color-page);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.issue-category h3 {
  margin-bottom: 1rem;
  color: var(--el-text-color-primary);
  font-size: 1.2rem;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 0.5rem;
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.topic-tag {
  cursor: pointer;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  width: 100%;
  text-align: left;
  transition: all 0.3s;
}

.topic-tag:hover {
  transform: translateX(5px);
}

.stats-banner {
  background-color: var(--el-color-primary);
  color: white;
  padding: 3rem 5rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin: 2rem 0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  opacity: 0.9;
}

.cta-section {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #f0f8ff, #e6f3ff);
  border-radius: 12px;
  margin: 0 5rem 3rem;
}

.cta-section h2 {
  font-size: 2rem;
  color: var(--el-color-primary);
  margin-bottom: 1rem;
}

.cta-section p {
  font-size: 1.2rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 2rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .hero-section {
    padding: 2rem 3rem;
    flex-direction: column;
    text-align: center;
  }
  
  .hero-content {
    padding-right: 0;
    margin-bottom: 2rem;
  }
  
  .hero-actions {
    justify-content: center;
  }
  
  .feature-cards,
  .common-issues {
    grid-template-columns: repeat(1, 1fr);
    padding: 0 2rem;
  }
  
  .stats-banner {
    flex-direction: column;
    gap: 2rem;
  }
  
  .cta-section {
    margin: 0 2rem 2rem;
  }
}

@media (min-width: 768px) and (max-width: 1200px) {
  .feature-cards,
  .common-issues {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-banner {
    flex-wrap: wrap;
    gap: 2rem;
  }
  
  .stat-item {
    width: 40%;
  }
}
</style> 
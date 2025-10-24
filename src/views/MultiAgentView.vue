<template>
  <div class="multi-agent-container">
    <div class="page-header">
      <h1>多智能体协同诊断系统</h1>
      <p class="page-description">基于多智能体协同技术的认知诊断系统框架，实现智能体间的协作决策与诊断优化</p>
    </div>

    <!-- 系统架构概览 -->
    <el-card class="architecture-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><User /></el-icon>
          <span>多智能体架构</span>
          <el-button type="primary" size="small" @click="startDiagnosis" :loading="diagnosisRunning">
            {{ diagnosisRunning ? '诊断进行中...' : '启动协同诊断' }}
          </el-button>
        </div>
      </template>
      
      <div class="architecture-overview">
        <div class="agents-grid">
          <!-- 认知诊断智能体 -->
          <div class="agent-card" :class="{ active: activeAgents.includes('cognitive') }">
            <div class="agent-icon">
              <el-icon><User /></el-icon>
            </div>
            <h3>认知诊断智能体</h3>
            <p>分析学习者的认知状态和知识掌握程度</p>
            <div class="agent-status">
              <el-tag :type="getAgentRealTimeStatusType('cognitive')">{{ getAgentRealTimeStatus('cognitive') }}</el-tag>
            </div>
            <div class="agent-metrics">
              <div class="metric">
                <span class="label">诊断准确率:</span>
                <span class="value">{{ agentMetrics.cognitive.accuracy }}%</span>
              </div>
              <div class="metric">
                <span class="label">处理任务数:</span>
                <span class="value">{{ agentMetrics.cognitive.tasks }}</span>
              </div>
            </div>
          </div>

          <!-- 路径规划智能体 -->
          <div class="agent-card" :class="{ active: activeAgents.includes('planning') }">
            <div class="agent-icon">
              <el-icon><Position /></el-icon>
            </div>
            <h3>路径规划智能体</h3>
            <p>制定个性化学习路径和策略推荐</p>
            <div class="agent-status">
              <el-tag :type="getAgentRealTimeStatusType('planning')">{{ getAgentRealTimeStatus('planning') }}</el-tag>
            </div>
            <div class="agent-metrics">
              <div class="metric">
                <span class="label">路径匹配度:</span>
                <span class="value">{{ agentMetrics.planning.matching }}%</span>
              </div>
              <div class="metric">
                <span class="label">生成路径数:</span>
                <span class="value">{{ agentMetrics.planning.paths }}</span>
              </div>
            </div>
          </div>

          <!-- 资源推荐智能体 -->
          <div class="agent-card" :class="{ active: activeAgents.includes('resource') }">
            <div class="agent-icon">
              <el-icon><Files /></el-icon>
            </div>
            <h3>资源推荐智能体</h3>
            <p>智能推荐适合的学习资源和材料</p>
            <div class="agent-status">
              <el-tag :type="getAgentRealTimeStatusType('resource')">{{ getAgentRealTimeStatus('resource') }}</el-tag>
            </div>
            <div class="agent-metrics">
              <div class="metric">
                <span class="label">推荐精度:</span>
                <span class="value">{{ agentMetrics.resource.precision }}%</span>
              </div>
              <div class="metric">
                <span class="label">资源库大小:</span>
                <span class="value">{{ agentMetrics.resource.resources }}</span>
              </div>
            </div>
          </div>

          <!-- 评估监控智能体 -->
          <div class="agent-card" :class="{ active: activeAgents.includes('monitoring') }">
            <div class="agent-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <h3>评估监控智能体</h3>
            <p>实时监控学习效果和系统性能</p>
            <div class="agent-status">
              <el-tag :type="getAgentRealTimeStatusType('monitoring')">{{ getAgentRealTimeStatus('monitoring') }}</el-tag>
            </div>
            <div class="agent-metrics">
              <div class="metric">
                <span class="label">监控覆盖率:</span>
                <span class="value">{{ agentMetrics.monitoring.coverage }}%</span>
              </div>
              <div class="metric">
                <span class="label">异常检测数:</span>
                <span class="value">{{ agentMetrics.monitoring.anomalies }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 协同决策流程 -->
        <div class="collaboration-flow">
          <h3>协同决策流程</h3>
          <div class="flow-diagram">
            <div class="flow-step" :class="{ active: currentStep >= 1 }">
              <div class="step-number">1</div>
              <div class="step-content">
                <h4>数据收集</h4>
                <p>各智能体收集学习者行为数据</p>
              </div>
            </div>
            <el-icon class="flow-arrow"><ArrowRightBold /></el-icon>
            
            <div class="flow-step" :class="{ active: currentStep >= 2 }">
              <div class="step-number">2</div>
              <div class="step-content">
                <h4>协同分析</h4>
                <p>智能体间交换信息，协同分析</p>
              </div>
            </div>
            <el-icon class="flow-arrow"><ArrowRightBold /></el-icon>
            
            <div class="flow-step" :class="{ active: currentStep >= 3 }">
              <div class="step-number">3</div>
              <div class="step-content">
                <h4>决策融合</h4>
                <p>融合多智能体的诊断结果</p>
              </div>
            </div>
            <el-icon class="flow-arrow"><ArrowRightBold /></el-icon>
            
            <div class="flow-step" :class="{ active: currentStep >= 4 }">
              <div class="step-number">4</div>
              <div class="step-content">
                <h4>输出结果</h4>
                <p>生成最终诊断和推荐方案</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 协同诊断实例 -->
    <div class="diagnosis-section">
      <el-row :gutter="20">
        <!-- 诊断输入 -->
        <el-col :span="8">
          <el-card class="input-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Edit /></el-icon>
                <span>学习者信息输入</span>
              </div>
            </template>
            
            <el-form :model="learnerInput" label-width="100px">
              <el-form-item label="学习者ID">
                <el-input v-model="learnerInput.learnerId" placeholder="输入学习者ID" />
              </el-form-item>
              
              <el-form-item label="学科领域">
                <el-select v-model="learnerInput.subject" placeholder="选择学科">
                  <el-option label="数学" value="math" />
                  <el-option label="编程" value="programming" />
                  <el-option label="科学" value="science" />
                  <el-option label="语言" value="language" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="学习目标">
                <el-input v-model="learnerInput.goal" type="textarea" :rows="3" placeholder="描述学习目标" />
              </el-form-item>
              
              <el-form-item label="当前水平">
                <el-rate v-model="learnerInput.currentLevel" :max="5" show-text />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="submitLearnerInfo" :loading="processing">
                  提交诊断请求
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <!-- 协同过程可视化 -->
        <el-col :span="8">
          <el-card class="process-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Connection /></el-icon>
                <span>协同过程监控</span>
              </div>
            </template>
            
            <div class="collaboration-monitor">
              <!-- 当前处理状态 -->
              <div class="current-processing" v-if="diagnosisRunning">
                <h4>当前处理状态</h4>
                <div class="processing-info">
                  <el-tag :type="currentProcessingAgent === 'fusion' ? 'danger' : 'warning'" size="large" effect="dark">
                    {{ currentConsensusStage }}
                  </el-tag>
                </div>
              </div>
              
              <!-- 智能体实时结果 -->
              <div class="agent-real-time-results">
                <h4>智能体分析结果</h4>
                <div class="results-timeline">
                  <div class="result-item" :class="{ completed: agentResults.cognitive }" v-if="agentResults.cognitive || currentProcessingAgent === 'cognitive'">
                    <el-icon class="result-icon" :class="{ active: agentResults.cognitive }"><User /></el-icon>
                    <div class="result-content">
                      <h5>认知诊断智能体</h5>
                      <p v-if="agentResults.cognitive">
                        置信度: {{ agentResults.cognitive.confidence }}% | 
                        {{ agentResults.cognitive.keyFindings?.[0] || '分析完成' }}
                      </p>
                      <p v-else class="processing">正在分析中...</p>
                    </div>
                  </div>
                  
                  <div class="result-item" :class="{ completed: agentResults.planning }" v-if="agentResults.planning || currentProcessingAgent === 'planning'">
                    <el-icon class="result-icon" :class="{ active: agentResults.planning }"><Position /></el-icon>
                    <div class="result-content">
                      <h5>路径规划智能体</h5>
                      <p v-if="agentResults.planning">
                        匹配度: {{ agentResults.planning.confidence }}% | 
                        {{ agentResults.planning.keyFindings?.[0] || '规划完成' }}
                      </p>
                      <p v-else class="processing">正在规划中...</p>
                    </div>
                  </div>
                  
                  <div class="result-item" :class="{ completed: agentResults.resource }" v-if="agentResults.resource || currentProcessingAgent === 'resource'">
                    <el-icon class="result-icon" :class="{ active: agentResults.resource }"><Files /></el-icon>
                    <div class="result-content">
                      <h5>资源推荐智能体</h5>
                      <p v-if="agentResults.resource">
                        精度: {{ agentResults.resource.confidence }}% | 
                        {{ agentResults.resource.keyFindings?.[0] || '推荐完成' }}
                      </p>
                      <p v-else class="processing">正在推荐中...</p>
                    </div>
                  </div>
                  
                  <div class="result-item" :class="{ completed: agentResults.monitoring }" v-if="agentResults.monitoring || currentProcessingAgent === 'monitoring'">
                    <el-icon class="result-icon" :class="{ active: agentResults.monitoring }"><Monitor /></el-icon>
                    <div class="result-content">
                      <h5>监控智能体</h5>
                      <p v-if="agentResults.monitoring">
                        覆盖率: {{ agentResults.monitoring.confidence }}% | 
                        {{ agentResults.monitoring.keyFindings?.[0] || '监控完成' }}
                      </p>
                      <p v-else class="processing">正在设计中...</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="consensus-progress">
                <h4>协同共识进度</h4>
                <el-progress :percentage="consensusProgress" :status="consensusProgress === 100 ? 'success' : 'active'" />
                <div class="consensus-details">
                  <p>当前阶段: {{ currentConsensusStage }}</p>
                  <p>参与智能体: {{ activeAgents.length }}/4</p>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 诊断结果 -->
        <el-col :span="8">
          <el-card class="result-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Trophy /></el-icon>
                <span>协同诊断结果</span>
                <el-button v-if="diagnosisResult" type="primary" size="small" @click="showDetailedReport = true">
                  查看详细报告
                </el-button>
              </div>
            </template>
            
            <div v-if="diagnosisResult" class="diagnosis-result">
              <div class="result-summary">
                <h4>综合诊断评估</h4>
                <div class="assessment-score">
                  <el-progress type="circle" :percentage="diagnosisResult.overallScore" />
                  <p>综合评分</p>
                </div>
              </div>
              
              <div class="agent-contributions">
                <h4>各智能体贡献度</h4>
                <div class="contribution-list">
                  <div v-for="contrib in diagnosisResult.agentContributions" :key="contrib.agent" 
                       class="contribution-item">
                    <div class="agent-name">{{ contrib.agentName }}</div>
                    <el-progress :percentage="contrib.contribution" :format="() => contrib.contribution + '%'" />
                    <div class="contribution-detail">{{ contrib.insight }}</div>
                  </div>
                </div>
              </div>
              
              <div class="recommendations">
                <h4>协同推荐方案</h4>
                <el-timeline>
                  <el-timeline-item v-for="rec in diagnosisResult.recommendations" :key="rec.id"
                                    :timestamp="rec.priority" placement="top">
                    <div class="recommendation-item">
                      <h5>{{ rec.title }}</h5>
                      <p>{{ rec.description }}</p>
                      <el-tag size="small">{{ rec.source }}智能体推荐</el-tag>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </div>
            
            <el-empty v-else description="暂无诊断结果" />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 性能分析 -->
    <el-card class="performance-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><DataBoard /></el-icon>
          <span>协同性能分析</span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="performance-metrics">
            <h4>系统性能指标</h4>
            <div class="metrics-grid">
              <div class="metric-item">
                <div class="metric-value">{{ systemMetrics.responseTime }}ms</div>
                <div class="metric-label">平均响应时间</div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ systemMetrics.accuracy }}%</div>
                <div class="metric-label">诊断准确率</div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ systemMetrics.throughput }}</div>
                <div class="metric-label">处理吞吐量</div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ systemMetrics.efficiency }}%</div>
                <div class="metric-label">协同效率</div>
              </div>
            </div>
          </div>
        </el-col>
        
        <el-col :span="12">
          <div class="agent-comparison">
            <h4>智能体性能对比</h4>
            <div ref="performanceChart" class="chart-container"></div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 详细分析报告对话框 -->
    <el-dialog v-model="showDetailedReport" title="多智能体协同诊断详细报告" width="90%" draggable>
      <div class="detailed-report" v-if="diagnosisResult">
        <!-- 报告标题 -->
        <div class="report-header">
          <h2>🎯 自适应学习路径规划系统</h2>
          <h3>多智能体协同诊断分析报告</h3>
          <div class="report-meta">
            <el-tag>学习者ID: {{ learnerInput.learnerId }}</el-tag>
            <el-tag type="success">学科: {{ learnerInput.subject }}</el-tag>
            <el-tag type="warning">当前水平: {{ learnerInput.currentLevel }}/5</el-tag>
            <el-tag type="info">生成时间: {{ new Date(diagnosisResult.timestamp).toLocaleString() }}</el-tag>
          </div>
        </div>

        <!-- 执行摘要 -->
        <el-card class="report-section" shadow="never">
          <template #header>
            <h3>📋 执行摘要</h3>
          </template>
          <div class="executive-summary">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="summary-item">
                  <div class="summary-title">综合诊断评分</div>
                  <div class="summary-value">{{ diagnosisResult.overallScore }}/100</div>
                  <div class="summary-desc">基于四个专业智能体的协同分析</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="summary-item">
                  <div class="summary-title">协同效果评估</div>
                  <div class="summary-value">{{ diagnosisResult.collaborationEffectiveness?.consistency || '良好' }}</div>
                  <div class="summary-desc">智能体间协作一致性</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="summary-item">
                  <div class="summary-title">推荐建议数量</div>
                  <div class="summary-value">{{ diagnosisResult.recommendations?.length || 0 }}</div>
                  <div class="summary-desc">个性化学习建议</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 智能体详细分析 -->
        <el-card class="report-section" shadow="never">
          <template #header>
            <h3>🤖 智能体详细分析</h3>
          </template>
          <el-row :gutter="20">
            <!-- 认知诊断智能体 -->
            <el-col :span="12" v-if="agentResults.cognitive">
              <el-card class="agent-detail-card" shadow="hover">
                <template #header>
                  <div class="agent-header">
                    <el-icon><User /></el-icon>
                    <span>认知诊断智能体</span>
                    <el-tag type="success">置信度: {{ agentResults.cognitive.confidence }}%</el-tag>
                  </div>
                </template>
                <div class="agent-analysis">
                  <h4>🧠 核心发现</h4>
                  <ul class="findings-list">
                    <li v-for="finding in agentResults.cognitive.keyFindings" :key="finding">{{ finding }}</li>
                  </ul>
                  <h4>📄 详细分析</h4>
                  <div class="analysis-content full-content">{{ agentResults.cognitive.content }}</div>
                  <h4>🤝 协作建议</h4>
                  <p class="collaboration-suggestion">{{ agentResults.cognitive.collaborationSuggestions }}</p>
                </div>
              </el-card>
            </el-col>

            <!-- 路径规划智能体 -->
            <el-col :span="12" v-if="agentResults.planning">
              <el-card class="agent-detail-card" shadow="hover">
                <template #header>
                  <div class="agent-header">
                    <el-icon><Position /></el-icon>
                    <span>路径规划智能体</span>
                    <el-tag type="warning">匹配度: {{ agentResults.planning.confidence }}%</el-tag>
                  </div>
                </template>
                <div class="agent-analysis">
                  <h4>🗺️ 核心发现</h4>
                  <ul class="findings-list">
                    <li v-for="finding in agentResults.planning.keyFindings" :key="finding">{{ finding }}</li>
                  </ul>
                  <h4>📄 详细分析</h4>
                  <div class="analysis-content full-content">{{ agentResults.planning.content }}</div>
                  <h4>🤝 协作建议</h4>
                  <p class="collaboration-suggestion">{{ agentResults.planning.collaborationSuggestions }}</p>
                </div>
              </el-card>
            </el-col>

            <!-- 资源推荐智能体 -->
            <el-col :span="12" v-if="agentResults.resource">
              <el-card class="agent-detail-card" shadow="hover">
                <template #header>
                  <div class="agent-header">
                    <el-icon><Files /></el-icon>
                    <span>资源推荐智能体</span>
                    <el-tag type="danger">精度: {{ agentResults.resource.confidence }}%</el-tag>
                  </div>
                </template>
                <div class="agent-analysis">
                  <h4>📚 核心发现</h4>
                  <ul class="findings-list">
                    <li v-for="finding in agentResults.resource.keyFindings" :key="finding">{{ finding }}</li>
                  </ul>
                  <h4>📄 详细分析</h4>
                  <div class="analysis-content full-content">{{ agentResults.resource.content }}</div>
                  <h4>🤝 协作建议</h4>
                  <p class="collaboration-suggestion">{{ agentResults.resource.collaborationSuggestions }}</p>
                </div>
              </el-card>
            </el-col>

            <!-- 监控智能体 -->
            <el-col :span="12" v-if="agentResults.monitoring">
              <el-card class="agent-detail-card" shadow="hover">
                <template #header>
                  <div class="agent-header">
                    <el-icon><Monitor /></el-icon>
                    <span>监控智能体</span>
                    <el-tag type="info">覆盖率: {{ agentResults.monitoring.confidence }}%</el-tag>
                  </div>
                </template>
                <div class="agent-analysis">
                  <h4>📈 核心发现</h4>
                  <ul class="findings-list">
                    <li v-for="finding in agentResults.monitoring.keyFindings" :key="finding">{{ finding }}</li>
                  </ul>
                  <h4>📄 详细分析</h4>
                  <div class="analysis-content full-content">{{ agentResults.monitoring.content }}</div>
                  <h4>🤝 协作建议</h4>
                  <p class="collaboration-suggestion">{{ agentResults.monitoring.collaborationSuggestions }}</p>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>

        <!-- 协同融合结果 -->
        <el-card class="report-section" shadow="never">
          <template #header>
            <h3>🔄 协同融合结果</h3>
          </template>
          <div class="fusion-results">
            <h4>🎯 关键洞察</h4>
            <ul class="insights-list">
              <li v-for="insight in diagnosisResult.keyInsights" :key="insight">{{ insight }}</li>
            </ul>
            
            <h4>📊 协同效果评估</h4>
            <el-row :gutter="20" class="effectiveness-metrics">
              <el-col :span="8">
                <div class="metric-card">
                  <div class="metric-title">诊断一致性</div>
                  <div class="metric-value">{{ diagnosisResult.collaborationEffectiveness?.consistency || '良好' }}</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="metric-card">
                  <div class="metric-title">建议互补性</div>
                  <div class="metric-value">{{ diagnosisResult.collaborationEffectiveness?.complementarity || '强' }}</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="metric-card">
                  <div class="metric-title">整体可行性</div>
                  <div class="metric-value">{{ diagnosisResult.collaborationEffectiveness?.feasibility || '高' }}</div>
                </div>
              </el-col>
            </el-row>

            <h4>📋 完整融合内容</h4>
            <div class="fusion-content scrollable-content" v-if="diagnosisResult.fusionContent">
              <pre>{{ diagnosisResult.fusionContent }}</pre>
            </div>
          </div>
        </el-card>

        <!-- 行动建议 -->
        <el-card class="report-section" shadow="never">
          <template #header>
            <h3>🚀 行动建议</h3>
          </template>
          <div class="action-recommendations">
            <el-timeline>
              <el-timeline-item 
                v-for="(rec, index) in diagnosisResult.recommendations" 
                :key="rec.id"
                :type="index === 0 ? 'primary' : 'success'"
                :timestamp="rec.priority"
                placement="top">
                <el-card class="recommendation-card" shadow="hover">
                  <template #header>
                    <div class="rec-header">
                      <strong>{{ rec.title }}</strong>
                      <el-tag size="small" :type="rec.priority === '高优先级' ? 'danger' : 'info'">
                        {{ rec.source }}智能体推荐
                      </el-tag>
                    </div>
                  </template>
                  <div class="rec-content">
                    <p><strong>详细描述：</strong>{{ rec.description }}</p>
                    <p><strong>优先级：</strong>{{ rec.priority }}</p>
                    <p><strong>推荐来源：</strong>{{ rec.source }}智能体</p>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDetailedReport = false">关闭</el-button>
          <el-button type="primary" @click="exportReport">导出报告</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, nextTick } from 'vue'
import { 
  User, Position, Files, Monitor, Edit, Connection, 
  Trophy, DataBoard, ArrowRightBold 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { multiAgentManager } from '../services/multiAgentService.js'

// 响应式数据
const diagnosisRunning = ref(false)
const processing = ref(false)
const activeAgents = ref([])
const currentStep = ref(0)
const consensusProgress = ref(0)
const currentConsensusStage = ref('待启动')

// 学习者输入信息
const learnerInput = reactive({
  learnerId: '',
  subject: '',
  goal: '',
  currentLevel: 3
})

// 智能体指标
const agentMetrics = reactive({
  cognitive: { accuracy: 73, tasks: 156 },
  planning: { matching: 68, paths: 89 },
  resource: { precision: 81, resources: 2340 },
  monitoring: { coverage: 92, anomalies: 3 }
})

// 智能体交互状态
const agentInteractions = ref([
  { id: 1, from: '认知诊断', to: '路径规划', active: false, dataExchanged: 0 },
  { id: 2, from: '路径规划', to: '资源推荐', active: false, dataExchanged: 0 },
  { id: 3, from: '资源推荐', to: '评估监控', active: false, dataExchanged: 0 },
  { id: 4, from: '认知诊断', to: '评估监控', active: false, dataExchanged: 0 }
])

// 智能体实时结果
const agentResults = reactive({
  cognitive: null,
  planning: null,
  resource: null,
  monitoring: null
})

// 诊断结果
const diagnosisResult = ref(null)

// 当前处理的智能体
const currentProcessingAgent = ref('')

// 详细报告显示控制
const showDetailedReport = ref(false)

// 系统性能指标
const systemMetrics = reactive({
  responseTime: 245,
  accuracy: 71,
  throughput: 23,
  efficiency: 87
})



// 启动协同诊断
async function startDiagnosis() {
  // 检查是否已提交学习者信息
  if (!learnerInput.learnerId || !learnerInput.subject) {
    ElMessage.warning('请先填写完整的学习者信息')
    return
  }
  
  diagnosisRunning.value = true
  currentStep.value = 0
  consensusProgress.value = 0
  currentConsensusStage.value = '初始化协同诊断'
  activeAgents.value = []
  
  try {
    console.log('🚀 启动真实的多智能体协同诊断')
    
    // 准备学习者信息
    const learnerInfo = {
      learnerId: learnerInput.learnerId,
      subject: learnerInput.subject,
      goal: learnerInput.goal,
      currentLevel: learnerInput.currentLevel,
      timestamp: Date.now()
    }
    
    // 重置多智能体管理器
    multiAgentManager.reset()
    
    // 阶段1：认知诊断智能体
    currentStep.value = 1
    activeAgents.value = ['cognitive']
    currentConsensusStage.value = '🧠 认知诊断分析中...'
    consensusProgress.value = 10
    currentProcessingAgent.value = 'cognitive'
    activateInteraction(1)
    
    console.log('🧠 开始认知诊断智能体分析')
    const cognitiveResult = await multiAgentManager.executeAgentTask('cognitive', learnerInfo)
    agentResults.cognitive = cognitiveResult
    ElMessage.success('🧠 认知诊断智能体分析完成')
    consensusProgress.value = 25
    
    // 阶段2：路径规划智能体  
    currentStep.value = 2
    activeAgents.value = ['cognitive', 'planning']
    currentConsensusStage.value = '🗺️ 学习路径规划中...'
    currentProcessingAgent.value = 'planning'
    activateInteraction(2)
    
    console.log('🗺️ 开始路径规划智能体分析')
    const planningResult = await multiAgentManager.executeAgentTask('planning', {
      ...learnerInfo,
      cognitiveAnalysis: cognitiveResult
    })
    agentResults.planning = planningResult
    ElMessage.success('🗺️ 路径规划智能体分析完成')
    consensusProgress.value = 50
    
    // 阶段3：资源推荐智能体
    currentStep.value = 3
    activeAgents.value = ['cognitive', 'planning', 'resource']
    currentConsensusStage.value = '📚 学习资源推荐中...'
    currentProcessingAgent.value = 'resource'
    activateInteraction(3)
    
    console.log('📚 开始资源推荐智能体分析')
    const resourceResult = await multiAgentManager.executeAgentTask('resource', {
      ...learnerInfo,
      cognitiveAnalysis: cognitiveResult,
      learningPath: planningResult
    })
    agentResults.resource = resourceResult
    ElMessage.success('📚 资源推荐智能体分析完成')
    consensusProgress.value = 75
    
    // 阶段4：监控智能体
    currentStep.value = 4
    activeAgents.value = ['cognitive', 'planning', 'resource', 'monitoring']
    currentConsensusStage.value = '📈 学习监控方案设计中...'
    currentProcessingAgent.value = 'monitoring'
    activateInteraction(4)
    
    console.log('📈 开始监控智能体分析')
    const monitoringResult = await multiAgentManager.executeAgentTask('monitoring', {
      ...learnerInfo,
      cognitiveAnalysis: cognitiveResult,
      learningPath: planningResult,
      resources: resourceResult
    })
    agentResults.monitoring = monitoringResult
    ElMessage.success('📈 监控智能体分析完成')
    consensusProgress.value = 90
    
    // 阶段5：协同决策融合
    currentConsensusStage.value = '🤝 协同决策融合中...'
    currentProcessingAgent.value = 'fusion'
    
    console.log('🤝 开始协同决策融合')
    // 更新共享上下文到多智能体管理器
    multiAgentManager.updateSharedContext('cognitive', cognitiveResult)
    multiAgentManager.updateSharedContext('planning', planningResult)
    multiAgentManager.updateSharedContext('resource', resourceResult)
    multiAgentManager.updateSharedContext('monitoring', monitoringResult)
    
    const result = await multiAgentManager.performDecisionFusion()
    
    // 更新界面显示结果
    diagnosisResult.value = result
    
    // 更新智能体指标显示
    updateAgentMetricsDisplay()
    
    consensusProgress.value = 100
    currentConsensusStage.value = '🎉 协同诊断完成'
    currentProcessingAgent.value = ''
    
    ElMessage.success('🎉 多智能体协同诊断完成！')
    
  } catch (error) {
    console.error('❌ 协同诊断失败:', error)
    ElMessage.error(`诊断失败: ${error.message}`)
    
    // 显示错误状态
    currentConsensusStage.value = '诊断失败'
    
  } finally {
    diagnosisRunning.value = false
  }
}

// 激活智能体交互
function activateInteraction(interactionId) {
  const interaction = agentInteractions.value.find(i => i.id === interactionId)
  if (interaction) {
    interaction.active = true
    interaction.dataExchanged = Math.floor(Math.random() * 500) + 100
  }
}

// 提交学习者信息
async function submitLearnerInfo() {
  if (!learnerInput.learnerId || !learnerInput.subject) {
    ElMessage.warning('请填写完整的学习者信息')
    return
  }
  
  processing.value = true
  
  try {
    // 简单验证处理
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('学习者信息已提交，可启动协同诊断')
    console.log('📋 学习者信息已准备:', learnerInput)
    
  } catch (error) {
    ElMessage.error('信息提交失败，请重试')
  } finally {
    processing.value = false
  }
}

// 更新智能体指标显示
function updateAgentMetricsDisplay() {
  try {
    // 从多智能体管理器获取最新指标
    const cognitiveMetrics = multiAgentManager.getAgentMetrics('cognitive')
    const planningMetrics = multiAgentManager.getAgentMetrics('planning')
    const resourceMetrics = multiAgentManager.getAgentMetrics('resource')
    const monitoringMetrics = multiAgentManager.getAgentMetrics('monitoring')
    
    // 更新界面显示的指标
    if (cognitiveMetrics && Object.keys(cognitiveMetrics).length > 0) {
      agentMetrics.cognitive.accuracy = cognitiveMetrics.diagnosisAccuracy || agentMetrics.cognitive.accuracy
      agentMetrics.cognitive.tasks = cognitiveMetrics.tasksProcessed || agentMetrics.cognitive.tasks
    }
    
    if (planningMetrics && Object.keys(planningMetrics).length > 0) {
      agentMetrics.planning.matching = planningMetrics.pathMatchingRate || agentMetrics.planning.matching
      agentMetrics.planning.paths = planningMetrics.pathsGenerated || agentMetrics.planning.paths
    }
    
    if (resourceMetrics && Object.keys(resourceMetrics).length > 0) {
      agentMetrics.resource.precision = resourceMetrics.recommendationPrecision || agentMetrics.resource.precision
      agentMetrics.resource.resources = resourceMetrics.resourcesManaged || agentMetrics.resource.resources
    }
    
    if (monitoringMetrics && Object.keys(monitoringMetrics).length > 0) {
      agentMetrics.monitoring.coverage = monitoringMetrics.monitoringCoverage || agentMetrics.monitoring.coverage
      agentMetrics.monitoring.anomalies = monitoringMetrics.anomaliesDetected || agentMetrics.monitoring.anomalies
    }
    
    console.log('📊 智能体指标已更新')
    
  } catch (error) {
    console.error('更新智能体指标失败:', error)
  }
}

// 获取智能体实时状态
function getAgentRealTimeStatus(agentType) {
  try {
    const status = multiAgentManager.getAgentStatus(agentType)
    return status === 'active' ? '运行中' : (diagnosisRunning.value ? '待激活' : '空闲')
  } catch (error) {
    return diagnosisRunning.value ? '待激活' : '空闲'
  }
}

function getAgentRealTimeStatusType(agentType) {
  try {
    const status = multiAgentManager.getAgentStatus(agentType)
    return status === 'active' ? 'success' : (diagnosisRunning.value ? 'warning' : 'info')
  } catch (error) {
    return diagnosisRunning.value ? 'warning' : 'info'
  }
}

// 导出报告功能
function exportReport() {
  if (!diagnosisResult.value) {
    ElMessage.warning('暂无诊断结果可导出')
    return
  }
  
  try {
    const reportData = {
      title: '多智能体协同诊断分析报告',
      timestamp: new Date().toLocaleString(),
      learnerInfo: learnerInput,
      overallScore: diagnosisResult.value.overallScore,
      agentResults: agentResults,
      finalResult: diagnosisResult.value,
      collaborationEffectiveness: diagnosisResult.value.collaborationEffectiveness
    }
    
    const reportText = generateReportText(reportData)
    downloadReport(reportText, `多智能体诊断报告_${learnerInput.learnerId}_${new Date().toISOString().split('T')[0]}.txt`)
    
    ElMessage.success('报告导出成功！')
  } catch (error) {
    console.error('导出报告失败:', error)
    ElMessage.error('导出报告失败，请重试')
  }
}

// 生成报告文本
function generateReportText(data) {
  return `
=================================================================
             自适应学习路径规划系统
          多智能体协同诊断分析报告
=================================================================

报告生成时间: ${data.timestamp}
学习者ID: ${data.learnerInfo.learnerId}
学科领域: ${data.learnerInfo.subject}
学习目标: ${data.learnerInfo.goal}
当前水平: ${data.learnerInfo.currentLevel}/5

=================================================================
                        执行摘要
=================================================================
综合诊断评分: ${data.overallScore}/100
协同效果评估: ${data.collaborationEffectiveness?.consistency || '良好'}
推荐建议数量: ${data.finalResult.recommendations?.length || 0}

=================================================================
                     智能体详细分析
=================================================================

【认知诊断智能体】
置信度: ${data.agentResults.cognitive?.confidence || 'N/A'}%
核心发现: ${data.agentResults.cognitive?.keyFindings?.join('; ') || '暂无'}
协作建议: ${data.agentResults.cognitive?.collaborationSuggestions || '暂无'}

【路径规划智能体】
匹配度: ${data.agentResults.planning?.confidence || 'N/A'}%
核心发现: ${data.agentResults.planning?.keyFindings?.join('; ') || '暂无'}
协作建议: ${data.agentResults.planning?.collaborationSuggestions || '暂无'}

【资源推荐智能体】
精确度: ${data.agentResults.resource?.confidence || 'N/A'}%
核心发现: ${data.agentResults.resource?.keyFindings?.join('; ') || '暂无'}
协作建议: ${data.agentResults.resource?.collaborationSuggestions || '暂无'}

【监控智能体】
覆盖率: ${data.agentResults.monitoring?.confidence || 'N/A'}%
核心发现: ${data.agentResults.monitoring?.keyFindings?.join('; ') || '暂无'}
协作建议: ${data.agentResults.monitoring?.collaborationSuggestions || '暂无'}

=================================================================
                     协同融合结果
=================================================================
关键洞察:
${data.finalResult.keyInsights?.map(insight => `• ${insight}`).join('\n') || '暂无'}

协同效果评估:
• 诊断一致性: ${data.collaborationEffectiveness?.consistency || '良好'}
• 建议互补性: ${data.collaborationEffectiveness?.complementarity || '强'}
• 整体可行性: ${data.collaborationEffectiveness?.feasibility || '高'}

=================================================================
                        行动建议
=================================================================
${data.finalResult.recommendations?.map((rec, index) => `
${index + 1}. ${rec.title} [${rec.priority}]
   描述: ${rec.description}
   来源: ${rec.source}智能体推荐
`).join('') || '暂无建议'}

=================================================================
                        完整融合内容
=================================================================
${data.finalResult.fusionContent || '暂无详细内容'}

=================================================================
报告结束 - 生成时间: ${data.timestamp}
=================================================================
`
}

// 下载报告文件
function downloadReport(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

// 性能图表引用
const performanceChart = ref(null)

// 初始化性能对比图表
function initPerformanceChart() {
  if (!performanceChart.value) return
  
  const chart = echarts.init(performanceChart.value)
  
  const option = {
    title: {
      text: '智能体协同效率',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['独立工作', '协同工作'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: ['认知诊断', '路径规划', '资源推荐', '评估监控']
    },
    yAxis: {
      type: 'value',
      name: '效率(%)',
      max: 100
    },
    series: [
      {
        name: '独立工作',
        type: 'bar',
        data: [65, 58, 72, 68],
        itemStyle: { color: '#E6A23C' }
      },
      {
        name: '协同工作',
        type: 'bar',
        data: [73, 68, 81, 92],
        itemStyle: { color: '#67C23A' }
      }
    ]
  }
  
  chart.setOption(option)
  
  // 响应式调整
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

onMounted(() => {
  nextTick(() => {
    initPerformanceChart()
  })
})
</script>

<style scoped>
.multi-agent-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #303133;
  margin-bottom: 10px;
}

.page-description {
  font-size: 1.1rem;
  color: #606266;
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
}

.architecture-card {
  margin-bottom: 30px;
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.agent-card {
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.agent-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.agent-card.active {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
}

.agent-icon {
  font-size: 2.5rem;
  color: #409eff;
  margin-bottom: 15px;
}

.agent-card.active .agent-icon {
  color: #67c23a;
}

.agent-card h3 {
  color: #303133;
  margin: 0 0 10px 0;
  font-size: 1.2rem;
}

.agent-card p {
  color: #606266;
  margin: 0 0 15px 0;
  font-size: 0.9rem;
}

.agent-status {
  margin-bottom: 15px;
}

.agent-metrics {
  text-align: left;
}

.metric {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.metric .label {
  color: #909399;
}

.metric .value {
  font-weight: bold;
  color: #303133;
}

.collaboration-flow {
  margin-top: 30px;
}

.collaboration-flow h3 {
  text-align: center;
  color: #303133;
  margin-bottom: 30px;
}

.flow-diagram {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  background: #f8f9fa;
  min-width: 150px;
  transition: all 0.3s ease;
}

.flow-step.active {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 10px;
}

.flow-step.active .step-number {
  background: rgba(255, 255, 255, 0.3);
}

.step-content h4 {
  margin: 0 0 5px 0;
  font-size: 1rem;
}

.step-content p {
  margin: 0;
  font-size: 0.85rem;
  text-align: center;
}

.flow-arrow {
  font-size: 1.5rem;
  color: #909399;
}

.diagnosis-section {
  margin: 30px 0;
}

.input-card, .process-card, .result-card {
  height: 600px;
}

.collaboration-monitor {
  height: 500px;
  overflow-y: auto;
}

.agent-interactions h4 {
  margin-bottom: 15px;
  color: #303133;
}

.interaction-matrix {
  space-y: 10px;
}

.interaction-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.interaction-item.active {
  border-color: #67c23a;
  background: #f0f9ff;
}

.interaction-agents {
  font-weight: bold;
  margin-bottom: 5px;
}

.interaction-status {
  margin-bottom: 5px;
}

.interaction-data {
  font-size: 0.85rem;
  color: #606266;
}

.consensus-progress {
  margin-top: 30px;
}

.consensus-progress h4 {
  margin-bottom: 15px;
  color: #303133;
}

.consensus-details {
  margin-top: 10px;
  font-size: 0.9rem;
  color: #606266;
}

.consensus-details p {
  margin: 5px 0;
}

.diagnosis-result {
  height: 500px;
  overflow-y: auto;
}

.result-summary {
  text-align: center;
  margin-bottom: 30px;
}

.assessment-score {
  margin: 20px 0;
}

.assessment-score p {
  margin-top: 10px;
  color: #606266;
}

.agent-contributions {
  margin-bottom: 30px;
}

.contribution-list {
  space-y: 15px;
}

.contribution-item {
  margin-bottom: 15px;
}

.agent-name {
  font-weight: bold;
  margin-bottom: 5px;
  color: #303133;
}

.contribution-detail {
  font-size: 0.85rem;
  color: #606266;
  margin-top: 5px;
}

.recommendation-item h5 {
  margin: 0 0 5px 0;
  color: #303133;
}

.recommendation-item p {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 0.9rem;
}

.performance-card {
  margin-top: 30px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.metric-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-value {
  font-size: 2rem;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.metric-label {
  color: #606266;
  font-size: 0.9rem;
}

.chart-container {
  height: 300px;
}

/* 实时结果显示样式 */
.current-processing {
  margin-bottom: 20px;
}

.processing-info {
  text-align: center;
  padding: 10px;
}

.agent-real-time-results {
  margin-bottom: 20px;
}

.results-timeline {
  space-y: 10px;
}

.result-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.result-item.completed {
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border-color: #67c23a;
}

.result-icon {
  font-size: 1.5rem;
  color: #909399;
  margin-right: 12px;
  margin-top: 4px;
}

.result-icon.active {
  color: #67c23a;
}

.result-content h5 {
  margin: 0 0 5px 0;
  font-size: 0.9rem;
  font-weight: bold;
  color: #303133;
}

.result-content p {
  margin: 0;
  font-size: 0.8rem;
  color: #606266;
}

.result-content .processing {
  color: #e6a23c;
  font-style: italic;
}

/* 详细报告样式 */
.detailed-report {
  max-height: 80vh;
  overflow-y: auto;
}

.report-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.report-header h2 {
  margin: 0 0 10px 0;
  font-size: 1.8rem;
}

.report-header h3 {
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  opacity: 0.9;
}

.report-meta {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.report-section {
  margin-bottom: 20px;
}

.report-section h3 {
  margin: 0;
  color: #303133;
  font-size: 1.1rem;
}

/* 执行摘要样式 */
.executive-summary {
  padding: 20px 0;
}

.summary-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  height: 100%;
}

.summary-title {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 2rem;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.summary-desc {
  font-size: 0.8rem;
  color: #999;
}

/* 智能体详细分析样式 */
.agent-detail-card {
  margin-bottom: 20px;
  height: 100%;
}

.agent-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
}

.agent-analysis h4 {
  margin: 15px 0 8px 0;
  font-size: 0.9rem;
  color: #303133;
}

.findings-list {
  margin: 0 0 15px 0;
  padding-left: 20px;
}

.findings-list li {
  margin-bottom: 5px;
  font-size: 0.85rem;
  color: #606266;
}

.analysis-content {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 15px;
}

.analysis-content.full-content {
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  scrollbar-width: thin;
  scrollbar-color: #c0c4cc #f5f7fa;
}

.analysis-content.full-content::-webkit-scrollbar {
  width: 6px;
}

.analysis-content.full-content::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

.analysis-content.full-content::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.analysis-content.full-content::-webkit-scrollbar-thumb:hover {
  background: #a4a9ae;
}

.collaboration-suggestion {
  background: #e1f3d8;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #529b2e;
  margin: 0;
}

/* 协同融合结果样式 */
.fusion-results h4 {
  margin: 20px 0 10px 0;
  color: #303133;
  font-size: 1rem;
}

.insights-list {
  margin: 0 0 20px 0;
  padding-left: 20px;
}

.insights-list li {
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #606266;
}

.effectiveness-metrics {
  margin: 15px 0;
}

.metric-card {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.metric-title {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #67c23a;
}

.fusion-content {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  margin-top: 10px;
}

.fusion-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.8rem;
  color: #606266;
  margin: 0;
  line-height: 1.4;
}

/* 行动建议样式 */
.action-recommendations {
  padding: 10px 0;
}

.recommendation-card {
  margin-bottom: 10px;
}

.rec-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
}

.rec-content {
  font-size: 0.85rem;
  color: #606266;
}

.rec-content p {
  margin: 5px 0;
}

.rec-content strong {
  color: #303133;
}

/* 对话框样式 */
.dialog-footer {
  text-align: right;
}

@media (max-width: 768px) {
  .flow-diagram {
    flex-direction: column;
  }
  
  .flow-arrow {
    transform: rotate(90deg);
  }
  
  .agents-grid {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .report-meta {
    flex-direction: column;
    align-items: center;
  }
  
  .summary-value {
    font-size: 1.5rem;
  }
  
  .agent-header {
    flex-wrap: wrap;
    gap: 5px;
  }
}
</style> 
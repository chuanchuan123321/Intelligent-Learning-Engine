<template>
  <div class="knowledge-container">
    <div class="knowledge-header">
      <div class="header-content">
        <h1>学习知识图谱</h1>
        <p>浏览和搜索动态构建的学习知识网络，包括学科基础理论、学习方法和认知诊断资料</p>
      </div>
      
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索知识图谱（如：数学基础、编程思维、学习策略、认知诊断）"
          class="search-input"
          @keyup.enter="searchKnowledge"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="searchKnowledge" :loading="knowledgeStore.isLoading">
              搜索
            </el-button>
          </template>
        </el-input>
      </div>
    </div>
    
    <div class="knowledge-main">
      <div class="knowledge-sidebar">
        <div class="sidebar-section">
          <h3 class="sidebar-title">快速筛选</h3>
          <div class="filter-tags">
            <el-tag
              v-for="tag in filterTags"
              :key="tag"
              @click="quickSearch(tag)"
              class="filter-tag"
              type="info"
              effect="plain"
              :class="{ active: searchQuery === tag }"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
        
        <div class="sidebar-section">
          <h3 class="sidebar-title">资源类型</h3>
          <el-checkbox-group v-model="selectedTypes" class="filter-checkboxes">
            <el-checkbox label="theory">基础理论</el-checkbox>
            <el-checkbox label="method">学习方法</el-checkbox>
            <el-checkbox label="diagnosis">认知诊断</el-checkbox>
            <el-checkbox label="case">案例分析</el-checkbox>
          </el-checkbox-group>
        </div>
        
        <div class="sidebar-section">
          <h3 class="sidebar-title">学科分类</h3>
          <el-radio-group v-model="selectedVendor" class="filter-radios">
            <el-radio label="all">全部学科</el-radio>
            <el-radio label="math">数学</el-radio>
            <el-radio label="programming">编程</el-radio>
            <el-radio label="science">科学</el-radio>
            <el-radio label="language">语言</el-radio>
            <el-radio label="psychology">心理学</el-radio>
            <el-radio label="education">教育学</el-radio>
          </el-radio-group>
        </div>
        
        <div class="sidebar-section">
          <h3 class="sidebar-title">高级搜索</h3>
          <div class="advanced-filters">
            <el-form size="small" label-position="top">
              <el-form-item label="相关度">
                <el-slider v-model="minRelevance" :format-tooltip="formatRelevance" />
              </el-form-item>
              <el-form-item label="排序方式">
                <el-select v-model="sortBy" placeholder="选择排序方式" style="width: 100%">
                  <el-option label="相关度优先" value="relevance" />
                  <el-option label="最新优先" value="date" />
                  <el-option label="最多引用" value="citations" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="applyFilters" style="width: 100%">应用筛选</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
      
      <div class="knowledge-content">
        <div class="content-header">
          <div class="content-title">
            <template v-if="knowledgeStore.knowledgeFragments.length > 0">
              <h2>搜索结果（{{ knowledgeStore.knowledgeFragments.length }}）</h2>
              <p>搜索关键词: <strong>{{ searchQuery }}</strong></p>
            </template>
            <template v-else-if="!knowledgeStore.isLoading">
              <h2>浏览知识图谱</h2>
              <p>从下面的类别中选择或使用搜索功能查找内容</p>
            </template>
          </div>
          
          <div class="content-actions">
            <el-button 
              v-if="knowledgeStore.knowledgeFragments.length > 0"
              type="primary" 
              plain 
              size="default" 
              @click="returnToHomepage"
              style="margin-right: 15px"
            >
              <el-icon><Back /></el-icon> 返回
            </el-button>
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="card">
                <el-icon><Grid /></el-icon>
              </el-radio-button>
              <el-radio-button label="list">
                <el-icon><Menu /></el-icon>
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
        
        <div v-if="knowledgeStore.isLoading" class="loading-container">
          <el-icon class="is-loading loading-icon"><Loading /></el-icon>
          <span>正在检索知识图谱，请稍候...</span>
        </div>
        
        <template v-else>
          <div v-if="knowledgeStore.knowledgeFragments.length === 0" class="default-content">
            <div class="category-section">
              <h3 class="category-title">基础理论知识</h3>
              <div class="category-cards">
                <el-card 
                  v-for="(item, index) in protocolStandards" 
                  :key="index"
                  shadow="hover"
                  class="category-card"
                  @click="quickSearch(item.title)"
                >
                  <div class="category-icon" :style="{ backgroundColor: item.color }">
                    <el-icon><Document /></el-icon>
                  </div>
                  <h4>{{ item.title }}</h4>
                  <p>{{ item.description }}</p>
                  <div class="category-meta">
                    <el-tag size="small" effect="plain">{{ item.count }}份资料</el-tag>
                  </div>
                </el-card>
              </div>
            </div>
            
            <div class="category-section">
              <h3 class="category-title">管理员上传的学习资料</h3>
              <document-list 
                :documents="paginatedAdminDocuments"
                :loading="loadingAdminDocs"
                @view="viewAdminDocument"
                @download="downloadAdminDocument"
                @generate-mindmap="generateDocumentMindMap"
              />
              <div class="pagination-container" v-if="knowledgeStore.adminDocuments.length > adminDocsPageSize">
                <el-pagination
                  layout="prev, pager, next"
                  :total="knowledgeStore.adminDocuments.length"
                  :page-size="adminDocsPageSize"
                  :current-page="adminDocsCurrentPage"
                  background
                  @current-change="handleAdminDocsPageChange"
                />
              </div>
            </div>
            
            <div class="category-section">
              <h3 class="category-title">学习方法与策略</h3>
              <div class="category-cards">
                <el-card 
                  v-for="(item, index) in networkTechnologies" 
                  :key="index"
                  shadow="hover"
                  class="category-card"
                  @click="quickSearch(item.title)"
                >
                  <div class="category-icon" :style="{ backgroundColor: item.color }">
                    <el-icon><Connection /></el-icon>
                  </div>
                  <h4>{{ item.title }}</h4>
                  <p>{{ item.description }}</p>
                  <div class="category-meta">
                    <el-tag size="small" effect="plain">{{ item.count }}份指导</el-tag>
                  </div>
                </el-card>
              </div>
            </div>
            
            <div class="category-section">
              <h3 class="category-title">热门学习诊断案例</h3>
              <div class="category-list">
                <el-table :data="troubleshootTopics" style="width: 100%">
                  <el-table-column prop="title" label="问题类型" min-width="250">
                    <template #default="scope">
                      <div class="topic-link" @click="quickSearch(scope.row.title)">
                        {{ scope.row.title }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="count" label="文档数量" width="100" />
                  <el-table-column prop="popularity" label="热门程度" width="180">
                    <template #default="scope">
                      <el-rate 
                        v-model="scope.row.popularity" 
                        disabled 
                        show-score
                        text-color="#ff9900"
                        score-template="{value}"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="120">
                    <template #default="scope">
                      <el-button 
                        type="primary" 
                        size="small" 
                        @click="quickSearch(scope.row.title)"
                        plain
                      >
                        查看
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
            
            <div class="category-section">
              <h3 class="category-title">用户验证的解决方案</h3>
              <div v-if="knowledgeStore.userValidatedSolutions.length > 0" class="category-list">
                <el-table 
                  :data="knowledgeStore.userValidatedSolutions" 
                  style="width: 100%"
                  @row-click="(row) => quickSearch(row.title)"
                >
                  <el-table-column prop="title" label="解决方案" min-width="250">
                    <template #default="scope">
                      <div class="solution-link">
                        <el-tag size="small" type="success" effect="dark" class="solution-tag">用户验证</el-tag>
                        <span class="solution-title" :title="scope.row.title">{{ scope.row.title }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="category" label="类别" width="120">
                    <template #default="scope">
                      <el-tag 
                        size="small" 
                        :type="getCategoryTagType(scope.row.category)"
                      >
                        {{ getCategoryLabel(scope.row.category) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="标签" min-width="200">
                    <template #default="scope">
                      <div class="solution-tags">
                        <el-tag 
                          v-for="(tag, index) in scope.row.tags" 
                          :key="index"
                          size="small"
                          effect="plain"
                          class="solution-tag-item"
                        >
                          {{ tag }}
                        </el-tag>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="validationDate" label="验证日期" width="150">
                    <template #default="scope">
                      {{ formatDate(scope.row.metadata?.validationDate || scope.row.uploadDate) }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <el-empty v-else description="暂无用户验证的解决方案" />
            </div>
          </div>
          
          <div v-else class="search-results">
            <div :class="['results-container', `view-${viewMode}`]">
              <el-card 
                v-for="fragment in paginatedSearchResults" 
                :key="fragment.id"
                class="knowledge-card"
                shadow="hover"
              >
                <template #header>
                  <div class="card-header">
                    <h3>{{ fragment.title }}</h3>
                    <div class="header-tags">
                      <el-tag 
                        v-for="tag in fragment.tags" 
                        :key="tag"
                        type="success"
                        size="small"
                        effect="plain"
                      >
                        {{ tag }}
                      </el-tag>
                      <el-tag type="warning" size="small">
                        相关度: {{ Math.round(fragment.relevance * 100) }}%
                      </el-tag>
                    </div>
                  </div>
                </template>
                
                <div class="card-content">
                  <p>{{ fragment.content }}</p>
                  <div class="source-info">
                    <span class="source-label">来源：</span>
                    <span class="source-text">{{ fragment.source }}</span>
                  </div>
                </div>
                
                <div class="card-footer">
                  <div class="card-actions">
                    <el-button type="primary" plain size="small" @click="viewSearchResultDetail(fragment)">
                      <el-icon><View /></el-icon> 详细查看
                    </el-button>
                    <el-button plain size="small" @click="showRelatedKnowledge(fragment)" :loading="aiLoadingMap.get(fragment.id)">
                      <el-icon><Position /></el-icon> 相关知识
                    </el-button>
                  </div>
                  
                  <div class="feedback-section">
                    <span class="feedback-label">此内容是否有帮助？</span>
                    <div class="feedback-buttons">
                      <el-button 
                        type="primary" 
                        size="small" 
                        plain
                        circle
                        @click="submitFeedback(fragment.id, true)"
                      >
                        <el-icon><Check /></el-icon>
                      </el-button>
                      <el-button 
                        type="danger" 
                        size="small" 
                        plain
                        circle
                        @click="submitFeedback(fragment.id, false)"
                      >
                        <el-icon><Close /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
            
            <div class="pagination-container">
              <el-pagination
                layout="prev, pager, next"
                :total="filteredFragments.length"
                :page-size="searchPageSize"
                :current-page="currentPage"
                background
                @current-change="handlePageChange"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- 思维导图对话框 -->
  <el-dialog
    v-model="mindMapDialogVisible"
    :title="`${currentMindMapData?.title || ''} - 智能思维导图`"
    width="90%"
    top="5vh"
    :close-on-click-modal="false"
    class="mindmap-dialog"
  >
    <div class="mindmap-dialog-content">
      <div v-if="mindMapLoading" class="mindmap-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <p>AI正在分析文档内容，生成思维导图...</p>
      </div>
      
      <div v-else-if="mindMapError" class="mindmap-error">
        <el-result
          icon="error"
          title="生成失败"
          :sub-title="mindMapError"
        >
          <template #extra>
            <el-button type="primary" @click="closeMindMapDialog">关闭</el-button>
          </template>
        </el-result>
      </div>
      
      <div v-else-if="currentMindMapData" class="mindmap-content">
        <div class="mindmap-header">
          <div class="mindmap-info">
            <h3>{{ currentMindMapData.title }}</h3>
            <p>基于文档内容AI生成的智能思维导图</p>
          </div>
          <div class="mindmap-actions">
            <el-button type="primary" @click="downloadMindMap">
              <el-icon><Download /></el-icon>
              下载SVG
            </el-button>
            <el-button @click="closeMindMapDialog">关闭</el-button>
          </div>
        </div>
        
        <div class="mindmap-container-wrapper">
          <div id="mindmap-container" class="mindmap-container"></div>
        </div>
        
        <div class="mindmap-footer">
          <el-alert
            title="使用说明"
            type="info"
            :closable="false"
            show-icon
          >
            <p>• 思维导图展示了文档的主要知识结构和逻辑关系</p>
            <p>• 您可以下载SVG格式的图片保存到本地</p>
            <p>• 图谱内容由AI智能分析生成，仅供参考</p>
          </el-alert>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { Search, Document, Loading, Grid, Menu, View, Position, Check, Close, Connection, Back, Share, Download } from '@element-plus/icons-vue'
import { useKnowledgeStore } from '../stores/knowledgeStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import DocumentList from '../components/DocumentList.vue'
import { useChatStore } from '../stores/chatStore'
import { generateMindMapFromDocument } from '../services/aiService'

const knowledgeStore = useKnowledgeStore()
const chatStore = useChatStore()
const searchQuery = ref('')
const viewMode = ref('card')
const selectedTypes = ref(['theory', 'method', 'diagnosis', 'case'])
const selectedVendor = ref('all')
const minRelevance = ref(60)
const sortBy = ref('relevance')
const currentPage = ref(1)
const loadingAdminDocs = ref(false)
const adminDocsCurrentPage = ref(1)
const adminDocsPageSize = ref(6)
const searchPageSize = ref(6)
const aiLoadingMap = ref(new Map())

// 思维导图相关状态
const mindMapDialogVisible = ref(false)
const mindMapLoading = ref(false)
const currentMindMapData = ref(null)
const mindMapError = ref('')

const filterTags = [
  '数学', '编程', '科学', '语言', '学习策略', '认知诊断', '理论基础', '方法技巧'
]

const protocolStandards = [
  { 
    title: '数学基础', 
    description: '数学的基本概念、定理和公式',
    count: 156,
    color: '#409EFF' 
  },
  { 
    title: '编程思维', 
    description: '编程的基本概念、算法和设计原则',
    count: 92,
    color: '#67C23A' 
  },
  { 
    title: '科学方法', 
    description: '科学研究的基本方法和步骤',
    count: 78,
    color: '#E6A23C' 
  },
  { 
    title: '语言学习', 
    description: '语言学习的基本理论和实践技巧',
    count: 112,
    color: '#F56C6C' 
  },
  { 
    title: '认知理论', 
    description: '认知科学与学习心理学基础理论',
    count: 89,
    color: '#906EFF' 
  }
]

const networkTechnologies = [
  { 
    title: '学习方法', 
    description: '有效的学习方法和策略',
    count: 45,
    color: '#909399' 
  },
  { 
    title: '认知诊断', 
    description: '认知诊断的理论和实践应用',
    count: 67,
    color: '#409EFF' 
  },
  { 
    title: '学习策略', 
    description: '学习策略的制定和实施',
    count: 53,
    color: '#67C23A' 
  },
  { 
    title: '认知心理学', 
    description: '认知心理学在学习和教育中的应用',
    count: 81,
    color: '#E6A23C' 
  }
]

const troubleshootTopics = [
  { title: '数学学习障碍诊断', count: 32, popularity: 4.8 },
  { title: '编程思维训练案例', count: 24, popularity: 4.6 },
  { title: '科学研究方法实践', count: 29, popularity: 4.7 },
  { title: '语言学习策略分析', count: 35, popularity: 4.9 },
  { title: '学习方法效果评估', count: 21, popularity: 4.5 },
  { title: '认知能力评估诊断', count: 18, popularity: 4.4 }
]

const paginatedAdminDocuments = computed(() => {
  const start = (adminDocsCurrentPage.value - 1) * adminDocsPageSize.value
  const end = start + adminDocsPageSize.value
  return knowledgeStore.adminDocuments.slice(start, end)
})

const filteredFragments = computed(() => {
  if (!knowledgeStore.knowledgeFragments.length) return []
  
  return knowledgeStore.knowledgeFragments.filter(fragment => {
    // 应用相关度过滤
    const relevancePercent = fragment.relevance * 100
    if (relevancePercent < minRelevance.value) return false
    
    return true
  }).sort((a, b) => {
    // 应用排序
    if (sortBy.value === 'relevance') {
      return b.relevance - a.relevance
    } else if (sortBy.value === 'date') {
      // 假设有date字段，实际项目中根据实际字段调整
      return new Date(b.date || 0) - new Date(a.date || 0)
    } else if (sortBy.value === 'citations') {
      // 假设有citations字段，实际项目中根据实际字段调整
      return (b.citations || 0) - (a.citations || 0)
    }
    return 0
  })
})

const paginatedSearchResults = computed(() => {
  const start = (currentPage.value - 1) * searchPageSize.value
  const end = start + searchPageSize.value
  return filteredFragments.value.slice(start, end)
})

function formatRelevance(val) {
  return `${val}%`
}

onMounted(() => {
  // 默认条件下预加载示例数据
  if (searchQuery.value.trim()) {
    knowledgeStore.searchKnowledge(searchQuery.value)
  }
})

function searchKnowledge() {
  if (searchQuery.value.trim()) {
    currentPage.value = 1
    knowledgeStore.searchKnowledge(searchQuery.value)
  }
}

function quickSearch(tag) {
  searchQuery.value = tag
  currentPage.value = 1
  knowledgeStore.searchKnowledge(tag)
}

function applyFilters() {
  if (searchQuery.value.trim()) {
    currentPage.value = 1
    knowledgeStore.searchKnowledge(searchQuery.value)
  }
  
  ElMessage({
    message: '筛选条件已应用',
    type: 'success',
    duration: 2000
  })
}

function handlePageChange(page) {
  currentPage.value = page
  // 滚动到页面顶部，提供更好的用户体验
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function submitFeedback(fragmentId, isHelpful) {
  knowledgeStore.addFeedback(fragmentId, isHelpful)
  
  ElMessage({
    message: isHelpful ? '谢谢您的反馈，我们将继续优化相关内容' : '感谢您的反馈，我们会改进相关内容',
    type: isHelpful ? 'success' : 'info',
    duration: 2000
  })
}

// Load admin documents
onMounted(async () => {
  loadingAdminDocs.value = true
  try {
    await knowledgeStore.getAdminDocuments()
    await knowledgeStore.getUserValidatedSolutions()
  } catch (error) {
    console.error('Error loading admin documents:', error)
  } finally {
    loadingAdminDocs.value = false
  }
})

// View uploaded document
async function viewAdminDocument(document) {
  try {
    const doc = await knowledgeStore.getDocumentContent(document.id)
    
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
              <span><strong>类型:</strong> ${getDocumentTypeLabel(doc.type)}</span>
              <span><strong>分类:</strong> ${doc.category}</span>
              <span><strong>上传日期:</strong> ${doc.uploadDate}</span>
              <span><strong>文件大小:</strong> ${doc.size}</span>
            </div>
          </div>
          <div class="document-description">
            <h3>描述</h3>
            <p>${doc.description || '无描述'}</p>
          </div>
          <div class="document-content">
            <h3>内容预览</h3>
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
    ElMessage.error('加载文档详情失败')
    console.error(error)
  }
}

// Helper function to get document type label
function getDocumentTypeLabel(type) {
  const labels = {
    theory: '基础理论',
    method: '学习方法',
    diagnosis: '认知诊断',
    case: '案例分析'
  }
  return labels[type] || type
}

// Download uploaded document
function downloadAdminDocument(doc) {
  if (!doc || !doc.id) {
    ElMessage.error('无效的文档');
    return;
  }
  
  knowledgeStore.getDocumentContent(doc.id)
    .then(docData => {
      if (!docData || !docData.content) {
        ElMessage.error('文档内容为空或未找到');
        return;
      }
      
      // 创建文本类型的Blob (可根据实际文件类型调整)
      const blob = new Blob([docData.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // 创建并点击下载链接
      const link = window.document.createElement('a');
      link.href = url;
      link.download = docData.fileName || `${docData.title}.txt`;
      link.style.display = 'none';
      window.document.body.appendChild(link);
      link.click();
      
      // 清理资源
      setTimeout(() => {
        URL.revokeObjectURL(url);
        window.document.body.removeChild(link);
        ElMessage.success(`文档 ${docData.title} 下载成功`);
      }, 100);
    })
    .catch(error => {
      console.error('下载文档失败:', error);
      ElMessage.error('下载文档失败');
    });
}

// 新增返回主页函数
function returnToHomepage() {
  // 清除搜索结果
  knowledgeStore.clearSearchResults();
  // 清空搜索框
  searchQuery.value = '';
  // 重置页面状态
  currentPage.value = 1;
}

function getCategoryTagType(category) {
  const types = {
    '数学': 'info',
    '编程': 'success',
    '科学': 'warning',
    '语言': 'danger',
    '学习策略': 'primary',
    '认知诊断': 'danger',
    '基础理论': 'info',
    '学习方法': 'success',
    '认知心理学': 'warning',
    '数学思维': 'info',
    '科学方法': 'success',
    '逻辑推理': 'warning',
    '创新思维': 'danger',
    '批判思维': 'primary',
    '系统思维': 'danger',
    '认知能力': 'success',
    '元认知': 'warning',
    '学习理论': 'info',
    '教育心理学': 'success',
    '学习科学': 'warning',
    '认知科学': 'danger',
    '人工智能': 'info',
    '深度学习': 'primary',
    '机器学习': 'success',
    '神经网络': 'warning'
  }
  return types[category] || 'default'
}

function getCategoryLabel(category) {
  const labels = {
    '数学': '数学',
    '编程': '编程',
    '科学': '科学',
    '语言': '语言',
    '学习策略': '学习策略',
    '认知诊断': '认知诊断',
    '基础理论': '基础理论',
    '学习方法': '学习方法',
    '认知心理学': '认知心理学',
    '数学思维': '数学思维',
    '科学方法': '科学方法',
    '逻辑推理': '逻辑推理',
    '创新思维': '创新思维',
    '批判思维': '批判思维',
    '系统思维': '系统思维',
    '认知能力': '认知能力',
    '元认知': '元认知',
    '学习理论': '学习理论',
    '教育心理学': '教育心理学',
    '学习科学': '学习科学',
    '认知科学': '认知科学',
    '人工智能': '人工智能',
    '深度学习': '深度学习',
    '机器学习': '机器学习',
    '神经网络': '神经网络'
  }
  return labels[category] || category
}

function formatDate(date) {
  const formattedDate = new Date(date).toLocaleDateString()
  return formattedDate
}

function handleAdminDocsPageChange(page) {
  adminDocsCurrentPage.value = page
}

// 生成文档思维导图
async function generateDocumentMindMap(document) {
  try {
    mindMapLoading.value = true
    mindMapError.value = ''
    
    console.log('开始生成思维导图，文档：', document.title)
    
    // 获取文档完整内容
    let docContent = document.content || document.description || ''
    
    // 如果没有内容，尝试获取完整文档
    if (!docContent && document.id) {
      try {
        const fullDoc = await knowledgeStore.getDocumentContent(document.id)
        docContent = fullDoc?.content || ''
      } catch (error) {
        console.warn('无法获取文档完整内容，使用现有信息', error)
      }
    }
    
    // 构建传递给AI的文档对象
    const docForAI = {
      title: document.title,
      content: docContent,
      description: document.description,
      type: document.type,
      category: document.category
    }
    
    console.log('准备发送给AI的文档数据：', docForAI)
    
    // 调用AI服务生成思维导图
    const result = await generateMindMapFromDocument(docForAI)
    
    if (result.success) {
      currentMindMapData.value = {
        title: result.title,
        mermaidCode: result.mermaidCode,
        document: document
      }
      
      // 显示思维导图对话框
      mindMapDialogVisible.value = true
      
      // 等待对话框显示后再渲染图表
      await nextTick()
      renderMindMap(result.mermaidCode)
      
      ElMessage.success('思维导图生成成功！')
    } else {
      mindMapError.value = result.error || '生成思维导图失败'
      ElMessage.error('生成思维导图失败：' + mindMapError.value)
    }
  } catch (error) {
    console.error('生成思维导图时发生错误：', error)
    mindMapError.value = error.message || '生成思维导图时发生未知错误'
    ElMessage.error('生成思维导图失败：' + mindMapError.value)
  } finally {
    mindMapLoading.value = false
  }
}

// 渲染Mermaid思维导图
async function renderMindMap(mermaidCode) {
  try {
    // 动态导入Mermaid库
    const mermaid = (await import('mermaid')).default
    
    // 初始化Mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      mindmap: {
        useMaxWidth: true,
        padding: 20
      }
    })
    
    // 等待DOM更新
    await nextTick()
    
    // 获取容器元素
    const element = document.getElementById('mindmap-container')
    if (!element) {
      console.error('找不到思维导图容器元素')
      return
    }
    
    // 清空容器
    element.innerHTML = ''
    
    // 生成唯一ID
    const graphId = 'mindmap-' + Date.now()
    
    // 渲染思维导图
    const { svg } = await mermaid.render(graphId, mermaidCode)
    element.innerHTML = svg
    
    console.log('思维导图渲染成功')
  } catch (error) {
    console.error('渲染思维导图失败：', error)
    mindMapError.value = '渲染思维导图失败：' + error.message
    
    // 显示错误信息
    const element = document.getElementById('mindmap-container')
    if (element) {
      element.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #f56c6c;">
          <p>思维导图渲染失败</p>
          <p style="font-size: 12px; margin-top: 10px;">${error.message}</p>
        </div>
      `
    }
  }
}

// 关闭思维导图对话框
function closeMindMapDialog() {
  mindMapDialogVisible.value = false
  currentMindMapData.value = null
  mindMapError.value = ''
}

// 下载思维导图
function downloadMindMap() {
  if (!currentMindMapData.value) return
  
  try {
    // 获取SVG元素
    const svgElement = document.querySelector('#mindmap-container svg')
    if (!svgElement) {
      ElMessage.error('无法找到思维导图内容')
      return
    }
    
    // 创建SVG数据
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    
    // 创建下载链接
    const downloadLink = document.createElement('a')
    downloadLink.href = URL.createObjectURL(svgBlob)
    downloadLink.download = `${currentMindMapData.value.title}-思维导图.svg`
    
    // 触发下载
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    
    // 清理URL对象
    URL.revokeObjectURL(downloadLink.href)
    
    ElMessage.success('思维导图下载成功！')
  } catch (error) {
    console.error('下载思维导图失败：', error)
    ElMessage.error('下载思维导图失败')
  }
}

async function viewSearchResultDetail(fragment) {
  try {
    // 检查是否有document ID
    if (fragment.documentId) {
      // 如果有文档ID，则获取完整文档内容
      const doc = await knowledgeStore.getDocumentContent(fragment.documentId);
      
      if (doc && doc.content) {
        // 显示文档详情，与viewAdminDocument函数类似
        const contentPreview = doc.content.length > 800 
          ? doc.content.substring(0, 800) + '...' 
          : doc.content;
          
        ElMessageBox.alert(
          `<div class="document-detail-container">
            <div class="document-detail-header">
              <h2>${doc.title}</h2>
              <div class="document-meta">
                <span><strong>类型:</strong> ${getDocumentTypeLabel(doc.type)}</span>
                <span><strong>分类:</strong> ${doc.category || '未分类'}</span>
                <span><strong>上传日期:</strong> ${doc.uploadDate || '未知'}</span>
                <span><strong>相关度:</strong> ${Math.round(fragment.relevance * 100)}%</span>
              </div>
            </div>
            <div class="document-description">
              <h3>描述</h3>
              <p>${doc.description || '无描述'}</p>
            </div>
            <div class="document-content">
              <h3>内容预览</h3>
              <div class="content-text">${contentPreview.replace(/\n/g, '<br>')}</div>
            </div>
          </div>`,
          '文档详情',
          {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '关闭',
            customClass: 'wide-document-dialog'
          }
        );
      } else {
        ElMessage.warning('文档内容为空或未找到');
      }
    } else {
      // 如果没有文档ID，则直接显示片段内容
      ElMessageBox.alert(
        `<div class="document-detail-container">
          <div class="document-detail-header">
            <h2>${fragment.title}</h2>
            <div class="document-meta">
              <span><strong>来源:</strong> ${fragment.source || '未知'}</span>
              <span><strong>相关度:</strong> ${Math.round(fragment.relevance * 100)}%</span>
            </div>
          </div>
          <div class="document-content">
            <h3>内容</h3>
            <div class="content-text">${fragment.content.replace(/\n/g, '<br>')}</div>
          </div>
        </div>`,
        '搜索结果详情',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '关闭',
          customClass: 'wide-document-dialog'
        }
      );
    }
  } catch (error) {
    ElMessage.error('加载详情失败');
    console.error(error);
  }
}

async function showRelatedKnowledge(fragment) {
  try {
    // 设置特定文档的加载状态
    aiLoadingMap.value.set(fragment.id, true)
    
    // 构建提示信息
    const promptText = `请基于以下信息，提供与之相关的网络技术知识、最佳实践或解决方案：
    
标题：${fragment.title}
内容：${fragment.content}

请在回答中包含：
1. 这些信息涉及的核心技术概念
2. 相关的网络协议或技术标准
3. 实际应用场景或最佳实践
4. 可能遇到的常见问题及解决方法

回答要专业、简洁且结构清晰。`

    // 创建一个临时会话来获取AI回复
    const tempHistory = []
    
    // 调用AI
    const aiResponse = await sendAIRequest(promptText, tempHistory)
    
    // 显示AI回复
    ElMessageBox.alert(
      `<div class="document-detail-container">
        <div class="document-detail-header">
          <h2>相关知识：${fragment.title}</h2>
        </div>
        <div class="ai-content">
          ${formatAIResponse(aiResponse)}
        </div>
      </div>`,
      '知识拓展',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '关闭',
        customClass: 'wide-document-dialog ai-knowledge-dialog'
      }
    )
  } catch (error) {
    console.error('获取相关知识失败:', error)
    ElMessage.error('获取相关知识失败，请稍后再试')
  } finally {
    // 清除特定文档的加载状态
    aiLoadingMap.value.set(fragment.id, false)
  }
}

// 调用AI服务获取回复
async function sendAIRequest(message, history = []) {
  // 使用aiService中的方法
  try {
    const response = await import('../services/aiService') // 动态导入AI服务
    return await response.sendMessageToAI(message, history)
  } catch (error) {
    console.error('AI请求失败:', error)
    throw new Error('AI服务暂时不可用，请稍后再试')
  }
}

// 格式化AI响应，将换行符转换为HTML段落
function formatAIResponse(response) {
  if (!response || !response.content) return '无法获取相关知识'
  
  // 将markdown格式的内容转换为HTML
  let formattedContent = response.content
    .replace(/\n\n/g, '</p><p>') // 将双换行转换为段落
    .replace(/\n/g, '<br>') // 将单换行转换为<br>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 处理粗体
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // 处理斜体
  
  // 处理标题
  formattedContent = formattedContent
    .replace(/## (.*?)(\n|<br>)/g, '<h3>$1</h3>') // 二级标题
    .replace(/# (.*?)(\n|<br>)/g, '<h2>$1</h2>') // 一级标题
  
  // 处理列表
  formattedContent = formattedContent
    .replace(/- (.*?)(<br>|<\/p>)/g, '<li>$1</li>$2') // 无序列表项
    .replace(/(\d+)\. (.*?)(<br>|<\/p>)/g, '<li>$2</li>$3') // 有序列表项
    .replace(/<li>(.*?)<\/li>(<br>)*<li>/g, '<li>$1</li><li>') // 清理列表项之间的<br>
  
  // 确保以<p>开始，以</p>结束
  if (!formattedContent.startsWith('<p>')) {
    formattedContent = '<p>' + formattedContent
  }
  if (!formattedContent.endsWith('</p>')) {
    formattedContent = formattedContent + '</p>'
  }
  
  return formattedContent
}
</script>

<style scoped>
.knowledge-container {
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 60px);
}

.knowledge-header {
  padding: 2rem 5rem;
  background: linear-gradient(135deg, var(--el-color-primary-light-9), #fff);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: 800px;
  margin-bottom: 1.5rem;
}

.knowledge-header h1 {
  color: var(--el-color-primary);
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

.knowledge-header p {
  color: var(--el-text-color-secondary);
  font-size: 1.1rem;
  max-width: 600px;
}

.search-container {
  max-width: 800px;
}

.search-input {
  width: 100%;
}

.knowledge-main {
  display: flex;
  padding: 2rem 5rem;
  gap: 2rem;
}

.knowledge-sidebar {
  width: 280px;
  flex-shrink: 0;
}

.sidebar-section {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.sidebar-title {
  font-size: 1.1rem;
  margin-top: 0;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.filter-tag {
  cursor: pointer;
  margin-bottom: 0.5rem;
  transition: all 0.3s;
}

.filter-tag:hover, .filter-tag.active {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.filter-checkboxes, .filter-radios {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.advanced-filters {
  margin-top: 1rem;
}

.knowledge-content {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.content-title h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--el-text-color-primary);
}

.content-title p {
  margin: 0.5rem 0 0;
  color: var(--el-text-color-secondary);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
}

.loading-icon {
  font-size: 3rem;
  color: var(--el-color-primary);
  margin-bottom: 1rem;
}

.default-content, .search-results {
  padding: 0.5rem;
}

.category-section {
  margin-bottom: 2rem;
}

.category-title {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--el-text-color-primary);
}

.category-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.category-card {
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  height: 100%;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.category-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.category-icon .el-icon {
  font-size: 18px;
  color: white;
}

.category-card h4 {
  margin-top: 0;
  margin-bottom: 0.4rem;
  font-size: 1.1rem;
}

.category-card p {
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.category-meta {
  margin-top: auto;
}

.category-list {
  margin-top: 1rem;
}

.topic-link {
  color: var(--el-color-primary);
  cursor: pointer;
}

.topic-link:hover {
  text-decoration: underline;
}

.results-container {
  margin-bottom: 2rem;
}

.results-container.view-card {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

@media (min-width: 1200px) {
  .results-container.view-card {
    grid-template-columns: repeat(3, 1fr); /* 大屏幕上显示3列，每页6个刚好2行 */
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .results-container.view-card {
    grid-template-columns: repeat(2, 1fr); /* 中等屏幕上显示2列，每页6个刚好3行 */
  }
}

@media (max-width: 767px) {
  .results-container.view-card {
    grid-template-columns: 1fr; /* 小屏幕上显示1列 */
  }
}

.results-container.view-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.knowledge-card {
  height: 100%;
  transition: box-shadow 0.3s;
}

.knowledge-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  flex-direction: column;
}

.card-header h3 {
  margin: 0;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
  color: var(--el-text-color-primary);
}

.header-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.card-content {
  margin-bottom: 1.5rem;
}

.card-content p {
  color: var(--el-text-color-regular);
  margin-bottom: 1rem;
}

.source-info {
  font-size: 0.9rem;
}

.source-label {
  color: var(--el-text-color-secondary);
}

.source-text {
  color: var(--el-text-color-regular);
  font-style: italic;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 0.8rem;
}

.card-actions {
  display: flex;
  gap: 0.4rem;
}

.feedback-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.feedback-label {
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.feedback-buttons {
  display: flex;
  gap: 0.5rem;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0 0.5rem;
}

/* 管理员文档分页容器特殊样式 */
.category-section .pagination-container {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--el-border-color-lighter);
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .knowledge-header, .knowledge-main {
    padding: 2rem;
  }
}

@media (max-width: 992px) {
  .knowledge-main {
    flex-direction: column;
  }
  
  .knowledge-sidebar {
    width: 100%;
    margin-bottom: 2rem;
  }
}

@media (max-width: 768px) {
  .knowledge-header {
    padding: 1.5rem;
  }
  
  .knowledge-main {
    padding: 1.5rem;
  }
  
  .results-container.view-card {
    grid-template-columns: 1fr;
  }
  
  .category-cards {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

/* 用户验证解决方案样式 */
.solution-link {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.solution-tag {
  margin-right: 10px;
  flex-shrink: 0;
}

.solution-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.solution-tag-item {
  margin-right: 0;
}

/* 高亮显示用户验证解决方案行 */
.el-table .user-validated-row {
  background-color: rgba(103, 194, 58, 0.05);
}

.el-table .user-validated-row:hover > td {
  background-color: rgba(103, 194, 58, 0.1) !important;
}

.solution-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  max-width: calc(100% - 95px);
  padding-top: 2px;
}
</style>

<!-- 添加全局CSS样式 -->
<style>
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

/* AI知识对话框样式 */
.ai-knowledge-dialog .el-message-box__content {
  max-height: 70vh;
  overflow-y: auto;
}

.ai-content {
  font-family: var(--el-font-family);
  line-height: 1.7;
  color: var(--el-text-color-primary);
}

.ai-content h2 {
  color: var(--el-color-primary);
  margin: 20px 0 10px;
  font-size: 1.3rem;
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 8px;
}

.ai-content h3 {
  color: var(--el-color-success);
  margin: 16px 0 8px;
  font-size: 1.1rem;
}

.ai-content p {
  margin: 10px 0;
}

.ai-content ul, .ai-content ol {
  margin: 10px 0;
  padding-left: 25px;
}

.ai-content li {
  margin: 5px 0;
}

.ai-content strong {
  color: var(--el-color-primary-dark-2);
}

.ai-content em {
  color: var(--el-color-info-dark-2);
}

/* 思维导图对话框样式 */
.mindmap-dialog .el-dialog__body {
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
}

.mindmap-dialog-content {
  min-height: 500px;
}

.mindmap-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  gap: 20px;
}

.mindmap-loading .el-icon {
  font-size: 48px;
  color: var(--el-color-primary);
}

.mindmap-loading p {
  font-size: 16px;
  color: var(--el-text-color-regular);
  margin: 0;
}

.mindmap-error {
  padding: 20px;
}

.mindmap-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mindmap-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.mindmap-info h3 {
  margin: 0 0 8px 0;
  color: var(--el-color-primary);
  font-size: 18px;
}

.mindmap-info p {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.mindmap-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.mindmap-container-wrapper {
  flex: 1;
  min-height: 400px;
  background-color: #fafbfc;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.mindmap-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 20px;
}

.mindmap-container svg {
  max-width: 100%;
  height: auto;
  display: block;
}

.mindmap-footer {
  margin-top: 15px;
}

.mindmap-footer .el-alert {
  background-color: var(--el-color-info-light-9);
  border: 1px solid var(--el-color-info-light-7);
}

.mindmap-footer .el-alert p {
  margin: 5px 0;
  font-size: 13px;
  line-height: 1.5;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .mindmap-dialog {
    width: 95% !important;
  }
  
  .mindmap-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .mindmap-actions {
    justify-content: stretch;
  }
  
  .mindmap-actions .el-button {
    flex: 1;
  }
}
</style> 
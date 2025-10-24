<template>
  <div class="admin-container">
    <div class="admin-header">
      <div class="header-content">
        <h1>管理员控制台</h1>
        <p>管理知识库文档、用户信息和系统设置</p>
      </div>
      
      <div class="header-actions">
        <el-button type="primary" @click="showUploadDialog">
          <el-icon><Plus /></el-icon> 上传文档
        </el-button>
        <el-button type="success" @click="vectorizeAllDocuments" :loading="knowledgeStore.vectorizationProgress.inProgress">
          <el-icon><Connection /></el-icon> 向量化全部文档
        </el-button>
      </div>
    </div>
    
    <!-- 向量化进度条 -->
    <el-card v-if="knowledgeStore.vectorizationProgress.inProgress" class="vectorization-progress">
      <div class="progress-header">
        <h3>文档向量化进度</h3>
        <span>{{ knowledgeStore.vectorizationProgress.processed }}/{{ knowledgeStore.vectorizationProgress.total }}</span>
      </div>
      <el-progress 
        :percentage="Math.round((knowledgeStore.vectorizationProgress.processed / knowledgeStore.vectorizationProgress.total) * 100)" 
        :format="percent => `${percent}%`"
        :stroke-width="20"
      />
      <div class="progress-stats">
        <span class="success">成功: {{ knowledgeStore.vectorizationProgress.success }}</span>
        <span class="failed">失败: {{ knowledgeStore.vectorizationProgress.failed }}</span>
      </div>
    </el-card>
    
    <div class="admin-main">
      <el-tabs v-model="activeTab" class="admin-tabs">
        <el-tab-pane label="知识库文档" name="documents">
          <div class="tab-header">
            <div class="tab-title">
              <h2>知识库文档管理</h2>
              <p>共 {{ documents.length }} 份文档</p>
            </div>
            
            <div class="tab-actions">
              <el-input
                v-model="searchQuery"
                placeholder="搜索文档"
                class="search-input"
                clearable
                @input="filterDocuments"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              
              <el-select v-model="documentType" placeholder="文档类型" @change="filterDocuments">
                <el-option label="全部类型" value="" />
                <el-option label="RFC文档" value="rfc" />
                <el-option label="配置指南" value="config" />
                <el-option label="故障排查" value="troubleshoot" />
                <el-option label="案例分析" value="case" />
              </el-select>
              
              <el-button 
                type="danger" 
                @click="confirmBatchDelete" 
                :disabled="selectedDocuments.length === 0"
                plain
              >
                <el-icon><Delete /></el-icon> 批量删除 <span v-if="selectedDocuments.length > 0">({{ selectedDocuments.length }})</span>
              </el-button>
            </div>
          </div>
          
          <el-table 
            :data="paginatedDocuments" 
            stripe 
            style="width: 100%"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="title" label="标题" min-width="250">
              <template #default="scope">
                <span class="document-title-cell" :title="scope.row.title">{{ scope.row.title }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="120">
              <template #default="scope">
                <el-tag :type="getTypeTagType(scope.row.type)">
                  {{ getTypeLabel(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="120" />
            <el-table-column prop="uploadDate" label="上传日期" width="150">
              <template #default="scope">
                {{ formatDate(scope.row.uploadDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="size" label="大小" width="100" />
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button size="small" type="primary" plain @click="viewDocument(scope.row)">
                  查看
                </el-button>
                <el-button size="small" type="danger" plain @click="confirmDelete(scope.row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[6, 12, 24, 48]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredDocuments.length"
            />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="用户管理" name="users">
          <el-empty description="用户管理功能即将上线" />
        </el-tab-pane>
        
        <el-tab-pane label="系统设置" name="settings">
          <div class="settings-container">
            <el-row :gutter="0" class="settings-row">
              <!-- 左侧设置导航 -->
              <el-col :span="6" class="settings-menu-col">
                <el-menu
                  :default-active="activeSettingMenu"
                  class="settings-menu"
                  @select="handleSettingMenuSelect"
                >
                  <el-menu-item index="ai">
                    <el-icon><Cpu /></el-icon>
                    <span>AI功能设置</span>
                  </el-menu-item>
                  <el-menu-item index="database">
                    <el-icon><DataAnalysis /></el-icon>
                    <span>数据库管理</span>
                  </el-menu-item>
                  <el-menu-item index="system">
                    <el-icon><Setting /></el-icon>
                    <span>系统参数</span>
                  </el-menu-item>
                </el-menu>
              </el-col>
              
              <!-- 右侧设置内容 -->
              <el-col :span="18" class="settings-content-col">
                <!-- AI功能设置 -->
                <el-card v-if="activeSettingMenu === 'ai'" class="settings-card">
                  <template #header>
                    <div class="card-header">
                      <h3>AI功能设置</h3>
                      <span>调整AI模型行为与特性</span>
                    </div>
                  </template>
                  <div class="card-content">
                    <div class="settings-action">
                      <div class="action-description">
                        <h4>小模型信息补充机制</h4>
                        <p>启用后，系统会使用小模型先判断用户问题是否需要补充信息，在必要时主动询问用户。禁用后将直接使用大模型回答，不进行预判断。</p>
                      </div>
                      <el-switch
                        v-model="smallModelEnabled"
                        active-text="已启用"
                        inactive-text="已禁用"
                        @change="updateSmallModelSetting"
                      />
                    </div>
                  </div>
                </el-card>
                
                <!-- 数据库管理 -->
                <el-card v-if="activeSettingMenu === 'database'" class="settings-card">
                  <template #header>
                    <div class="card-header">
                      <h3>数据库管理</h3>
                      <span>管理应用数据存储</span>
                    </div>
                  </template>
                  <div class="card-content">
                    <p class="warning-text">警告：以下操作会删除应用数据，请谨慎操作。</p>
                    
                    <div class="settings-action">
                      <div class="action-description">
                        <h4>清除问题分析数据</h4>
                        <p>清空所有问题频率、分类和统计数据。这将重置仪表盘中显示的热门问题和问题分类数据。</p>
                      </div>
                      <el-button 
                        type="warning" 
                        @click="confirmClearAnalytics"
                        :loading="clearingAnalytics"
                        >清除分析数据</el-button>
                    </div>
                    
                    <el-divider />
                    
                    <div class="settings-action">
                      <div class="action-description">
                        <h4>重置向量数据库</h4>
                        <p>清空所有文档的向量数据，在遇到向量相关问题时使用。文档内容不会被删除，可以重新向量化。</p>
                      </div>
                      <el-button 
                        type="danger" 
                        @click="confirmResetVectorDB"
                        :loading="resetingVectorDB"
                        >重置向量库</el-button>
                    </div>
                    
                    <el-divider />
                    
                    <div class="settings-action">
                      <div class="action-description">
                        <h4>重置所有数据库</h4>
                        <p>删除所有IndexedDB数据，包括文档、向量和应用设置。适用于应用出现严重数据问题时。</p>
                      </div>
                      <el-button 
                        type="danger" 
                        @click="confirmResetAllDB"
                        :loading="resetingAllDB"
                        >全部重置</el-button>
                    </div>
                  </div>
                </el-card>
                
                <!-- 系统参数 -->
                <el-card v-if="activeSettingMenu === 'system'" class="settings-card">
                  <template #header>
                    <div class="card-header">
                      <h3>系统参数</h3>
                      <span>调整系统基本参数</span>
                    </div>
                  </template>
                  <div class="card-content">
                    <el-empty description="系统参数设置即将上线" />
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 上传文档对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="批量上传知识库文档" width="600px">
      <div v-if="uploadProgress.inProgress" class="upload-progress-container">
        <div class="progress-header">
          <h3>正在上传文档</h3>
          <span>{{ uploadProgress.processed }}/{{ uploadProgress.total }}</span>
        </div>
        <el-progress 
          :percentage="Math.round((uploadProgress.processed / uploadProgress.total) * 100)" 
          :format="percent => `${percent}%`"
          :stroke-width="20"
        />
        <div class="progress-stats">
          <span class="success">成功: {{ uploadProgress.success }}</span>
          <span class="failed">失败: {{ uploadProgress.failed }}</span>
        </div>
        <div v-if="uploadProgress.currentFile" class="current-file">
          <p>正在处理: <span>{{ truncateFileName(uploadProgress.currentFile) }}</span></p>
        </div>
      </div>
      
      <el-form v-else :model="uploadForm" label-position="top" :rules="uploadRules" ref="uploadFormRef">
        <el-form-item label="文档标题（可选）" prop="title">
          <el-tooltip content="如果提供标题，将作为文件名前缀；否则使用原始文件名" placement="top">
            <el-input v-model="uploadForm.title" placeholder="输入文档标题（可选）" />
          </el-tooltip>
        </el-form-item>
        
        <el-form-item label="文档类型" prop="type">
          <el-select v-model="uploadForm.type" placeholder="选择文档类型" style="width: 100%">
            <el-option label="基础理论" value="theory" />
            <el-option label="学习方法" value="method" />
            <el-option label="认知诊断" value="diagnosis" />
            <el-option label="案例分析" value="case" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="文档分类" prop="category">
          <el-select v-model="uploadForm.category" placeholder="选择文档分类" style="width: 100%">
            <el-option label="数学" value="math" />
            <el-option label="编程" value="programming" />
            <el-option label="科学" value="science" />
            <el-option label="语言" value="language" />
            <el-option label="学习策略" value="learning-strategy" />
            <el-option label="认知心理学" value="cognitive-psychology" />
            <el-option label="教育方法" value="education-method" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="文档描述（可选）" prop="description">
          <el-input v-model="uploadForm.description" type="textarea" rows="4" placeholder="简要描述文档内容（可选）" />
        </el-form-item>
        
        <el-form-item label="上传文件" prop="file">
          <el-upload
            class="upload-container"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="10"
            :multiple="true"
            :accept="'.docx'"
            :file-list="[]"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">
                支持多个DOCX文件同时上传，每个文件不超过100MB
              </div>
            </template>
          </el-upload>
          <div v-if="uploadForm.files && uploadForm.files.length > 0" class="selected-files">
            <div class="selected-files-header">
              <h4>已选择 {{ uploadForm.files.length }} 个文件:</h4>
              <el-button type="primary" link @click="clearSelectedFiles">清空</el-button>
            </div>
            <el-scrollbar height="120px">
              <div v-for="(file, index) in uploadForm.files" :key="index" class="selected-file">
                <div class="file-info">
                  <el-icon class="file-icon"><Document /></el-icon>
                  <span class="file-name" :title="file.name">{{ truncateFileName(file.name) }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
                <el-button type="danger" size="small" circle @click="removeSelectedFile(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </el-scrollbar>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="uploadDocuments" :loading="uploading">上传</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="400px">
      <p>确定要删除文档 <strong>{{ selectedDocument?.title }}</strong> 吗？此操作不可撤销。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="deleteDocument" :loading="deleting">删除</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 批量删除确认对话框 -->
    <el-dialog v-model="batchDeleteDialogVisible" title="批量删除确认" width="450px">
      <p>确定要删除选中的 <strong>{{ selectedDocuments.length }}</strong> 个文档吗？此操作不可撤销。</p>
      <div class="batch-delete-list" v-if="selectedDocuments.length > 0">
        <p class="batch-delete-hint">已选择以下文档：</p>
        <el-scrollbar height="200px">
          <ul class="batch-document-list">
            <li v-for="doc in selectedDocuments" :key="doc.id" class="batch-document-item">
              <el-tag 
                :type="getTypeTagType(doc.type)" 
                size="small" 
                class="document-type-tag"
              >{{ getTypeLabel(doc.type) }}</el-tag>
              {{ doc.title }}
            </li>
          </ul>
        </el-scrollbar>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDeleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="batchDeleteDocuments" :loading="batchDeleting">
            批量删除
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 查看文档对话框 -->
    <el-dialog v-model="viewDialogVisible" title="文档内容" width="80%" fullscreen>
      <div v-if="selectedDocument" class="document-view">
        <div class="document-header">
          <h2>{{ selectedDocument.title }}</h2>
          <div class="document-meta">
            <el-tag :type="getTypeTagType(selectedDocument.type)">
              {{ getTypeLabel(selectedDocument.type) }}
            </el-tag>
            <span>分类: {{ selectedDocument.category }}</span>
            <span>上传日期: {{ formatDate(selectedDocument.uploadDate) }}</span>
            <span>大小: {{ selectedDocument.size }}</span>
          </div>
          <p class="document-description">{{ selectedDocument.description }}</p>
        </div>
        
        <el-divider></el-divider>
        
        <div class="document-content">
          <div v-if="documentContent" class="content-text">
            <p v-for="(paragraph, index) in documentParagraphs" :key="index">
              {{ paragraph }}
            </p>
          </div>
          <div v-else class="content-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在加载文档内容...</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="downloadDocument(selectedDocument)">
            <el-icon><Download /></el-icon> 下载
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useKnowledgeStore } from '../stores/knowledgeStore'
import { useAppConfigStore } from '../stores/appConfigStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Upload, UploadFilled, Loading, Download, Plus, Delete, View, EditPen, Connection, Document, Setting, DataAnalysis, Cpu } from '@element-plus/icons-vue'
import analyticsService from '../services/analyticsService'

const knowledgeStore = useKnowledgeStore()
const appConfigStore = useAppConfigStore()

// 小模型设置
const smallModelEnabled = ref(true) // 默认启用状态

// Tab management
const activeTab = ref('documents')

// Document management
const documents = ref([])
const filteredDocuments = ref([])
const searchQuery = ref('')
const documentType = ref('')
const currentPage = ref(1)
const pageSize = ref(6)
const selectedDocument = ref(null)
const selectedDocuments = ref([])

// Upload dialog
const uploadDialogVisible = ref(false)
const uploadFormRef = ref(null)
const uploading = ref(false)
const uploadForm = reactive({
  title: '',
  type: '',
  category: '',
  description: '',
  files: []
})

// 上传进度管理
const uploadProgress = reactive({
  inProgress: false,
  total: 0,
  processed: 0,
  success: 0,
  failed: 0,
  currentFile: ''
})

// Delete dialog
const deleteDialogVisible = ref(false)
const deleting = ref(false)

// View dialog
const viewDialogVisible = ref(false)
const documentContent = ref(null)
const documentParagraphs = ref([])

// 数据库重置相关
const resetingVectorDB = ref(false);
const resetingAllDB = ref(false);
const clearingAnalytics = ref(false);

// Batch delete dialog
const batchDeleteDialogVisible = ref(false)
const batchDeleting = ref(false)

// Watch for selected document changes to load content
watch(() => viewDialogVisible.value, (newVal) => {
  if (newVal && selectedDocument.value) {
    loadDocumentContent(selectedDocument.value);
  } else {
    documentContent.value = null;
    documentParagraphs.value = [];
  }
});

// 监听分页变化，确保不超出可用页数
watch([() => filteredDocuments.value.length, pageSize], () => {
  const maxPage = Math.ceil(filteredDocuments.value.length / pageSize.value) || 1;
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage;
  }
});

// Validation rules
const uploadRules = reactive({
  title: [
    { required: false, message: '请输入文档标题（可选）', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度应在2到100个字符之间', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择文档类型', trigger: 'change' }
  ],
  category: [
    { required: true, message: '请选择文档分类', trigger: 'change' }
  ],
  description: [
    { required: false, message: '请输入文档描述', trigger: 'blur' },
    { min: 0, max: 500, message: '描述长度应在0到500个字符之间', trigger: 'blur' }
  ],
  files: [
    { 
      validator: (rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少上传一个文档文件'));
        } else {
          callback();
        }
      }, 
      trigger: 'change' 
    }
  ]
})

// Load documents on mount
onMounted(async () => {
  await loadDocuments()
  
  // 初始化小模型设置
  smallModelEnabled.value = appConfigStore.smallModelEnabled
})

// Load documents from store
async function loadDocuments() {
  try {
    // In a real implementation, this would fetch documents from the backend
    // For now, we'll use mock data
    await knowledgeStore.getAdminDocuments()
    documents.value = knowledgeStore.adminDocuments
    filterDocuments()
  } catch (error) {
    ElMessage.error('加载文档失败')
    console.error(error)
  }
}

// Filter documents based on search query and type
function filterDocuments() {
  let filtered = documents.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(doc => 
      doc.title.toLowerCase().includes(query) || 
      doc.category.toLowerCase().includes(query)
    )
  }

  if (documentType.value) {
    filtered = filtered.filter(doc => doc.type === documentType.value)
  }

  filteredDocuments.value = filtered
  
  // Reset to first page whenever filters change
  currentPage.value = 1
}

// Show upload dialog
function showUploadDialog() {
  uploadDialogVisible.value = true
  resetUploadForm()
}

// Handle file change in upload
function handleFileChange(file) {
  // Check file size (100MB limit)
  const maxSize = 100 * 1024 * 1024; // 100MB in bytes
  if (file.size > maxSize) {
    ElMessage.error(`文件大小超过限制，最大允许 100MB`);
    return false;
  }
  
  // Check if file with same name already exists
  const existingIndex = uploadForm.files.findIndex(existing => 
    existing.name === file.raw.name
  );
  
  if (existingIndex >= 0) {
    // This is a duplicate - remove any previous instance of this file
    uploadForm.files.splice(existingIndex, 1);
    ElMessage.warning(`已替换同名文件 "${file.raw.name}"`);
  }
  
  // Now add the file (we're either adding a unique file or 
  // we've already removed the duplicate)
  uploadForm.files.push(file.raw);
  
  // Ensure unique files in case of any other issues
  deduplicateFiles();
}

// Reset upload form
function resetUploadForm() {
  if (uploadFormRef.value) {
    uploadFormRef.value.resetFields()
  }
  uploadForm.title = ''
  uploadForm.type = ''
  uploadForm.category = ''
  uploadForm.description = ''
  uploadForm.files = []
}

// Upload documents
async function uploadDocuments() {
  if (!uploadFormRef.value) return;
  
  // Validate that at least one file is selected
  if (!uploadForm.files || uploadForm.files.length === 0) {
    ElMessage.warning('请至少选择一个文件');
    return;
  }
  
  await uploadFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    // 初始化上传进度
    uploadProgress.inProgress = true;
    uploadProgress.total = uploadForm.files.length;
    uploadProgress.processed = 0;
    uploadProgress.success = 0;
    uploadProgress.failed = 0;
    uploadProgress.currentFile = '';
    
    uploading.value = true;
    try {
      // 替换原来的实现，使用自定义文件上传逻辑
      const uploadResults = {
        savedDocuments: [],
        progress: {
          total: uploadForm.files.length,
          success: 0,
          failed: 0,
          details: []
        }
      };
      
      // 逐个上传文件，实时更新进度
      for (let i = 0; i < uploadForm.files.length; i++) {
        const file = uploadForm.files[i];
        uploadProgress.currentFile = file.name;
        
        try {
          // 包装单个文件作为数组上传
          const result = await knowledgeStore.uploadDocuments({
            title: uploadForm.title,
            type: uploadForm.type,
            category: uploadForm.category,
            description: uploadForm.description,
            files: [file]
          });
          
          // 更新整体进度
          if (result.savedDocuments && result.savedDocuments.length > 0) {
            uploadResults.savedDocuments.push(...result.savedDocuments);
            uploadProgress.success++;
            uploadResults.progress.success++;
            uploadResults.progress.details.push(...result.progress.details);
          } else {
            uploadProgress.failed++;
            uploadResults.progress.failed++;
          }
        } catch (error) {
          console.error(`处理文件 ${file.name} 失败:`, error);
          uploadProgress.failed++;
          uploadResults.progress.failed++;
          uploadResults.progress.details.push({
            fileName: file.name,
            status: 'failed',
            error: error.message
          });
        } finally {
          uploadProgress.processed++;
        }
        
        // 小延迟，让UI有时间更新
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 处理最终上传结果
      const { progress } = uploadResults;
      
      if (progress.success === progress.total) {
        // 全部成功
        ElMessage.success(`成功上传 ${progress.success} 个文档`);
      } else if (progress.success > 0 && progress.failed > 0) {
        // 部分成功，部分失败
        ElMessage({
          message: `已上传 ${progress.success} 个文档，${progress.failed} 个文档失败`,
          type: 'warning'
        });
        
        // 可以在控制台输出详细信息，方便调试
        console.log('文档上传详情:', progress.details);
      } else if (progress.failed === progress.total) {
        // 全部失败
        ElMessage.error('所有文档上传失败');
      }
      
      // 重置上传进度状态
      setTimeout(() => {
        uploadProgress.inProgress = false;
        uploadDialogVisible.value = false;
      }, 1000); // 给用户一点时间看到完成状态
      
      await loadDocuments();
    } catch (error) {
      ElMessage.error('文档上传失败: ' + error.message);
      console.error(error);
      uploadProgress.inProgress = false;
    } finally {
      uploading.value = false;
    }
  });
}

// View document
async function viewDocument(document) {
  selectedDocument.value = document;
  viewDialogVisible.value = true;
  await loadDocumentContent(document);
}

// Confirm delete
function confirmDelete(document) {
  selectedDocument.value = document
  deleteDialogVisible.value = true
}

// Delete document
async function deleteDocument() {
  if (!selectedDocument.value) return
  
  deleting.value = true
  try {
    await knowledgeStore.deleteDocument(selectedDocument.value.id)
    
    ElMessage.success('文档删除成功')
    deleteDialogVisible.value = false
    await loadDocuments()
  } catch (error) {
    ElMessage.error('文档删除失败')
    console.error(error)
  } finally {
    deleting.value = false
  }
}

// Helper functions
function getTypeTagType(type) {
  const types = {
    theory: 'info',
    method: 'success',
    diagnosis: 'warning',
    case: 'danger'
  }
  return types[type] || 'info'
}

function getTypeLabel(type) {
  const labels = {
    theory: '基础理论',
    method: '学习方法',
    diagnosis: '认知诊断',
    case: '案例分析'
  }
  return labels[type] || type
}

// Load document content
async function loadDocumentContent(document) {
  try {
    if (!document || !document.id) {
      console.error('Invalid document');
      return;
    }
    
    documentContent.value = null;
    documentParagraphs.value = [];
    
    const doc = await knowledgeStore.getDocumentContent(document.id);
    if (doc && doc.content) {
      documentContent.value = doc.content;
      // Split content into paragraphs
      documentParagraphs.value = doc.content.split('\n').filter(p => p.trim().length > 0);
    } else {
      ElMessage.warning('文档内容为空或未找到');
    }
  } catch (error) {
    ElMessage.error('加载文档内容失败');
    console.error(error);
  }
}

// Download document
function downloadDocument(document) {
  if (!document) return;
  
  try {
    // Create a Blob from the content
    const blob = new Blob([document.content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const link = document.createElement('a');
    link.href = url;
    link.download = document.fileName || `${document.title}.txt`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
    ElMessage.success('文档下载成功');
  } catch (error) {
    ElMessage.error('文档下载失败');
    console.error(error);
  }
}

// 向量化所有文档
async function vectorizeAllDocuments() {
  try {
    const result = await knowledgeStore.vectorizeAllDocuments()
    
    if (result.total === 0) {
      ElMessage.info('所有文档已完成向量化')
    } else {
      ElMessage({
        message: `向量化完成: 总数 ${result.total}, 成功 ${result.success}, 失败 ${result.failed}`,
        type: result.failed === 0 ? 'success' : 'warning',
        duration: 5000
      })
    }
  } catch (error) {
    console.error('向量化文档失败:', error)
    ElMessage.error('向量化文档过程中发生错误')
  }
}

// 向量化单个文档
async function vectorizeDocument(document) {
  try {
    await knowledgeStore.vectorizeDocuments(document)
    ElMessage.success(`文档 "${document.title}" 向量化成功`)
  } catch (error) {
    console.error('向量化文档失败:', error)
    ElMessage.error(`文档 "${document.title}" 向量化失败`)
  }
}

// 重置向量数据库
async function confirmResetVectorDB() {
  try {
    await ElMessageBox.confirm(
      '确定要重置向量数据库吗？所有文档的向量数据将被删除，需要重新向量化。',
      '确认操作',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    await resetVectorDB();
  } catch {
    // 用户取消操作
  }
}

async function resetVectorDB() {
  resetingVectorDB.value = true;
  try {
    // 打开向量数据库并删除所有内容
    const dbName = 'ip-expert-vector-db';
    const request = indexedDB.open(dbName);
    
    await new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const db = event.target.result;
        // 获取所有存储对象
        const storeNames = Array.from(db.objectStoreNames);
        
        // 关闭连接
        db.close();
        
        // 删除数据库
        const deleteRequest = indexedDB.deleteDatabase(dbName);
        
        deleteRequest.onsuccess = () => {
          ElMessage.success('向量数据库已重置');
          resolve();
        };
        
        deleteRequest.onerror = () => {
          reject(new Error('删除向量数据库失败'));
        };
      };
      
      request.onerror = () => {
        reject(new Error('打开向量数据库失败'));
      };
    });
    
    // 重置文档的向量化状态
    const documents = [...knowledgeStore.adminDocuments];
    for (const doc of documents) {
      if (doc.vectorized) {
        // 更新文档状态
        await updateDocumentVectorizedStatus(doc.id, false);
      }
    }
    
    // 重新加载文档列表
    await loadDocuments();
    
  } catch (error) {
    console.error('重置向量数据库失败:', error);
    ElMessage.error('重置向量数据库失败: ' + error.message);
  } finally {
    resetingVectorDB.value = false;
  }
}

// 更新文档向量化状态
async function updateDocumentVectorizedStatus(docId, status) {
  const dbName = 'ip-expert-docs-db';
  const storeName = 'documents';
  const dbVersion = 2;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const getRequest = store.get(docId);
      getRequest.onsuccess = () => {
        const doc = getRequest.result;
        if (doc) {
          doc.vectorized = status;
          if (!status) {
            doc.vectorizedAt = null;
          }
          
          const updateRequest = store.put(doc);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(new Error('更新文档状态失败'));
        } else {
          reject(new Error('未找到文档'));
        }
      };
      
      getRequest.onerror = () => reject(new Error('获取文档失败'));
    };
    
    request.onerror = () => reject(new Error('打开文档数据库失败'));
  });
}

// 重置所有数据库
async function confirmResetAllDB() {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有数据库吗？这将删除所有文档、向量数据和应用设置，无法恢复。',
      '危险操作',
      {
        confirmButtonText: '确定重置所有数据',
        cancelButtonText: '取消',
        type: 'danger'
      }
    );
    
    await resetAllDatabases();
  } catch {
    // 用户取消操作
  }
}

async function resetAllDatabases() {
  resetingAllDB.value = true;
  try {
    // 数据库列表
    const dbNames = [
      'ip-expert-docs-db',
      'ip-expert-vector-db',
      'ip-expert-app-storage'
    ];
    
    // 逐个删除数据库
    for (const dbName of dbNames) {
      await new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = () => {
          reject(new Error(`删除数据库 ${dbName} 失败`));
        };
      });
    }
    
    ElMessage.success('所有数据库已重置');
    
    // 清空数据
    documents.value = [];
    filteredDocuments.value = [];
    
    ElMessageBox.alert(
      '所有数据库已重置，请刷新页面以重新初始化应用。',
      '操作成功',
      {
        confirmButtonText: '刷新页面',
        callback: () => {
          window.location.reload();
        }
      }
    );
  } catch (error) {
    console.error('重置所有数据库失败:', error);
    ElMessage.error('重置所有数据库失败: ' + error.message);
  } finally {
    resetingAllDB.value = false;
  }
}

// 格式化日期显示
function formatDate(dateString) {
  if (!dateString) return '';
  
  // 如果已经是本地日期格式，直接返回
  if (typeof dateString === 'string' && dateString.includes('/')) {
    return dateString;
  }
  
  try {
    // 尝试转换为本地日期格式
    return new Date(dateString).toLocaleDateString('zh-CN');
  } catch (e) {
    return dateString;
  }
}

// Handle selection change
function handleSelectionChange(selection) {
  selectedDocuments.value = selection;
}

// Confirm batch delete
function confirmBatchDelete() {
  if (selectedDocuments.value.length === 0) {
    ElMessage.warning('请先选择要删除的文档');
    return;
  }
  
  batchDeleteDialogVisible.value = true;
}

// Batch delete documents
async function batchDeleteDocuments() {
  if (selectedDocuments.value.length === 0) return;
  
  batchDeleting.value = true;
  try {
    // 记录删除成功和失败的数量
    let successCount = 0;
    let failCount = 0;
    
    // 使用Promise.all并行删除多个文档
    await Promise.all(
      selectedDocuments.value.map(async (doc) => {
        try {
          await knowledgeStore.deleteDocument(doc.id);
          successCount++;
        } catch (error) {
          console.error(`删除文档 ${doc.title} 失败:`, error);
          failCount++;
        }
      })
    );
    
    if (successCount > 0) {
      ElMessage.success(`成功删除 ${successCount} 个文档`);
    }
    
    if (failCount > 0) {
      ElMessage.warning(`${failCount} 个文档删除失败`);
    }
    
    batchDeleteDialogVisible.value = false;
    // 重新加载文档列表
    await loadDocuments();
  } catch (error) {
    ElMessage.error('批量删除文档失败');
    console.error(error);
  } finally {
    batchDeleting.value = false;
  }
}

// Format file size
function formatFileSize(size) {
  if (size < 1024) {
    return size + ' B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB';
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
}

// Clear selected files
function clearSelectedFiles() {
  uploadForm.files = [];
}

// Remove selected file
function removeSelectedFile(index) {
  uploadForm.files.splice(index, 1);
}

// Function to ensure all files are unique by filename
function deduplicateFiles() {
  const uniqueFiles = [];
  const fileNames = new Set();
  
  // Keep only one instance of each filename
  for (const file of uploadForm.files) {
    if (!fileNames.has(file.name)) {
      fileNames.add(file.name);
      uniqueFiles.push(file);
    }
  }
  
  // Replace the files array with the deduplicated one
  uploadForm.files = uniqueFiles;
}

// Function to truncate file name if it's too long
function truncateFileName(fileName) {
  const maxLength = 35;
  
  if (fileName.length <= maxLength) {
    return fileName;
  }
  
  // Get file extension
  const lastDotIndex = fileName.lastIndexOf('.');
  const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  
  // Calculate how much of the name we can show
  const nameWithoutExt = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3) + '...';
  
  return truncatedName + extension;
}

// 确认清除分析数据
function confirmClearAnalytics() {
  ElMessageBox.confirm(
    '确定要清除所有问题分析数据吗？这将删除所有热门问题和分类数据。',
    '清除确认',
    {
      confirmButtonText: '确定清除',
      cancelButtonText: '取消',
      type: 'warning',
      draggable: true,
    }
  )
    .then(() => {
      clearAnalyticsData();
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '已取消清除',
      });
    });
}

// 清除分析数据
async function clearAnalyticsData() {
  try {
    clearingAnalytics.value = true;
    
    const result = await analyticsService.clearAllAnalyticsData();
    
    if (result) {
      ElMessage.success('分析数据已成功清除');
    } else {
      ElMessage.error('清除分析数据时出现错误');
    }
  } catch (error) {
    console.error('清除分析数据失败:', error);
    ElMessage.error('清除分析数据失败: ' + error.message);
  } finally {
    clearingAnalytics.value = false;
  }
}

// 更新小模型设置
async function updateSmallModelSetting() {
  const result = await appConfigStore.setSmallModelEnabled(smallModelEnabled.value);
  if (result) {
    ElMessage.success('小模型信息补充设置已更新');
  } else {
    ElMessage.error('更新小模型设置失败');
    // 如果保存失败，恢复原始值
    smallModelEnabled.value = appConfigStore.smallModelEnabled;
  }
}

// 计算当前页面需要显示的文档
const paginatedDocuments = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return filteredDocuments.value.slice(startIndex, endIndex);
});

// 系统设置相关
const activeSettingMenu = ref('ai');

function handleSettingMenuSelect(index) {
  activeSettingMenu.value = index;
}
</script>

<style scoped>
.admin-container {
  width: 100%;
  min-height: calc(100vh - 60px);
  background-color: var(--el-bg-color-page);
  padding: 2rem;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-content h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--el-text-color-primary);
}

.header-content p {
  margin: 0.5rem 0 0;
  color: var(--el-text-color-secondary);
  font-size: 1.1rem;
}

.admin-main {
  background-color: var(--el-bg-color);
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.admin-tabs {
  width: 100%;
  height: 100%;
}

.admin-tabs :deep(.el-tabs__content) {
  height: calc(100% - 40px);
  padding-top: 20px;
}

.admin-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.tab-title h2 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  color: var(--el-text-color-primary);
}

.tab-title p {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.tab-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  width: 300px;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.upload-container {
  width: 100%;
}

.upload-container .el-upload {
  width: 100%;
}

.upload-container .el-upload-dragger {
  width: 100%;
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.el-icon--upload {
  font-size: 48px;
  color: var(--el-color-primary);
  margin-bottom: 16px;
}

.el-upload__text {
  font-size: 16px;
}

.el-upload__tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* Document viewer styles */
.document-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
}

.document-header {
  margin-bottom: 1.5rem;
}

.document-header h2 {
  font-size: 1.8rem;
  margin: 0 0 1rem;
  color: var(--el-text-color-primary);
}

.document-meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  color: var(--el-text-color-secondary);
}

.document-description {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  background-color: var(--el-bg-color-page);
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.document-content {
  flex: 1;
  padding: 1.5rem;
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
  overflow-y: auto;
}

.content-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--el-text-color-primary);
}

.content-text p {
  margin-bottom: 1rem;
}

.content-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  gap: 1rem;
  color: var(--el-text-color-secondary);
}

.content-loading .el-icon {
  font-size: 2rem;
  color: var(--el-color-primary);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .admin-container {
    padding: 1rem;
  }
  
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    margin-top: 1rem;
  }
  
  .tab-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .tab-actions {
    margin-top: 1rem;
    width: 100%;
    flex-direction: column;
  }
  
  .search-input {
    width: 100%;
  }
  
  .document-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .document-content {
    padding: 1rem;
  }
}

.vectorization-progress {
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-header h3 {
  margin: 0;
  font-size: 16px;
}

.progress-stats {
  display: flex;
  margin-top: 10px;
  font-size: 14px;
}

.progress-stats .success {
  color: #67c23a;
  margin-right: 20px;
}

.progress-stats .failed {
  color: #f56c6c;
}

.settings-container {
  max-width: 100%;
  margin: 0;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  height: calc(100vh - 240px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-row {
  flex: 1;
  height: 100%;
  margin: 0 !important;
}

.settings-menu-col {
  height: 100%;
  padding: 0 !important;
  border-right: 1px solid var(--el-border-color-light);
  background-color: #f8f9fa;
}

.settings-content-col {
  height: 100%;
  padding: 0 !important;
  overflow-y: auto;
}

.settings-card {
  margin: 0;
  height: 100%;
  border: none;
  box-shadow: none;
}

.settings-card .el-card__header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: #fafbfc;
}

.settings-card .el-card__body {
  padding: 24px;
  height: calc(100% - 72px);
  overflow-y: auto;
}

.card-header {
  display: flex;
  flex-direction: column;
}

.card-header h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
}

.card-header span {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.warning-text {
  color: var(--el-color-danger);
  font-weight: bold;
  margin-bottom: 20px;
}

.settings-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 16px;
  border-radius: 4px;
  background-color: #f9f9f9;
  transition: background-color 0.2s;
}

.settings-action:hover {
  background-color: #f5f7fa;
}

.action-description {
  flex: 1;
}

.action-description h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.action-description p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.4;
}

/* Batch delete styles */
.batch-delete-list {
  margin-top: 15px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 10px;
}

.batch-delete-hint {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
}

.batch-document-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.batch-document-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 14px;
  display: flex;
  align-items: center;
}

.batch-document-item:last-child {
  border-bottom: none;
}

.document-type-tag {
  margin-right: 8px;
}

.selected-files {
  margin-top: 15px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 12px;
  background-color: var(--el-bg-color-page);
}

.selected-files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 8px;
}

.selected-files-header h4 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.selected-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.selected-file:hover {
  background-color: var(--el-color-primary-light-9);
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 350px;
  display: inline-block;
  margin-left: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0; /* 这很重要，可以让子元素进行正确的溢出处理 */
}

.file-size {
  margin: 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

/* Upload progress styles */
.upload-progress-container {
  padding: 20px;
}

.upload-progress-container .progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.upload-progress-container .progress-header h3 {
  margin: 0;
  font-size: 18px;
}

.current-file {
  margin-top: 15px;
  padding: 10px;
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
}

.current-file p {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.current-file span {
  font-weight: bold;
  color: var(--el-text-color-primary);
}

/* AI代码块样式优化 */
:deep(.ai-response pre) {
  background-color: #f5f7fa !important;
  color: #333 !important;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  overflow-x: auto;
}

:deep(.ai-response code) {
  background-color: #f5f7fa !important;
  color: #333 !important;
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
}

:deep(.dark .ai-response pre),
:deep(.dark .ai-response code) {
  background-color: #283142 !important;
  color: #e6e6e6 !important;
  border-color: #4c4d4f;
}

/* 文档标题单元格样式 */
.document-title-cell {
  display: inline-block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 系统设置样式 */
.settings-menu {
  height: 100%;
  border-radius: 0;
  border-right: none;
}

.settings-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
  padding-left: 20px;
  font-size: 14px;
}

.settings-menu .el-menu-item.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: bold;
}

.settings-menu .el-icon {
  margin-right: 8px;
  font-size: 18px;
}

.settings-container .el-row {
  min-height: 500px;
}

.settings-container .el-col:first-child {
  border-right: 1px solid var(--el-border-color-light);
  padding-right: 0;
}

@media (max-width: 768px) {
  .settings-container {
    height: auto;
    min-height: calc(100vh - 240px);
  }
  
  .settings-row {
    display: flex;
    flex-direction: column;
  }
  
  .settings-menu-col {
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-light);
    margin-bottom: 0;
    padding-bottom: 0 !important;
    height: auto;
  }
  
  .settings-content-col {
    width: 100%;
    flex: 0 0 100%;
    max-width: 100%;
    height: auto;
  }
  
  .settings-menu {
    display: flex;
    overflow-x: auto;
    height: auto;
    padding: 8px 0;
  }
  
  .settings-menu .el-menu-item {
    flex: 1;
    min-width: 120px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 70px;
    padding: 10px;
  }
  
  .settings-menu .el-menu-item .el-icon {
    margin-right: 0;
    margin-bottom: 5px;
    font-size: 20px;
  }
  
  .settings-card {
    height: auto;
    min-height: 300px;
  }
  
  .settings-card .el-card__body {
    height: auto;
    min-height: 300px;
  }
}
</style> 
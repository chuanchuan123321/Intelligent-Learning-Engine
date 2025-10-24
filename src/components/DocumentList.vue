<template>
  <div class="document-list">
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading loading-icon"><Loading /></el-icon>
      <span>正在加载文档...</span>
    </div>
    
    <div v-else-if="documents.length === 0" class="empty-container">
      <el-empty description="暂无相关文档" />
    </div>
    
    <div v-else class="document-items">
      <div v-for="document in documents" :key="document.id" class="document-item">
        <el-card shadow="hover" class="document-card">
          <div class="document-icon" :class="getDocumentTypeClass(document.type)">
            <el-icon v-if="document.type === 'theory'"><DocumentCopy /></el-icon>
            <el-icon v-else-if="document.type === 'method'"><Setting /></el-icon>
            <el-icon v-else-if="document.type === 'diagnosis'"><WarningFilled /></el-icon>
            <el-icon v-else><Document /></el-icon>
          </div>
          
          <div class="document-content">
            <div class="document-header">
              <h3 class="document-title">{{ document.title }}</h3>
              <el-tag size="small" :type="getTypeTagType(document.type)">
                {{ getTypeLabel(document.type) }}
              </el-tag>
            </div>
            
            <p class="document-description">{{ document.description }}</p>
            
            <div class="document-footer">
              <span class="document-category">{{ document.category }}</span>
              <span class="document-date">{{ document.uploadDate }}</span>
            </div>
          </div>
          
          <div class="document-actions">
            <el-button type="primary" plain size="small" @click="viewDocument(document)">
              查看
            </el-button>
            <el-button type="success" plain size="small" @click="downloadDocument(document)">
              下载
            </el-button>
            <el-button type="info" plain size="small" @click="generateMindMap(document)" :loading="loadingMap.get(document.id)">
              <el-icon><Share /></el-icon>
              图谱生成
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { Loading, Document, DocumentCopy, Setting, WarningFilled, Share } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  documents: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['view', 'download', 'generate-mindmap'])

// 用于跟踪每个文档的加载状态
const loadingMap = ref(new Map())

function getDocumentTypeClass(type) {
  const classes = {
    theory: 'type-theory',
    method: 'type-method',
    diagnosis: 'type-diagnosis',
    case: 'type-case'
  }
  return classes[type] || 'type-default'
}

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

function viewDocument(document) {
  emit('view', document)
}

function downloadDocument(document) {
  emit('download', document)
}

function generateMindMap(document) {
  emit('generate-mindmap', document)
}
</script>

<style scoped>
.document-list {
  width: 100%;
}

.loading-container, .empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
}

.loading-icon {
  font-size: 2rem;
  color: var(--el-color-primary);
}

.document-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 0.5rem;
}

.document-item {
  /* 移除过渡动画 */
}

.document-card {
  display: flex;
  height: 100%;
  position: relative;
  padding-bottom: 1.5rem;
}

.document-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.document-icon .el-icon {
  font-size: 24px;
  color: white;
}

.type-theory {
  background-color: var(--el-color-primary);
}

.type-method {
  background-color: var(--el-color-success);
}

.type-diagnosis {
  background-color: var(--el-color-warning);
}

.type-case {
  background-color: var(--el-color-danger);
}

.type-default {
  background-color: var(--el-color-info);
}

.document-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 0.75rem;
  min-height: 110px;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 0.5rem;
  padding-top: 4px;
}

.document-title {
  margin: 0;
  padding-top: 3px;
  font-size: 1.1rem;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  max-height: 3rem;
  flex: 1;
}

.document-description {
  margin: 0 0 0.75rem;
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  flex: 1;
}

.document-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 0.5rem;
}

.document-actions {
  position: absolute;
  bottom: 0.75rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
}

@media (min-width: 1200px) {
  .document-items {
    grid-template-columns: repeat(3, 1fr); /* 在大屏幕上固定为3列 */
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .document-items {
    grid-template-columns: repeat(2, 1fr); /* 在中等屏幕上固定为2列 */
  }
}

@media (max-width: 767px) {
  .document-items {
    grid-template-columns: 1fr; /* 在小屏幕上为单列 */
  }
}
</style> 
<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div class="header-content">
        <h1>学习效果分析看板</h1>
        <p>了解学习路径规划效果和认知诊断系统性能分析</p>
      </div>
      
      <div class="header-actions">
        <el-radio-group v-model="timeRange" size="default">
          <el-radio-button label="day">今日</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
          <el-radio-button label="year">本年</el-radio-button>
        </el-radio-group>
        
        <el-button type="primary" size="default">
          <el-icon><component :is="downloadIcon" /></el-icon> 导出报告
        </el-button>
      </div>
    </div>
    
    <div class="dashboard-overview">
      <el-row :gutter="20">
        <el-col :span="6" :xs="12" :sm="12" :md="6" v-for="(stat, index) in statisticsData" :key="index">
          <el-card class="overview-card" shadow="hover">
            <div class="overview-content">
              <div class="overview-icon" :style="{ backgroundColor: stat.color }">
                <el-icon><component :is="stat.icon" /></el-icon>
              </div>
              <div class="overview-data">
                <div class="overview-value">{{ stat.value }}</div>
                <div class="overview-label">{{ stat.title }}</div>
                <div class="overview-trend" :class="stat.trendType">
                  <el-icon v-if="stat.trendType === 'positive'"><component :is="arrowUpIcon" /></el-icon>
                  <el-icon v-else><component :is="arrowDownIcon" /></el-icon>
                  {{ stat.trend }}% {{ stat.trendType === 'positive' ? '增长' : '下降' }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <div class="dashboard-main">
      <el-row :gutter="24">
        <el-col :span="17" :xs="24" :sm="24" :md="17">
          <div class="chart-wrapper">
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <h3>学习活动趋势</h3>
                  <div class="header-actions">
                    <el-select v-model="trendMetric" size="default" style="width: 180px">
                      <el-option label="诊断次数" value="questions" />
                      <el-option label="学习者数量" value="users" />
                      <el-option label="知识图谱浏览量" value="views" />
                    </el-select>
                  </div>
                </div>
              </template>
              <div ref="trendChartRef" class="trend-chart"></div>
            </el-card>
          </div>
          
          <el-row :gutter="20" class="dashboard-categories">
            <el-col :span="12" :xs="24" :sm="24" :md="12">
              <el-card class="chart-card">
                <template #header>
                  <div class="card-header">
                    <h3>学习需求分类分布</h3>
                    <el-tooltip content="按学习需求类型统计用户诊断数量">
                      <el-icon><component :is="infoFilledIcon" /></el-icon>
                    </el-tooltip>
                  </div>
                </template>
                <div ref="categoryChartRef" class="chart-container"></div>
              </el-card>
            </el-col>
            
            <el-col :span="12" :xs="24" :sm="24" :md="12">
              <el-card class="chart-card">
                <template #header>
                  <div class="card-header">
                    <h3>热门学习主题</h3>
                    <el-tooltip content="学习者最关注的学科和技能领域">
                      <el-icon><component :is="infoFilledIcon" /></el-icon>
                    </el-tooltip>
                  </div>
                </template>
                <div ref="searchChartRef" class="chart-container"></div>
              </el-card>
            </el-col>
          </el-row>
          
          <div class="chart-wrapper">
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <h3>学习路径覆盖热力图</h3>
                  <div class="header-actions">
                    <el-tooltip content="展示各学科领域学习路径的覆盖程度">
                      <el-icon><component :is="infoFilledIcon" /></el-icon>
                    </el-tooltip>
                    <el-button-group style="margin-left: 15px">
                      <el-button size="small">日</el-button>
                      <el-button size="small" type="primary">周</el-button>
                      <el-button size="small">月</el-button>
                    </el-button-group>
                  </div>
                </div>
              </template>
              <div ref="heatmapChartRef" class="heatmap-chart"></div>
            </el-card>
          </div>
        </el-col>
        
        <el-col :span="7" :xs="24" :sm="24" :md="7">
          <div class="right-sidebar">
            <!-- 热门问题查询卡片 -->
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <h3>{{ showQuestionCategories ? '学习需求分类查询' : '热门学习查询' }}</h3>
                  <div class="header-actions">
                    <el-switch
                      v-model="showQuestionCategories"
                      active-text="分类"
                      inactive-text="热门"
                      size="small"
                      style="margin-right: 10px"
                    />
                    <el-radio-group v-model="searchDisplayMode" size="small">
                      <el-radio-button label="table">表格</el-radio-button>
                      <el-radio-button label="chart">图表</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>
              </template>
              
              <!-- 表格视图 -->
              <el-table v-if="searchDisplayMode === 'table'" :data="topSearches" style="width: 100%" stripe>
                <el-table-column prop="term" label="搜索关键词" min-width="140" show-overflow-tooltip />
                <el-table-column prop="count" label="次数" width="70" />
                <el-table-column label="占比" width="100">
                  <template #default="scope">
                    <el-progress 
                      :percentage="Math.round((scope.row.count / (topSearches.reduce((sum, item) => sum + item.count, 0) || 1)) * 100)" 
                      :color="getProgressColor(scope.$index)"
                      :stroke-width="8"
                    />
                  </template>
                </el-table-column>
                <el-table-column v-if="searchDisplayMode === 'table' && showDescriptions" label="描述" min-width="140" show-overflow-tooltip>
                  <template #default="scope">
                    <span class="search-description">{{ scope.row.description || '' }}</span>
                  </template>
                </el-table-column>
              </el-table>
              
              <!-- 图表视图 -->
              <div v-else ref="topSearchesChartRef" class="top-searches-chart"></div>
            </el-card>
            
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <h3>系统性能</h3>
                  <el-tooltip content="认知诊断响应时间和路径推荐性能指标">
                    <el-icon><component :is="infoFilledIcon" /></el-icon>
                  </el-tooltip>
                </div>
              </template>
              
              <div class="performance-metrics">
                <div class="metric-item">
                  <div class="metric-label">平均诊断响应时间</div>
                  <el-progress 
                    :percentage="80" 
                    :format="() => '1.2秒'"
                    :color="'#67C23A'"
                    :stroke-width="15"
                  />
                </div>
                
                <div class="metric-item">
                  <div class="metric-label">认知诊断准确率</div>
                  <el-progress 
                    :percentage="73" 
                    :format="() => '73%'"
                    :color="'#409EFF'"
                    :stroke-width="15"
                  />
                </div>
                
                <div class="metric-item">
                  <div class="metric-label">学习路径匹配度</div>
                  <el-progress 
                    :percentage="68" 
                    :format="() => '68%'"
                    :color="'#E6A23C'"
                    :stroke-width="15"
                  />
                </div>
                
                <div class="metric-item">
                  <div class="metric-label">知识图谱更新频率</div>
                  <el-progress 
                    :percentage="65" 
                    :format="() => '每日'"
                    :color="'#E6A23C'"
                    :stroke-width="15"
                  />
                </div>
              </div>
            </el-card>
            
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <h3>最近反馈</h3>
                  <el-button type="link">查看全部</el-button>
                </div>
              </template>
              
              <div class="feedback-list">
                <div v-for="(feedback, index) in recentFeedback" :key="index" class="feedback-item">
                  <div class="feedback-header">
                    <div class="feedback-user">
                      <el-avatar :size="32" :icon="userIcon" />
                      <span>{{ feedback.user }}</span>
                    </div>
                    <div class="feedback-rating" :class="`rating-${feedback.rating > 3 ? 'positive' : 'negative'}`">
                      <el-rate v-model="feedback.rating" disabled :colors="feedbackColors" />
                    </div>
                  </div>
                  <div class="feedback-content">{{ feedback.content }}</div>
                  <div class="feedback-meta">
                    <span class="feedback-time">{{ feedback.time }}</span>
                    <span class="feedback-topic">{{ feedback.topic }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { markRaw } from 'vue'
import { 
  Document, ChatDotRound, User, Connection, 
  ArrowUp, ArrowDown, InfoFilled, Download
} from '@element-plus/icons-vue'
import { useKnowledgeStore } from '../stores/knowledgeStore'
import { useChatStore } from '../stores/chatStore'
import analyticsService from '../services/analyticsService'

// 导入自定义图表工具类
import chartUtils from '../utils/chartUtils'

const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const chatStore = useChatStore()

const categoryChartRef = ref(null)
const searchChartRef = ref(null)
const trendChartRef = ref(null)
const heatmapChartRef = ref(null)
const topSearchesChartRef = ref(null)
let categoryChart = null
let searchChart = null
let trendChart = null
let heatmapChart = null
let topSearchesChart = null

const timeRange = ref('month')
const trendMetric = ref('questions')
const searchDisplayMode = ref('table')
const showDescriptions = ref(true)
const showQuestionCategories = ref(true)  // 默认显示分类数据

// 处理图标，避免响应式警告
const downloadIcon = markRaw(Download)
const arrowUpIcon = markRaw(ArrowUp)
const arrowDownIcon = markRaw(ArrowDown)
const infoFilledIcon = markRaw(InfoFilled)
const userIcon = markRaw(User)

// 统计数据从analyticsService获取
const statsData = ref({
  totalDocuments: 0,
  monthlyQuestions: 0,
  resolutionRate: '0%',
  ragAccuracy: '73%'
})

// 热门问题数据
const topSearches = ref([])

// 顶部统计卡片数据
const statisticsData = computed(() => [
  {
    title: '知识图谱节点总数',
    value: computed(() => knowledgeStore.statistics.totalDocuments || 0),
    icon: markRaw(Document),
    color: '#409EFF',
    trend: 12,
    trendType: 'positive'
  },
  {
    title: '本月学习诊断次数',
    value: statsData.value.monthlyQuestions,
    icon: markRaw(ChatDotRound),
    color: '#67C23A',
    trend: 8,
    trendType: 'positive'
  },
  {
    title: '学习路径匹配度',
    value: statsData.value.resolutionRate,
    icon: markRaw(User),
    color: '#E6A23C',
    trend: 3,
    trendType: 'positive'
  },
  {
    title: '认知诊断准确率',
    value: statsData.value.ragAccuracy,
    icon: markRaw(Connection),
    color: '#F56C6C',
    trend: 2,
    trendType: 'negative'
  }
]);

// 模拟反馈数据
const recentFeedback = ref([
  {
    user: '张同学',
    rating: 5,
    content: '学习路径规划非常专业，解决了我的数学学习困难',
    time: '30分钟前',
    topic: '数学基础'
  },
  {
    user: '李学员',
    rating: 4,
    content: '对编程思维的诊断很准确，帮我理清了学习思路',
    time: '2小时前',
    topic: '编程思维'
  },
  {
    user: '王学习者',
    rating: 2,
    content: '对我的学习状态理解不够准确，需要多次解释',
    time: '昨天',
    topic: '学习策略'
  }
])

// 饼图颜色
const pieColors = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
  '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
]

// 进度条颜色
const getProgressColor = (index) => {
  return [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', 
    '#909399', '#5470c6', '#91cc75', '#fac858'
  ][index % 8]
}

// 评分颜色
const feedbackColors = ['#F56C6C', '#F56C6C', '#E6A23C', '#67C23A', '#67C23A']

// 加载实际统计数据
async function loadAnalyticsData() {
  try {
    // 获取统计数据
    const stats = await analyticsService.getStatistics()
    statsData.value = {
      totalDocuments: knowledgeStore.statistics.totalDocuments || 0,
      monthlyQuestions: stats.monthlyQuestions || 0,
      resolutionRate: stats.resolutionRate || '0%',
      ragAccuracy: '73%' // 暂时硬编码，后续可从实际数据计算
    }
    
    // 获取热门问题数据
    const hotQuestions = await analyticsService.getTopQuestions(8)
    if (hotQuestions && hotQuestions.length > 0) {
      topSearches.value = hotQuestions
    }
    
    console.log('已加载分析数据', statsData.value)
  } catch (error) {
    console.error('加载分析数据失败:', error)
  }
}

// 初始化趋势图表
async function initTrendChart() {
  if (!trendChartRef.value) return
  
  try {
    // 使用图表工具类创建图表
    if (!trendChart) {
      trendChart = chartUtils.createChart(trendChartRef.value)
    }
    
    // 从分析服务获取实际趋势数据
    const trendData = await analyticsService.getQuestionTrends(timeRange.value)
    
    // 如果没有数据，使用模拟数据
    let dates = trendData.dates
    let questionData = trendData.counts
    
    // 如果没有数据，使用模拟数据
    if (!dates || dates.length === 0) {
      // 模拟30天的数据
      dates = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - 29 + i)
        return date.toLocaleDateString()
      })
      
      questionData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 50) + 10)
    }
    
    const userData = Array.from({ length: dates.length }, () => Math.floor(Math.random() * 30) + 5)
    const viewData = Array.from({ length: dates.length }, () => Math.floor(Math.random() * 100) + 20)
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          const data = params[0];
          return `${data.name}<br>${data.seriesName}: <strong>${data.value}</strong>`;
        }
      },
      title: {
        text: trendMetric.value === 'questions' ? '诊断次数趋势' : 
              trendMetric.value === 'users' ? '学习者数量趋势' : '知识图谱浏览量趋势',
        left: 'center',
        top: 0,
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: 'none'
          },
          restore: {},
          saveAsImage: {}
        },
        right: 20
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        }
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        axisLabel: {
          fontSize: 12,
          margin: 15,
          formatter: function(value) {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          },
          rotate: 0
        }
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: '#eee'
          }
        },
        axisLabel: {
          fontSize: 12
        }
      },
      series: [
        {
          name: trendMetric.value === 'questions' ? '诊断次数' : 
                trendMetric.value === 'users' ? '学习者数量' : '浏览量',
          type: 'line',
          smooth: true,
          symbol: 'emptyCircle',
          symbolSize: 8,
          lineStyle: {
            width: 4,
            color: '#409EFF'
          },
          itemStyle: {
            color: '#409EFF'
          },
          emphasis: {
            itemStyle: {
              borderWidth: 3,
              shadowBlur: 10,
              shadowColor: 'rgba(64, 158, 255, 0.5)'
            }
          },
          areaStyle: {
            color: new chartUtils.echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.7)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ])
          },
          data: trendMetric.value === 'questions' ? questionData : 
                trendMetric.value === 'users' ? userData : viewData,
          markPoint: {
            data: [
              { type: 'max', name: '最大值' },
              { type: 'min', name: '最小值' }
            ]
          },
        }
      ]
    };
    
    trendChart.setOption(option);
  } catch (error) {
    console.error('初始化趋势图表出错:', error);
  }
}

// 初始化分类饼图
function initCategoryChart() {
  if (!categoryChartRef.value) return
  
  // 使用我们的图表工具类创建图表
  if (!categoryChart) {
    categoryChart = chartUtils.createChart(categoryChartRef.value)
  }

  // 使用分析服务获取实际类别数据
  analyticsService.getCategoryData().then(categoryData => {
    // 如果没有数据，使用模拟数据
    if (!categoryData || categoryData.length === 0) {
      categoryData = [
        { name: '数学基础', value: 27 },
        { name: '编程思维', value: 21 },
        { name: '学习策略', value: 16 },
        { name: '科学方法', value: 12 },
        { name: '语言学习', value: 9 },
        { name: '认知诊断', value: 8 },
        { name: '学习方法', value: 7 }
      ]
    }
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      color: pieColors,
      legend: {
        orient: 'vertical',
        left: 10,
        top: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 12
        }
      },
      series: [
        {
          name: '问题分类',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: categoryData
        }
      ]
    }
    
    categoryChart.setOption(option)
  }).catch(error => {
    console.error('加载问题分类数据失败:', error)
    
    // 出错时使用模拟数据
    const fallbackData = [
      { name: '数学基础', value: 27 },
      { name: '编程思维', value: 21 },
      { name: '学习策略', value: 16 },
      { name: '科学方法', value: 12 },
      { name: '语言学习', value: 9 },
      { name: '认知诊断', value: 8 },
      { name: '学习方法', value: 7 }
    ]
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      color: pieColors,
      legend: {
        orient: 'vertical',
        left: 10,
        top: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 12
        }
      },
      series: [
        {
          name: '问题分类',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: fallbackData
        }
      ]
    }
    
    categoryChart.setOption(option)
  })
}

// 初始化搜索词云图
function initSearchChart() {
  if (!searchChartRef.value) return
  
  // 使用我们的图表工具类创建图表
  if (!searchChart) {
    searchChart = chartUtils.createChart(searchChartRef.value)
  }
  
  // 准备数据
  let searchTerms = topSearches.value.map(item => ({
    name: item.term,
    value: item.count
  }))
  
  // 如果没有数据，使用模拟数据
  if (searchTerms.length === 0) {
    searchTerms = [
      { name: '数学基础诊断', value: 127 },
      { name: '编程思维培养', value: 98 },
      { name: '学习策略制定', value: 85 },
      { name: '科学方法训练', value: 64 },
      { name: '语言学习路径', value: 59 },
      { name: '认知能力评估', value: 52 },
      { name: '学习效果分析', value: 48 },
      { name: '个性化路径', value: 41 },
      { name: '学习困难诊断', value: 36 },
      { name: '知识图谱构建', value: 32 }
    ]
  }
  
  // 使用条形图展示热门搜索词
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12,
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#eee'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: searchTerms.map(item => item.name).slice(0, 8).reverse(),
      axisLabel: {
        fontSize: 12,
        formatter: function(value) {
          if (value.length > 15) {
            return value.substring(0, 15) + '...'
          }
          return value
        }
      }
    },
    series: [
      {
        name: '搜索次数',
        type: 'bar',
        data: searchTerms.map((item, index) => ({
          value: item.value,
          itemStyle: {
            color: chartUtils.getGradientColor(pieColors, index)(0, 1, true)
          }
        })).slice(0, 8).reverse(),
        label: {
          show: true,
          position: 'right',
          formatter: '{c}'
        }
      }
    ]
  }
  
  searchChart.setOption(option)
}

// 初始化热力图
function initHeatmapChart() {
  if (!heatmapChartRef.value) return
  
  // 使用图表工具类创建图表
  if (!heatmapChart) {
    heatmapChart = chartUtils.createChart(heatmapChartRef.value)
  }
  
  try {
    // 生成热力图数据
    const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00',
      '14:00', '16:00', '18:00', '20:00', '22:00'];
    
    const categories = ['数学基础', '编程思维', '科学方法', '语言学习', '学习策略', '认知诊断', '学习评估', '路径规划'];
    
    const data = [];
    for (let i = 0; i < categories.length; i++) {
      for (let j = 0; j < hours.length; j++) {
        // 生成一个0到100的随机值，代表覆盖率百分比
        // 让数据更有规律，白天使用率高，晚上低
        let value = 0;
        if (j >= 4 && j <= 9) { // 工作时间 08:00-18:00
          value = Math.round(Math.random() * 50) + 50; // 50-100
        } else if ((j >= 2 && j < 4) || (j > 9 && j <= 10)) { // 早晚过渡时间
          value = Math.round(Math.random() * 40) + 30; // 30-70
        } else { // 深夜
          value = Math.round(Math.random() * 30) + 10; // 10-40
        }
        
        // 对某些热门技术调高覆盖率
        if (i === 0 || i === 2 || i === 5) { // 数学基础、编程思维和学习策略更热门
          value = Math.min(100, Math.round(value * 1.2));
        }
        
        data.push([j, i, value]);
      }
    }
    
    const option = {
      title: {
        text: '知识库覆盖热力图',
        left: 'center',
        top: 0,
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        position: 'top',
        formatter: function(params) {
          return `${categories[params.data[1]]} - ${hours[params.data[0]]}<br>覆盖率: <strong>${params.data[2]}%</strong>`;
        },
        textStyle: {
          fontSize: 14
        },
        borderWidth: 1,
        borderColor: '#eee',
        padding: 10,
        extraCssText: 'box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);'
      },
      grid: {
        top: '15%',
        left: '3%',
        right: '6%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisTick: {
          alignWithLabel: true
        },
        axisLabel: {
          interval: 0,
          rotate: 30,
          fontSize: 12,
          margin: 8
        },
        splitArea: {
          show: true
        }
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisTick: {
          alignWithLabel: true
        },
        axisLabel: {
          fontSize: 12,
          margin: 12
        },
        splitArea: {
          show: true
        }
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        color: ['#5470c6', '#91cc75', '#fac858', '#ee6666'],
        textStyle: {
          fontSize: 12
        },
        show: true // 确保visualMap显示
      },
      series: [{
        name: '知识库覆盖率',
        type: 'heatmap',
        data: data,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: '#fff'
        }
      }],
      toolbox: {
        feature: {
          saveAsImage: {}
        },
        right: 20,
        top: 0
      }
    };
    
    heatmapChart.setOption(option);
  } catch (error) {
    console.error("热力图初始化失败:", error)
  }
}

// 初始化热门搜索条形图
function initTopSearchesChart() {
  if (!topSearchesChartRef.value) return
  
  // 使用图表工具类创建图表
  if (!topSearchesChart) {
    topSearchesChart = chartUtils.createChart(topSearchesChartRef.value)
  }
  
  // 准备数据
  const terms = topSearches.value.map(item => item.term).reverse()
  const counts = topSearches.value.map(item => item.count).reverse()
  const maxCount = Math.max(...counts, 1)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c} 次',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#ccc',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      extraCssText: 'box-shadow: 0 2px 10px rgba(0,0,0,0.1);'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12,
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#eee'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: terms,
      axisLabel: {
        fontSize: 12,
        color: '#666',
        formatter: function(value) {
          if (value.length > 12) {
            return value.substring(0, 12) + '...'
          }
          return value
        }
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      axisTick: {
        alignWithLabel: true
      }
    },
    series: [
      {
        name: '搜索次数',
        type: 'bar',
        barWidth: '60%',
        data: counts.map((value, index) => {
          return {
            value,
            itemStyle: {
              color: chartUtils.getGradientColor(pieColors, index)(0, 1, true),
              borderRadius: [0, 4, 4, 0]
            }
          }
        }),
        label: {
          show: true,
          position: 'right',
          formatter: '{c}',
          fontSize: 12,
          color: '#666',
          fontWeight: 'bold'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.2)'
          }
        }
      }
    ]
  }
  
  topSearchesChart.setOption(option)
}

// 初始化热门问题表格组件
async function loadTopSearches() {
  try {
    console.log('加载热门问题数据...');
    
    // 优先加载问题分类数据
    const categoryStats = await analyticsService.getQuestionCategoryStats();
    console.log('获取到分类数据:', categoryStats);
    
    if (categoryStats && categoryStats.length > 0) {
      // 转换分类统计为热门搜索格式
      topSearches.value = categoryStats.map(cat => ({
        term: cat.name,
        count: cat.count,
        description: cat.description || ''
      })).sort((a, b) => b.count - a.count).slice(0, 8);
      
      console.log('已加载问题分类数据:', topSearches.value);
      return;
    }
    
    // 如果没有分类数据，回退到热门问题数据
    console.log('没有找到分类数据，尝试加载热门问题...');
    const hotQuestions = await analyticsService.getTopQuestions(8);
    if (hotQuestions && hotQuestions.length > 0) {
      topSearches.value = hotQuestions;
      console.log('已加载热门问题数据:', topSearches.value);
    } else {
      console.log('没有热门问题数据，使用默认数据');
      // 使用默认数据
      topSearches.value = [
        { term: '数学基础诊断', count: 3, description: '数学概念理解和应用问题分析' },
        { term: '编程思维培养', count: 2, description: '逻辑思维和编程能力提升' },
        { term: '学习策略制定', count: 1, description: '个性化学习方法和策略规划' }
      ];
    }
  } catch (error) {
    console.error('加载热门问题数据失败:', error);
    // 出错时使用默认数据
    topSearches.value = [
              { term: '数学基础诊断', count: 3, description: '数学概念理解和应用问题分析' },
        { term: '编程思维培养', count: 2, description: '逻辑思维和编程能力提升' },
        { term: '学习策略制定', count: 1, description: '个性化学习方法和策略规划' }
    ];
  }
}

// 监听时间范围变化，更新图表
watch(timeRange, async () => {
  await loadAnalyticsData()
  initTrendChart()
})

// 监听趋势指标变化，更新图表
watch(trendMetric, () => {
  initTrendChart()
})

// 监听搜索展示模式变化
watch(searchDisplayMode, () => {
  if (searchDisplayMode.value === 'chart') {
    // 由于DOM可能需要时间来渲染，使用nextTick确保DOM已经更新
    nextTick(() => {
      if (!topSearchesChart && topSearchesChartRef.value) {
        topSearchesChart = chartUtils.createChart(topSearchesChartRef.value)
      }
      initTopSearchesChart()
    })
  }
})

// 监听分类显示开关变化
watch(showQuestionCategories, () => {
  loadTopSearches();
})

// 监听热门搜索数据变化
watch(topSearches, () => {
  if (searchDisplayMode.value === 'chart' && topSearchesChart) {
    initTopSearchesChart()
  }
}, { deep: true })

// 初始化所有图表
function initAllCharts() {
  try {
    if (categoryChartRef.value) {
      categoryChart = chartUtils.createChart(categoryChartRef.value)
      initCategoryChart()
    }
    
    if (searchChartRef.value) {
      searchChart = chartUtils.createChart(searchChartRef.value)
      initSearchChart()
    }
    
    if (trendChartRef.value) {
      trendChart = chartUtils.createChart(trendChartRef.value)
      initTrendChart()
    }
    
    if (heatmapChartRef.value) {
      heatmapChart = chartUtils.createChart(heatmapChartRef.value)
      initHeatmapChart()
    }
    
    if (topSearchesChartRef.value && searchDisplayMode.value === 'chart') {
      topSearchesChart = chartUtils.createChart(topSearchesChartRef.value)
      initTopSearchesChart()
    }
  } catch (error) {
    console.error('初始化图表出错:', error)
  }
}

// 窗口调整大小时重绘图表
const resizeHandler = () => {
  if (categoryChart) categoryChart.resize()
  if (searchChart) searchChart.resize()
  if (trendChart) trendChart.resize()
  if (heatmapChart) heatmapChart.resize()
  if (topSearchesChart) topSearchesChart.resize()
}

// 组件挂载时初始化
onMounted(async () => {
  // 先加载数据
  await loadAnalyticsData()
  await loadTopSearches()
  
  // 然后初始化图表
  nextTick(() => {
    initAllCharts()
    // 添加窗口大小监听
    window.addEventListener('resize', resizeHandler)
  })
})

// 组件卸载前清理
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeHandler)
  
  if (categoryChart) categoryChart.dispose()
  if (searchChart) searchChart.dispose()
  if (trendChart) trendChart.dispose()
  if (heatmapChart) heatmapChart.dispose()
  if (topSearchesChart) topSearchesChart.dispose()
})
</script>

<style scoped>
.dashboard-container {
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 60px);
  padding: 2rem 2rem;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
  overflow-x: hidden;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  width: 100%;
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

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.dashboard-overview {
  margin-bottom: 2rem;
  width: 100%;
}

.overview-card {
  margin-bottom: 1rem;
  transition: transform 0.3s;
  cursor: default;
  height: 100%;
}

.overview-card:hover {
  transform: translateY(-5px);
}

.overview-content {
  display: flex;
  align-items: center;
  padding: 0.5rem;
}

.overview-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1.5rem;
}

.overview-icon .el-icon {
  font-size: 30px;
  color: white;
}

.overview-data {
  flex: 1;
}

.overview-value {
  font-size: 2.2rem;
  font-weight: bold;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.overview-label {
  font-size: 1rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 0.5rem;
}

.overview-trend {
  font-size: 0.9rem;
  display: flex;
  align-items: center;
}

.overview-trend.positive {
  color: var(--el-color-success);
}

.overview-trend.negative {
  color: var(--el-color-danger);
}

.dashboard-main {
  margin-top: 2rem;
  width: 100%;
  box-sizing: border-box;
}

.chart-wrapper {
  margin-bottom: 2rem;
  width: 100%;
  overflow-x: hidden;
}

.chart-card {
  height: 100%;
  margin-bottom: 1.5rem;
  width: 100%;
}

.right-sidebar {
  padding-left: 0;
  max-width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--el-text-color-primary);
}

.trend-chart {
  height: 400px;
  width: 100%;
}

.chart-container {
  height: 350px;
  width: 100%;
}

.heatmap-chart {
  height: 400px;
  width: 100%;
}

.dashboard-categories {
  margin-bottom: 1.5rem;
}

.performance-metrics {
  padding: 0.5rem 0;
}

.metric-item {
  margin-bottom: 1.5rem;
}

.metric-label {
  margin-bottom: 0.8rem;
  font-size: 1rem;
  color: var(--el-text-color-secondary);
}

.feedback-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 0;
}

.feedback-item {
  padding: 1rem 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.feedback-item:last-child {
  border-bottom: none;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.feedback-user {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.feedback-content {
  font-size: 0.95rem;
  color: var(--el-text-color-primary);
  margin-bottom: 0.8rem;
  line-height: 1.5;
}

.feedback-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
}

.feedback-topic {
  color: var(--el-color-primary);
}

.top-searches-chart {
  height: 300px;
  width: 100%;
  margin-top: 10px;
}

/* 响应式调整 */
@media (max-width: 1400px) {
  .dashboard-container {
    padding: 1.5rem;
  }
}

@media (max-width: 992px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    margin-top: 1rem;
  }
  
  .trend-chart, .chart-container, .heatmap-chart {
    height: 300px;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }
  
  .overview-value {
    font-size: 1.5rem;
  }
  
  .chart-wrapper {
    margin-bottom: 1rem;
  }
  
  .trend-chart, .chart-container, .heatmap-chart {
    height: 250px;
  }
  
  .right-sidebar {
    padding-left: 0;
  }
}
</style>
 
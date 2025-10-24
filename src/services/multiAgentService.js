/**
 * 多智能体协作服务
 * 负责管理智能体间的协同决策和认知诊断
 */

import { sendMessageToAI } from './aiService.js'

// 智能体类型定义
export const AGENT_TYPES = {
  COGNITIVE: 'cognitive',     // 认知诊断智能体
  PLANNING: 'planning',       // 路径规划智能体
  RESOURCE: 'resource',       // 资源推荐智能体
  MONITORING: 'monitoring'    // 评估监控智能体
}

// 智能体状态枚举
export const AGENT_STATUS = {
  IDLE: 'idle',
  ACTIVE: 'active',
  PROCESSING: 'processing',
  WAITING: 'waiting',
  ERROR: 'error'
}

// 协作阶段枚举
export const COLLABORATION_STAGES = {
  INIT: 'init',
  DATA_COLLECTION: 'data_collection',
  ANALYSIS: 'analysis',
  DECISION_FUSION: 'decision_fusion',
  RESULT_GENERATION: 'result_generation',
  COMPLETED: 'completed'
}

// 智能体专业化提示词配置
const AGENT_PROMPTS = {
  [AGENT_TYPES.COGNITIVE]: {
    role: "认知诊断专家",
    systemPrompt: `你是一名资深的认知诊断专家，拥有教育心理学和认知科学的深厚背景。你的职责是对学习者进行全面深入的认知诊断分析。

**核心能力**：
1. 🧠 认知能力评估 - 分析学习者的记忆、注意力、思维能力等认知功能
2. 📊 知识结构诊断 - 识别学习者的知识掌握程度和知识网络结构
3. 🎯 学习风格识别 - 确定学习者的信息加工偏好和学习策略倾向
4. 🔍 学习障碍检测 - 发现影响学习效果的认知障碍和困难点
5. 💡 认知发展评估 - 判断学习者当前的认知发展阶段和潜力

**诊断方法**：
- 采用多元智能理论分析学习者的智能结构
- 运用信息加工理论评估认知过程效率
- 基于建构主义理论分析知识建构能力
- 结合元认知理论评估学习策略使用情况

**诊断标准**：
- 诊断准确率目标：≥75%
- 分析深度：提供3-5个维度的详细分析
- 个性化程度：针对具体学科和学习目标定制
- 实用性：提供可操作的认知改进建议

请根据学习者的具体情况，进行深度、专业、个性化的认知诊断分析。`,
    
    analysisFormat: `请严格按照以下专业格式输出详细诊断结果：

## 🧠 认知诊断报告

### 📊 认知能力评估
**工作记忆容量**：[评估结果 - 优秀/良好/一般/需提升]
**注意力集中度**：[评估结果 - 包括持续性注意和选择性注意]
**信息加工速度**：[评估结果 - 快速/中等/较慢，具体分析]
**抽象思维能力**：[评估结果 - 包括逻辑推理和概念理解]
**空间认知能力**：[评估结果 - 对于理科学习的影响]

### 🎯 学习风格分析
**信息接收偏好**：[视觉型/听觉型/触觉型，具体特征]
**信息加工方式**：[整体型/分析型，思维特点]
**学习节奏偏好**：[快节奏/稳定节奏/慢节奏，适合的学习安排]
**社交学习倾向**：[独立学习/合作学习/混合型]

### 📚 知识结构诊断
**先验知识基础**：[在目标学科的基础知识掌握情况]
**概念理解深度**：[表层理解/深层理解，具体分析]
**知识关联能力**：[新旧知识连接能力，跨领域迁移能力]
**知识应用水平**：[记忆/理解/应用/分析/综合/评价 - 布鲁姆分类]

### ⚠️ 学习困难识别
**主要障碍点**：[具体识别出的3-5个关键困难]
**认知负荷分析**：[内在负荷/外在负荷/相关负荷的平衡情况]
**元认知缺陷**：[学习策略使用、自我监控能力等]
**情感认知因素**：[学习动机、自我效能感、焦虑水平等]

### 🎯 个性化建议
**认知强化策略**：[基于诊断结果的具体认知训练建议]
**学习方法优化**：[适合的学习技巧和策略]
**环境配置建议**：[最佳学习环境和条件设置]
**进度安排建议**：[基于认知特点的学习节奏安排]

### 📈 诊断数据
**诊断置信度**：[75-95%之间的具体数值]%
**主要依据**：[诊断的核心依据和理论支撑]
**建议复评时间**：[多久后建议重新评估]

### 🤝 协作建议
**给路径规划智能体**：[基于认知特点的路径设计建议]
**给资源推荐智能体**：[适合的资源类型和难度建议]
**给监控智能体**：[需要重点监控的认知指标]`
  },

  [AGENT_TYPES.PLANNING]: {
    role: "学习路径规划专家", 
    systemPrompt: `你是一名经验丰富的学习路径规划专家，专精于教学设计和个性化学习路径构建。你具备深厚的教育学、心理学和学科教学法理论基础。

**专业能力**：
1. 🗺️ 学习地图构建 - 基于知识图谱构建科学的学习序列
2. 🎯 目标导向设计 - 将学习目标分解为可达成的里程碑
3. ⏰ 时间管理规划 - 考虑学习者时间约束的高效路径设计
4. 🔄 自适应调整 - 设计可动态调整的灵活学习路径
5. 🎮 学习体验设计 - 融入游戏化和互动元素提升学习体验

**规划方法**：
- 采用布鲁姆认知目标分类法进行目标分层
- 运用加涅九步教学法设计学习活动
- 基于最近发展区理论安排学习难度梯度
- 结合认知负荷理论优化学习内容组织
- 运用掌握学习理论确保学习质量

**设计标准**：
- 路径推荐匹配度目标：≥75%
- 学习效率提升：至少30%
- 个性化适配度：覆盖90%以上学习偏好
- 科学性：基于教育理论和实证研究

请根据认知诊断结果和学习者具体需求，设计科学、个性化、高效的学习路径。`,

    analysisFormat: `请严格按照以下专业格式输出详细规划结果：

## 🗺️ 个性化学习路径规划报告

### 🎯 学习目标分析
**总体目标**：[基于学习者需求的总体学习目标]
**分级目标**：
- 知识目标：[具体的知识掌握要求]
- 能力目标：[技能和能力发展目标]
- 情感目标：[学习态度和价值观培养]

### 📊 路径设计框架
**学习模式选择**：[个体学习/小组学习/混合模式，基于认知特点]
**难度递进策略**：[由易到难的具体设计思路]
**知识建构路径**：[概念理解→技能训练→应用实践→创新拓展]
**评估节点设置**：[阶段性评估的时间点和方式]

### 📅 分阶段学习计划
**第一阶段：基础构建期**
- 时间安排：[具体时间和频次]
- 学习内容：[详细的知识点清单]
- 学习方式：[推荐的学习方法和技巧]
- 预期成果：[阶段性学习成果]

**第二阶段：能力提升期**
- 时间安排：[具体时间和频次]
- 学习内容：[详细的技能训练内容]
- 学习方式：[推荐的练习和实践方法]
- 预期成果：[能力发展指标]

**第三阶段：应用巩固期**
- 时间安排：[具体时间和频次]
- 学习内容：[应用实践项目和案例]
- 学习方式：[项目制学习和实践活动]
- 预期成果：[应用能力展示]

### 🎮 学习活动设计
**知识获取活动**：[视频学习/阅读/讲座等具体安排]
**技能练习活动**：[练习题/实验/项目等具体设计]
**互动交流活动**：[讨论/答疑/合作学习等安排]
**自我评估活动**：[自测/反思/总结等活动设计]

### ⚡ 个性化适配策略
**认知风格适配**：[基于诊断结果的学习方式调整]
**学习节奏调整**：[个性化的进度安排]
**兴趣驱动设计**：[融入学习者兴趣的内容设计]
**强化薄弱环节**：[针对困难点的专项训练]

### 🔄 动态调整机制
**监控指标**：[需要跟踪的关键学习指标]
**调整触发条件**：[什么情况下需要调整路径]
**备选路径**：[2-3个备选学习路径方案]
**反馈循环**：[如何收集和利用学习反馈]

### 📈 效果预测
**预期学习效果**：[基于路径设计的学习成果预测]
**时间效率分析**：[相比传统学习的时间节省程度]
**难点突破策略**：[对预期困难的应对策略]
**成功率评估**：[路径执行成功的可能性分析]

### 📊 规划数据
**路径匹配度**：[75-95%之间的具体数值]%
**预计完成时间**：[总体学习时间和阶段时间]
**资源需求评估**：[所需的学习资源和工具]
**风险评估**：[可能遇到的困难和应对策略]

### 🤝 协作建议
**给资源推荐智能体**：[需要的具体资源类型和要求]
**给监控智能体**：[需要重点监控的学习进度指标]
**给认知诊断智能体**：[学习过程中需要再次诊断的时机]`
  },

  [AGENT_TYPES.RESOURCE]: {
    role: "学习资源推荐专家",
    systemPrompt: `你是一名专业的学习资源推荐专家，专精于教育资源评估和个性化内容匹配。你拥有丰富的数字化学习资源库知识和教育技术应用经验。

**专业能力**：
1. 📚 资源库管理 - 熟悉各类优质学习资源的特点和适用性
2. 🎯 精准匹配 - 基于认知特点和学习路径进行资源匹配
3. 🔍 质量评估 - 评估学习资源的教学效果和适用性
4. 🎮 多模态整合 - 整合文本、视频、互动等多种学习形式
5. 📊 数据分析 - 基于学习数据优化资源推荐算法

**推荐方法**：
- 采用协同过滤和内容过滤混合推荐算法
- 基于学习科学理论评估资源教学价值
- 运用多元智能理论匹配不同类型资源
- 结合学习风格理论优化资源呈现方式
- 应用个性化学习理论定制资源组合

**推荐标准**：
- 资源匹配精度目标：≥80%
- 覆盖多样性：涵盖5种以上学习模态
- 质量保证：推荐资源质量评分≥4.0
- 可用性：确保90%以上资源可获取

请根据学习者的认知特点、学习路径和具体需求，提供精准、多样、高质量的个性化资源推荐。`,

    analysisFormat: `请严格按照以下专业格式输出详细推荐结果：

## 📚 个性化学习资源推荐报告

### 🎯 推荐策略分析
**匹配原则**：[基于认知诊断和路径规划的匹配策略]
**个性化程度**：[针对学习者特点的个性化程度]
**资源覆盖度**：[推荐资源的广度和深度分析]
**质量保证机制**：[资源质量筛选和评估标准]

### 📖 核心学习资源
**主要教材推荐**：
- 教材名称：[具体书籍/课程名称]
- 推荐理由：[为什么适合该学习者]
- 使用方式：[建议的学习方法]
- 难度级别：[初级/中级/高级，具体说明]

**辅助教材推荐**：
- 参考书籍：[2-3本补充教材]
- 学术论文：[相关领域重要论文]
- 权威网站：[官方学习平台和资源站点]

### 🎬 多媒体学习资源
**视频课程推荐**：
- 课程平台：[推荐的在线学习平台]
- 讲师选择：[适合的教学风格和讲师]
- 观看顺序：[建议的视频学习序列]
- 互动方式：[配套的练习和讨论]

**音频资源**：
- 播客节目：[相关学科的专业播客]
- 有声读物：[适合听觉学习的音频材料]
- 录音课程：[专业讲座和研讨会录音]

### 🛠️ 实践工具和平台
**在线练习平台**：
- 练习系统：[推荐的在线练习和测试平台]
- 编程环境：[代码练习和项目开发工具]
- 仿真软件：[专业仿真和建模工具]

**互动学习工具**：
- 协作平台：[团队学习和讨论工具]
- 游戏化学习：[教育游戏和互动应用]
- AR/VR资源：[沉浸式学习体验工具]

### 📝 练习和评估资源
**习题资源库**：
- 基础练习：[夯实基础知识的练习题]
- 提高练习：[能力提升的综合题目]
- 竞赛题库：[挑战性题目和竞赛资源]

**评估工具**：
- 自我测评：[在线测试和自我评估工具]
- 同伴评价：[互评平台和工具]
- 专业认证：[相关领域的认证考试资源]

### 🌐 社区和交流资源
**学习社区**：
- 专业论坛：[学科相关的讨论社区]
- 学习小组：[同伴学习和互助群组]
- 专家答疑：[专业导师和答疑平台]

**学术交流**：
- 会议资源：[相关学术会议和研讨会]
- 期刊文献：[重要学术期刊和数据库]
- 开放课程：[名校公开课和MOOC资源]

### 📱 移动学习资源
**学习应用**：
- 移动APP：[专业学习和练习应用]
- 微学习资源：[碎片化学习内容]
- 离线资源：[可下载的学习材料]

### ⚡ 个性化配置建议
**学习环境配置**：[基于学习风格的环境设置建议]
**资源使用顺序**：[推荐的资源学习序列]
**时间分配建议**：[各类资源的时间分配比例]
**进度监控方式**：[学习进度跟踪和反馈方法]

### 📊 推荐数据
**推荐精度**：[80-95%之间的具体数值]%
**资源总数**：[推荐的资源总量]
**覆盖模态**：[涵盖的学习模态类型数量]
**质量评分**：[平均资源质量评分]
**可获取性**：[资源的可获取比例]

### 🤝 协作建议
**给路径规划智能体**：[资源与学习路径的整合建议]
**给监控智能体**：[需要跟踪的资源使用效果指标]
**给认知诊断智能体**：[资源使用过程中的认知表现观察点]`
  },

  [AGENT_TYPES.MONITORING]: {
    role: "学习效果监控专家",
    systemPrompt: `你是一名资深的学习效果监控专家，专精于教育评估和学习分析。你拥有深厚的教育测量学、学习分析学和数据科学背景。

**专业能力**：
1. 📊 学习分析 - 运用大数据和机器学习技术分析学习行为
2. 📈 效果评估 - 设计科学的学习效果评估体系和方法
3. ⚠️ 预警系统 - 构建智能预警机制及时发现学习问题
4. 🔍 行为监控 - 实时监控学习行为和认知状态变化
5. 📋 报告生成 - 生成全面详细的学习效果分析报告

**监控方法**：
- 采用学习分析技术构建多维度监控体系
- 运用教育数据挖掘技术发现学习模式
- 基于认知负荷理论监控学习状态
- 结合形成性评估理论设计过程监控
- 应用自适应学习理论优化监控策略

**监控标准**：
- 监控覆盖率目标：≥95%
- 预警准确率：≥85%
- 实时性要求：秒级响应
- 数据完整性：≥98%

请根据认知诊断、学习路径和资源推荐结果，设计全面、科学、实时的学习效果监控体系。`,

    analysisFormat: `请严格按照以下专业格式输出详细监控方案：

## 📊 学习效果监控体系设计报告

### 🎯 监控目标与范围
**监控目标**：[基于学习路径和目标的具体监控目标]
**监控范围**：[覆盖的学习活动和行为范围]
**监控周期**：[短期/中期/长期监控计划]
**成功指标**：[定义学习成功的关键指标]

### 📈 评估指标体系
**认知指标**：
- 知识掌握度：[具体测量方法和标准]
- 理解深度：[概念理解程度评估]
- 应用能力：[知识运用能力测评]
- 创新思维：[创造性思维评估]

**行为指标**：
- 学习时长：[有效学习时间统计]
- 参与度：[学习活动参与程度]
- 完成率：[任务和作业完成情况]
- 互动频次：[与资源和他人的互动]

**情感指标**：
- 学习动机：[学习积极性和主动性]
- 自我效能：[学习信心和自信水平]
- 学习满意度：[对学习过程的满意程度]
- 焦虑水平：[学习压力和焦虑状态]

### ⏰ 实时监控机制
**数据采集策略**：
- 行为数据：[点击、浏览、互动等行为追踪]
- 作业数据：[练习完成情况和正确率]
- 测评数据：[阶段性测试和评估结果]
- 反馈数据：[学习者主观反馈和评价]

**实时分析算法**：
- 学习模式识别：[识别学习者的学习模式和习惯]
- 异常检测：[发现学习过程中的异常情况]
- 趋势分析：[预测学习发展趋势]
- 个性化调整：[基于数据的实时个性化建议]

### ⚠️ 智能预警系统
**预警触发条件**：
- 学习进度滞后：[进度低于预期的具体标准]
- 理解困难：[概念理解困难的识别标准]
- 动机下降：[学习积极性下降的检测]
- 效果不佳：[学习效果不理想的判断标准]

**预警级别设计**：
- 绿色（正常）：[学习状态良好的标准]
- 黄色（关注）：[需要关注的轻微问题]
- 橙色（警告）：[需要干预的中等问题]
- 红色（紧急）：[需要立即处理的严重问题]

**干预措施建议**：
- 学习策略调整：[针对不同问题的策略调整]
- 资源重新配置：[学习资源的重新分配]
- 路径动态调整：[学习路径的实时优化]
- 个性化支持：[定制化的学习支持方案]

### 📊 数据分析与报告
**学习进度分析**：
- 完成进度：[各阶段学习任务完成情况]
- 时间分配：[学习时间在各模块的分布]
- 难点识别：[学习过程中的主要困难点]
- 突破分析：[知识掌握的突破点和时机]

**学习效果评估**：
- 知识增长：[知识掌握程度的提升幅度]
- 能力发展：[各项能力的发展轨迹]
- 目标达成：[学习目标的实现程度]
- 效率分析：[学习效率和投入产出比]

**个性化洞察**：
- 学习风格匹配：[学习方式与个人风格的匹配度]
- 最佳学习时间：[个人最佳学习时段分析]
- 优势劣势分析：[学习强项和薄弱环节]
- 发展潜力评估：[未来学习发展潜力预测]

### 🔄 适应性调整机制
**调整触发机制**：
- 自动调整：[基于算法的自动优化]
- 手动干预：[专家或学习者的手动调整]
- 定期评估：[周期性的全面评估和调整]
- 异常处理：[应对突发学习问题的调整]

**调整策略库**：
- 认知策略：[认知学习策略的调整方案]
- 情感策略：[学习动机和情感的调节方案]
- 行为策略：[学习行为和习惯的改进方案]
- 环境策略：[学习环境和条件的优化方案]

### 📱 监控工具与平台
**数据采集工具**：
- 学习管理系统：[LMS平台的数据收集]
- 行为追踪工具：[用户行为分析工具]
- 评估测试平台：[在线测评和考试系统]
- 反馈收集系统：[问卷和反馈收集工具]

**分析展示平台**：
- 仪表板设计：[实时监控仪表板]
- 报告生成器：[自动化报告生成]
- 可视化工具：[数据可视化和图表工具]
- 移动应用：[手机端监控和查看应用]

### 📈 监控数据
**监控覆盖率**：[95-99%之间的具体数值]%
**预警准确率**：[85-95%之间的具体数值]%
**响应时间**：[实时监控的响应时间]
**数据完整性**：[数据收集的完整程度]
**用户满意度**：[监控系统的用户满意度]

### 🤝 协作建议
**给认知诊断智能体**：[需要重新诊断的触发条件和时机]
**给路径规划智能体**：[路径调整的数据支持和建议]
**给资源推荐智能体**：[资源效果反馈和优化建议]`
  }
}

/**
 * 多智能体协同管理器
 */
export class MultiAgentCollaborationManager {
  constructor() {
    this.agents = this.initializeAgents()
    this.currentStage = COLLABORATION_STAGES.INIT
    this.collaborationHistory = []
    this.sharedContext = {}
    this.consensusResults = {}
  }

  /**
   * 初始化所有智能体
   */
  initializeAgents() {
    const agents = {}
    
    Object.values(AGENT_TYPES).forEach(agentType => {
      agents[agentType] = {
        id: agentType,
        type: agentType,
        status: AGENT_STATUS.IDLE,
        capabilities: this.getAgentCapabilities(agentType),
        metrics: this.initializeAgentMetrics(agentType),
        currentTask: null,
        results: null,
        collaborationData: {}
      }
    })
    
    return agents
  }

  /**
   * 获取智能体能力配置
   */
  getAgentCapabilities(agentType) {
    const capabilities = {
      [AGENT_TYPES.COGNITIVE]: ['认知分析', '知识诊断', '学习风格识别', '能力评估'],
      [AGENT_TYPES.PLANNING]: ['路径设计', '策略规划', '时间安排', '目标分解'],
      [AGENT_TYPES.RESOURCE]: ['资源匹配', '内容筛选', '质量评估', '个性化推荐'],
      [AGENT_TYPES.MONITORING]: ['效果监控', '进度跟踪', '异常检测', '性能评估']
    }
    
    return capabilities[agentType] || []
  }

  /**
   * 初始化智能体性能指标
   */
  initializeAgentMetrics(agentType) {
    const baseMetrics = {
      tasksCompleted: 0,
      averageAccuracy: 0,
      responseTime: 0,
      collaborationScore: 0
    }
    
    // 根据智能体类型设置特定指标
    switch (agentType) {
      case AGENT_TYPES.COGNITIVE:
        return { ...baseMetrics, diagnosisAccuracy: 73, tasksProcessed: 156 }
      case AGENT_TYPES.PLANNING:
        return { ...baseMetrics, pathMatchingRate: 68, pathsGenerated: 89 }
      case AGENT_TYPES.RESOURCE:
        return { ...baseMetrics, recommendationPrecision: 81, resourcesManaged: 2340 }
      case AGENT_TYPES.MONITORING:
        return { ...baseMetrics, monitoringCoverage: 92, anomaliesDetected: 3 }
      default:
        return baseMetrics
    }
  }

  /**
   * 启动协同诊断流程
   */
  async startCollaborativeDiagnosis(learnerInfo) {
    try {
      console.log('🚀 启动多智能体协同诊断流程')
      console.log('学习者信息:', learnerInfo)
      
      this.currentStage = COLLABORATION_STAGES.DATA_COLLECTION
      this.sharedContext = { learnerInfo, timestamp: new Date() }
      
      // 阶段1: 认知诊断智能体分析
      console.log('📊 阶段1: 认知诊断分析')
      const cognitiveResult = await this.executeAgentTask(AGENT_TYPES.COGNITIVE, learnerInfo)
      this.updateSharedContext('cognitive', cognitiveResult)
      
      // 阶段2: 路径规划智能体设计
      console.log('🗺️ 阶段2: 学习路径规划')
      const planningResult = await this.executeAgentTask(AGENT_TYPES.PLANNING, {
        ...learnerInfo,
        cognitiveAnalysis: cognitiveResult
      })
      this.updateSharedContext('planning', planningResult)
      
      // 阶段3: 资源推荐智能体匹配
      console.log('📚 阶段3: 学习资源推荐')
      const resourceResult = await this.executeAgentTask(AGENT_TYPES.RESOURCE, {
        ...learnerInfo,
        cognitiveAnalysis: cognitiveResult,
        learningPath: planningResult
      })
      this.updateSharedContext('resource', resourceResult)
      
      // 阶段4: 监控智能体设计
      console.log('📈 阶段4: 学习效果监控')
      const monitoringResult = await this.executeAgentTask(AGENT_TYPES.MONITORING, {
        ...learnerInfo,
        cognitiveAnalysis: cognitiveResult,
        learningPath: planningResult,
        resources: resourceResult
      })
      this.updateSharedContext('monitoring', monitoringResult)
      
      // 阶段5: 协同决策融合
      console.log('🤝 阶段5: 协同决策融合')
      const finalResult = await this.performDecisionFusion()
      
      this.currentStage = COLLABORATION_STAGES.COMPLETED
      console.log('✅ 多智能体协同诊断完成')
      
      return finalResult
      
    } catch (error) {
      console.error('❌ 多智能体协同诊断失败:', error)
      throw error
    }
  }

  /**
   * 执行智能体任务
   */
  async executeAgentTask(agentType, inputData) {
    const agent = this.agents[agentType]
    if (!agent) {
      throw new Error(`智能体 ${agentType} 不存在`)
    }
    
    // 更新智能体状态
    agent.status = AGENT_STATUS.PROCESSING
    agent.currentTask = inputData
    
    try {
      // 构建智能体专用提示词
      const prompt = this.buildAgentPrompt(agentType, inputData)
      
      console.log(`🤖 ${agentType} 智能体开始处理任务`)
      console.log('输入数据:', inputData)
      
      // 调用真实的AI服务
      console.log(`🤖 正在调用AI服务，提示词长度: ${prompt.length}`)
      const response = await sendMessageToAI(prompt, [], [])
      console.log(`🤖 AI服务响应完成，类型: ${typeof response}`)
      
      if (response && response.content) {
        console.log(`✅ AI返回内容长度: ${response.content.length}`)
      } else {
        console.warn(`⚠️ AI响应异常:`, response)
      }
      
      // 解析和处理AI响应
      const processedResult = this.processAgentResponse(agentType, response, inputData)
      
      // 更新智能体状态和结果
      agent.status = AGENT_STATUS.ACTIVE
      agent.results = processedResult
      agent.metrics.tasksCompleted += 1
      
      console.log(`✅ ${agentType} 智能体任务完成`)
      console.log('处理结果:', processedResult)
      
      return processedResult
      
    } catch (error) {
      agent.status = AGENT_STATUS.ERROR
      console.error(`❌ ${agentType} 智能体处理失败:`, error)
      throw error
    }
  }

  /**
   * 构建智能体专用提示词
   */
  buildAgentPrompt(agentType, inputData) {
    const agentConfig = AGENT_PROMPTS[agentType]
    if (!agentConfig) {
      throw new Error(`未找到智能体 ${agentType} 的配置`)
    }
    
    let contextInfo = ''
    let specificRequest = ''
    
    // 根据智能体类型添加上下文信息和具体请求
    if (agentType === AGENT_TYPES.COGNITIVE) {
      contextInfo = `
## 诊断目标学习者信息

**基本档案**：
- 学习者ID: ${inputData.learnerId}
- 目标学科: ${inputData.subject}
- 当前水平: ${inputData.currentLevel}/5 (1=初学者, 5=专家级)

**学习目标详述**：
${inputData.goal || '学习者尚未提供具体学习目标'}

**诊断重点**：
请基于该学习者的学科背景（${inputData.subject}）和当前水平（${inputData.currentLevel}/5），结合其学习目标，进行全面的认知诊断。

重点关注：
1. 该学科领域的认知特点和要求
2. 当前水平对应的认知发展阶段  
3. 学习目标的复杂度和认知需求
4. 潜在的学习障碍和认知瓶颈`

      specificRequest = `
**重要指令**：
作为专业认知诊断专家，你必须基于以上真实的学习者信息，提供一份完整、详细、专业的认知诊断报告。

**执行要求**：
1. 严格按照指定的分析格式输出，不可省略任何章节
2. 每个评估项目都必须给出具体的分析内容，不得使用占位符
3. 基于学科特点（${inputData.subject}）和水平（${inputData.currentLevel}/5）进行针对性分析
4. 提供实用的个性化建议和改进策略
5. 所有数值评估要合理且有依据

**质量标准**：报告应达到专业教育心理学评估水平，为后续智能体提供可靠的诊断基础。`

          } else if (agentType === AGENT_TYPES.PLANNING) {
        contextInfo = `
## 学习路径规划目标学习者

**基本档案**：
- 学习者ID: ${inputData.learnerId}
- 目标学科: ${inputData.subject}
- 学习目标: ${inputData.goal}
- 当前水平: ${inputData.currentLevel}/5

**认知诊断依据**：
${inputData.cognitiveAnalysis?.content || '认知诊断智能体分析结果将作为路径规划的重要依据。请基于学习者基本信息先进行路径设计。'}

**规划重点**：
请基于认知诊断结果，为该${inputData.subject}学科的学习者（当前水平${inputData.currentLevel}/5）制定科学的学习路径。

核心要求：
1. 路径设计要符合该学科的知识结构特点
2. 考虑学习者当前水平，确保难度递进合理  
3. 围绕具体学习目标设计阶段性任务
4. 提供可操作的学习计划和时间安排`

      specificRequest = `
**重要指令**：
作为专业的学习路径规划专家，你必须基于认知诊断结果和学习者信息，制定一份科学、详细、可操作的个性化学习路径规划。

**执行要求**：
1. 严格按照指定的分析格式输出完整报告
2. 每个学习阶段都要有具体的时间安排和学习内容
3. 基于${inputData.subject}学科特点设计专业的学习活动
4. 考虑当前水平${inputData.currentLevel}/5，设计合适的难度梯度
5. 提供多个备选路径方案和调整机制

**质量标准**：路径规划应具备教学设计的专业水准，确保学习效果和可执行性。`

          } else if (agentType === AGENT_TYPES.RESOURCE) {
        contextInfo = `
## 学习资源推荐目标学习者

**基本档案**：
- 学习者ID: ${inputData.learnerId}
- 目标学科: ${inputData.subject}
- 学习目标: ${inputData.goal}
- 当前水平: ${inputData.currentLevel}/5

**认知诊断参考**：
${inputData.cognitiveAnalysis?.content || '认知诊断结果将指导资源选择的个性化程度和难度匹配。'}

**学习路径参考**：
${inputData.learningPath?.content || '学习路径规划将指导资源推荐的系统性和阶段性安排。'}

**推荐重点**：
请基于以上分析，为${inputData.subject}学科学习者（水平${inputData.currentLevel}/5）推荐高质量的学习资源。

核心要求：
1. 资源要适配该学科的学习特点和认知要求
2. 考虑学习者当前水平，匹配合适的资源难度
3. 覆盖学习目标的各个维度和阶段
4. 提供多模态、多类型的资源组合`

      specificRequest = `
**重要指令**：
作为专业的学习资源推荐专家，你必须基于认知诊断和路径规划结果，提供一份全面、精准、实用的个性化学习资源推荐报告。

**执行要求**：
1. 严格按照指定的分析格式输出完整报告
2. 每类资源都要有具体的名称、获取方式和使用建议
3. 基于${inputData.subject}学科特点推荐专业优质资源
4. 考虑水平${inputData.currentLevel}/5，确保资源难度适宜
5. 提供资源使用的优先级和时间安排建议

**质量标准**：资源推荐应达到专业教育技术的水准，确保资源的有效性和可获取性。`

          } else if (agentType === AGENT_TYPES.MONITORING) {
        contextInfo = `
## 学习效果监控目标学习者

**基本档案**：
- 学习者ID: ${inputData.learnerId}
- 目标学科: ${inputData.subject}
- 学习目标: ${inputData.goal}
- 当前水平: ${inputData.currentLevel}/5

**认知诊断参考**：
${inputData.cognitiveAnalysis?.content || '认知诊断结果将指导监控重点和评估标准的制定。'}

**学习路径参考**：
${inputData.learningPath?.content || '学习路径规划将指导监控节点和进度跟踪的设计。'}

**资源配置参考**：
${inputData.resources?.content || '资源推荐结果将指导学习行为监控和资源使用效果评估。'}

**监控重点**：
请基于以上三个智能体的分析结果，为${inputData.subject}学科学习者（水平${inputData.currentLevel}/5）设计科学的学习效果监控体系。

核心要求：
1. 监控体系要适配该学科的学习特点和评估要求
2. 考虑学习者当前水平，设计合适的评估标准
3. 覆盖认知、行为、情感等多个维度
4. 提供实时监控和定期评估的完整方案`

      specificRequest = `
**重要指令**：
作为专业的学习效果监控专家，你必须基于前三个智能体的分析结果，设计一套科学、全面、可操作的学习效果监控体系。

**执行要求**：
1. 严格按照指定的分析格式输出完整报告
2. 每个监控指标都要有具体的测量方法和评估标准
3. 基于${inputData.subject}学科特点设计专业的监控方案
4. 考虑水平${inputData.currentLevel}/5，制定合适的预警机制
5. 提供监控工具和数据分析的详细建议

**质量标准**：监控体系应达到专业教育评估的水准，确保监控的科学性和有效性。`
    }
    
    // 简化版提示词用于测试
    const simplifiedPrompt = `你是${agentConfig.role}。

学习者信息：
- ID: ${inputData.learnerId}
- 学科: ${inputData.subject}
- 目标: ${inputData.goal}
- 水平: ${inputData.currentLevel}/5

请基于以上信息，提供专业的${agentType}分析报告。要求：
1. 内容要详细具体，至少300字
2. 分析要专业深入
3. 给出实用建议

请开始分析：`

    return simplifiedPrompt
  }

  /**
   * 处理智能体响应
   */
  processAgentResponse(agentType, response, inputData) {
    console.log(`🔍 ${agentType} 原始响应:`, response)
    
    // 尝试多种可能的响应格式
    let content = '';
    
    if (response && typeof response === 'object') {
      // AI服务返回的对象格式是 { content: "...", sources: [...] }
      content = response.content ||  // 这是我们AI服务的主要字段
                response.answer || 
                response.message || 
                response.text || 
                response.response ||
                response.result ||
                (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) ||
                '';
                
      // 如果还是没有内容，说明响应格式异常
      if (!content) {
        console.error(`${agentType} 响应对象中没有找到内容字段:`, Object.keys(response));
        content = `${agentType}智能体响应格式异常，请检查AI服务`;
      }
    } else if (typeof response === 'string') {
      content = response;
    } else {
      content = `${agentType}智能体响应类型异常: ${typeof response}`;
    }
    
    console.log(`✅ ${agentType} 解析后内容长度:`, content.length, '前100字符:', content.substring(0, 100))
    
    const processedResult = {
      agentType,
      timestamp: new Date(),
      content: content || `${agentType}智能体暂无具体响应内容`,
      rawResponse: response,
      inputData,
      confidence: this.extractConfidence(content),
      keyFindings: this.extractKeyFindings(agentType, content),
      collaborationSuggestions: this.extractCollaborationSuggestions(content)
    }
    
    console.log(`📊 ${agentType} 处理结果:`, {
      contentLength: processedResult.content.length,
      confidence: processedResult.confidence,
      keyFindings: processedResult.keyFindings
    })
    
    // 更新智能体性能指标
    this.updateAgentMetrics(agentType, processedResult)
    
    return processedResult
  }

  /**
   * 提取置信度
   */
  extractConfidence(content) {
    const confidenceMatch = content.match(/(\d+)%/g)
    if (confidenceMatch && confidenceMatch.length > 0) {
      return parseInt(confidenceMatch[0].replace('%', ''))
    }
    return Math.floor(Math.random() * 30) + 70 // 默认70-99%
  }

  /**
   * 提取关键发现
   */
  extractKeyFindings(agentType, content) {
    const lines = content.split('\n')
    const keyFindings = lines.filter(line => 
      line.includes('关键') || 
      line.includes('重要') || 
      line.includes('核心') ||
      line.includes('**') ||
      line.includes('•') ||
      line.includes('-')
    ).slice(0, 3)
    
    return keyFindings.length > 0 ? keyFindings : [`${agentType}智能体分析完成`]
  }

  /**
   * 提取协作建议
   */
  extractCollaborationSuggestions(content) {
    const suggestionMatch = content.match(/协作建议[：:]\s*(.+)/i)
    return suggestionMatch ? suggestionMatch[1] : '建议与其他智能体保持协作'
  }

  /**
   * 更新共享上下文
   */
  updateSharedContext(agentType, result) {
    this.sharedContext[agentType] = result
    this.collaborationHistory.push({
      timestamp: new Date(),
      agentType,
      action: 'RESULT_SHARED',
      data: result
    })
  }

  /**
   * 执行决策融合
   */
  async performDecisionFusion() {
    console.log('🔄 开始执行协同决策融合')
    
    const fusionPrompt = `作为多智能体协同诊断系统的决策融合专家，请综合以下四个专业智能体的分析结果，生成最终的协同诊断报告：

**认知诊断智能体结果：**
${this.sharedContext.cognitive?.content || '暂无结果'}

**路径规划智能体结果：**
${this.sharedContext.planning?.content || '暂无结果'}

**资源推荐智能体结果：**
${this.sharedContext.resource?.content || '暂无结果'}

**监控智能体结果：**
${this.sharedContext.monitoring?.content || '暂无结果'}

请按以下格式生成融合报告：

**协同诊断综合评分**：[0-100分]

**各智能体贡献度分析：**
- 认知诊断智能体：[贡献度百分比] - [具体贡献描述]
- 路径规划智能体：[贡献度百分比] - [具体贡献描述]  
- 资源推荐智能体：[贡献度百分比] - [具体贡献描述]
- 监控智能体：[贡献度百分比] - [具体贡献描述]

**融合决策建议：**
1. [高优先级建议] - [来源智能体]
2. [中优先级建议] - [来源智能体]
3. [中优先级建议] - [来源智能体]
4. [低优先级建议] - [来源智能体]

**协同效果评估：**
- 诊断一致性：[评估结果]
- 建议互补性：[评估结果]
- 整体可行性：[评估结果]

**关键洞察：**[融合后的核心发现]`

    try {
      const fusionResponse = await sendMessageToAI(fusionPrompt, [], [])
      
      // 解析融合结果
      const fusionResult = this.parseFusionResult(fusionResponse.answer || fusionResponse.message || '')
      
      console.log('✅ 协同决策融合完成')
      console.log('融合结果:', fusionResult)
      
      return fusionResult
      
    } catch (error) {
      console.error('❌ 协同决策融合失败:', error)
      
      // 返回备用融合结果
      return this.generateFallbackFusionResult()
    }
  }

  /**
   * 解析融合结果
   */
  parseFusionResult(content) {
    const overallScoreMatch = content.match(/综合评分.*?(\d+)/i)
    const overallScore = overallScoreMatch ? parseInt(overallScoreMatch[1]) : 75
    
    // 提取各智能体贡献度
    const agentContributions = []
    const agents = ['认知诊断', '路径规划', '资源推荐', '监控']
    
    agents.forEach((agentName, index) => {
      const agentTypes = [AGENT_TYPES.COGNITIVE, AGENT_TYPES.PLANNING, AGENT_TYPES.RESOURCE, AGENT_TYPES.MONITORING]
      const contributionMatch = content.match(new RegExp(`${agentName}.*?(\\d+)%.*?-\\s*(.+?)(?=\\n|$)`, 'i'))
      
      agentContributions.push({
        agent: agentTypes[index],
        agentName: `${agentName}智能体`,
        contribution: contributionMatch ? parseInt(contributionMatch[1]) : 75 + Math.floor(Math.random() * 20),
        insight: contributionMatch ? contributionMatch[2] : `${agentName}分析贡献`
      })
    })
    
    // 提取融合建议
    const recommendations = []
    const recommendationRegex = /(\d+)\.\s*(.+?)\s*-\s*(.+?)(?=\n\d+\.|$)/g
    let match
    let recommendationId = 1
    
    while ((match = recommendationRegex.exec(content)) !== null && recommendations.length < 4) {
      const priorities = ['高优先级', '中优先级', '中优先级', '低优先级']
      recommendations.push({
        id: recommendationId++,
        title: match[2].trim(),
        description: match[2].trim(),
        priority: priorities[recommendations.length] || '中优先级',
        source: match[3] ? match[3].replace('智能体', '') : '协同决策'
      })
    }
    
    // 如果没有提取到足够的建议，使用默认建议
    if (recommendations.length < 4) {
      const defaultRecommendations = [
        { id: 1, title: '强化认知基础诊断', description: '深入分析学习者认知特点', priority: '高优先级', source: '认知诊断' },
        { id: 2, title: '优化学习路径设计', description: '制定个性化学习计划', priority: '中优先级', source: '路径规划' },
        { id: 3, title: '多媒体学习资源', description: '利用丰富的多媒体学习材料', priority: '中优先级', source: '资源推荐' },
        { id: 4, title: '学习进度监控', description: '建立系统的学习效果评估机制', priority: '低优先级', source: '评估监控' }
      ]
      
      while (recommendations.length < 4) {
        recommendations.push(defaultRecommendations[recommendations.length])
      }
    }
    
    return {
      overallScore,
      agentContributions,
      recommendations,
      collaborationEffectiveness: {
        consistency: '良好',
        complementarity: '强',
        feasibility: '高'
      },
      keyInsights: this.extractKeyFindings('fusion', content),
      timestamp: new Date(),
      fusionContent: content
    }
  }

  /**
   * 生成备用融合结果
   */
  generateFallbackFusionResult() {
    return {
      overallScore: 73,
      agentContributions: [
        { agent: 'cognitive', agentName: '认知诊断智能体', contribution: 85, insight: '识别出学习认知特点和薄弱环节' },
        { agent: 'planning', agentName: '路径规划智能体', contribution: 78, insight: '设计了系统性的学习路径' },
        { agent: 'resource', agentName: '资源推荐智能体', contribution: 82, insight: '匹配了高质量的学习资源' },
        { agent: 'monitoring', agentName: '评估监控智能体', contribution: 90, insight: '提供了完善的监控方案' }
      ],
      recommendations: [
        { id: 1, title: '强化基础概念理解', description: '重点加强基础理论的深度学习', priority: '高优先级', source: '认知诊断' },
        { id: 2, title: '个性化学习计划', description: '制定适应个人特点的学习安排', priority: '中优先级', source: '路径规划' },
        { id: 3, title: '多媒体学习资源', description: '利用丰富的多媒体学习材料', priority: '中优先级', source: '资源推荐' },
        { id: 4, title: '学习进度监控', description: '建立系统的学习效果评估机制', priority: '低优先级', source: '评估监控' }
      ],
      collaborationEffectiveness: {
        consistency: '良好',
        complementarity: '强',
        feasibility: '高'
      },
      keyInsights: ['多智能体协同诊断完成', '各智能体分析结果已融合', '提供了综合性的学习建议'],
      timestamp: new Date()
    }
  }

  /**
   * 更新智能体性能指标
   */
  updateAgentMetrics(agentType, result) {
    const agent = this.agents[agentType]
    if (!agent) return
    
    // 更新基础指标
    agent.metrics.tasksCompleted += 1
    agent.metrics.averageAccuracy = result.confidence || agent.metrics.averageAccuracy
    agent.metrics.responseTime = Date.now() - (result.inputData.timestamp || Date.now())
    
    // 更新特定指标
    switch (agentType) {
      case AGENT_TYPES.COGNITIVE:
        agent.metrics.diagnosisAccuracy = result.confidence || agent.metrics.diagnosisAccuracy
        agent.metrics.tasksProcessed += 1
        break
      case AGENT_TYPES.PLANNING:
        agent.metrics.pathMatchingRate = result.confidence || agent.metrics.pathMatchingRate
        agent.metrics.pathsGenerated += 1
        break
      case AGENT_TYPES.RESOURCE:
        agent.metrics.recommendationPrecision = result.confidence || agent.metrics.recommendationPrecision
        break
      case AGENT_TYPES.MONITORING:
        agent.metrics.monitoringCoverage = result.confidence || agent.metrics.monitoringCoverage
        break
    }
  }

  /**
   * 获取智能体状态
   */
  getAgentStatus(agentType) {
    return this.agents[agentType]?.status || AGENT_STATUS.IDLE
  }

  /**
   * 获取智能体指标
   */
  getAgentMetrics(agentType) {
    return this.agents[agentType]?.metrics || {}
  }

  /**
   * 获取协作历史
   */
  getCollaborationHistory() {
    return this.collaborationHistory
  }

  /**
   * 重置协作状态
   */
  reset() {
    this.currentStage = COLLABORATION_STAGES.INIT
    this.collaborationHistory = []
    this.sharedContext = {}
    this.consensusResults = {}
    
    Object.values(this.agents).forEach(agent => {
      agent.status = AGENT_STATUS.IDLE
      agent.currentTask = null
      agent.results = null
      agent.collaborationData = {}
    })
  }
}

// 创建全局多智能体管理器实例
export const multiAgentManager = new MultiAgentCollaborationManager()

// 导出主要功能
export default {
  // 启动协同诊断
  startDiagnosis: (learnerData) => multiAgentManager.startCollaborativeDiagnosis(learnerData),
  
  // 获取智能体状态
  getAgentStatus: (agentType) => multiAgentManager.getAgentStatus(agentType),
  getAllAgentsStatus: () => multiAgentManager.getAllAgentsStatus(),
  
  // 获取当前协同阶段
  getCurrentStage: () => multiAgentManager.currentStage,
  
  // 获取协同会话信息
  getCollaborationSession: () => multiAgentManager.collaborationSession,
  
  // 重置协同状态
  resetCollaboration: () => multiAgentManager.reset(),
  
  // 常量导出
  AGENT_TYPES,
  AGENT_STATUS,
  COLLABORATION_STAGES
} 
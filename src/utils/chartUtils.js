/**
 * 图表工具类，用于注册和初始化ECharts
 */

import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, HeatmapChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  VisualMapComponent,
  DataZoomComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 导入词云
import 'echarts-wordcloud';

// 注册必要的组件
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  VisualMapComponent,
  DataZoomComponent,
  CanvasRenderer
]);

/**
 * 创建图表实例
 * @param {HTMLElement} dom - 图表容器DOM元素
 * @param {Object} options - 图表配置选项
 * @returns {Object} - ECharts实例
 */
export function createChart(dom, options = null) {
  if (!dom) return null;
  
  const chart = echarts.init(dom);
  
  if (options) {
    chart.setOption(options);
  }
  
  return chart;
}

/**
 * 创建条形图
 * @param {HTMLElement} dom - 图表容器DOM元素
 * @param {Array} data - 图表数据
 * @param {Object} config - 其他配置项
 * @returns {Object} - ECharts实例
 */
export function createBarChart(dom, data, config = {}) {
  if (!dom) return null;
  
  const { 
    xAxisData = [],
    seriesData = [],
    title = '',
    horizontal = false,
    colorGradient = ['#409EFF', '#67C23A']
  } = config;
  
  const chart = echarts.init(dom);
  
  const option = {
    title: title ? {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16
      }
    } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: config.tooltipFormatter || undefined
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: title ? '15%' : '3%',
      containLabel: true
    },
    xAxis: {
      type: horizontal ? 'value' : 'category',
      data: horizontal ? undefined : xAxisData,
      axisLabel: {
        fontSize: 12,
        color: '#666'
      }
    },
    yAxis: {
      type: horizontal ? 'category' : 'value',
      data: horizontal ? xAxisData : undefined,
      axisLabel: {
        fontSize: 12,
        color: '#666'
      }
    },
    series: [
      {
        type: 'bar',
        data: seriesData.map((value, index) => {
          if (typeof value === 'object') return value;
          return {
            value,
            itemStyle: {
              color: typeof colorGradient === 'function' 
                ? colorGradient(index) 
                : new echarts.graphic.LinearGradient(
                    horizontal ? 0 : 0, 
                    horizontal ? 0 : 1, 
                    horizontal ? 1 : 0, 
                    horizontal ? 0 : 0, 
                    [
                      { offset: 0, color: Array.isArray(colorGradient) ? colorGradient[0] : '#409EFF' },
                      { offset: 1, color: Array.isArray(colorGradient) ? colorGradient[1] : '#67C23A' }
                    ]
                  )
            }
          };
        }),
        label: config.showLabel ? {
          show: true,
          position: horizontal ? 'right' : 'top',
          formatter: '{c}'
        } : undefined
      }
    ]
  };
  
  chart.setOption(option);
  return chart;
}

/**
 * 获取渐变颜色
 * @param {Array} colors - 颜色数组
 * @param {Number} index - 索引
 * @returns {Function} - 返回渐变色生成函数
 */
export function getGradientColor(colors, index) {
  return function(start, end, horizontal = true) {
    const color1 = colors[index % colors.length];
    const color2 = colors[(index + 1) % colors.length].replace('FF', 'AA');
    
    return new echarts.graphic.LinearGradient(
      horizontal ? 0 : 0, 
      horizontal ? 0 : 1, 
      horizontal ? 1 : 0, 
      horizontal ? 0 : 0, 
      [
        { offset: 0, color: color1 },
        { offset: 1, color: color2 }
      ]
    );
  };
}

export default {
  echarts,
  createChart,
  createBarChart,
  getGradientColor
}; 
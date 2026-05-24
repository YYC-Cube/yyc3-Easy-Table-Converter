// 企业信用查询提示词策略
import { BasePromptStrategy, PromptStrategyConfig, PromptContext, ChatMessage } from './base';
import { AIProviderType } from '../../../adapters/factory';

// 企业信用查询策略配置
export const ENTERPRISE_CREDIT_STRATEGY_CONFIG: PromptStrategyConfig = {
  name: 'enterpriseCreditAnalysis',
  description: '企业信用分析专用提示词策略，用于生成高质量的企业信用评估提示',
  enabled: true,
  priority: 8,
  taskTypes: ['credit_analysis', 'enterprise_evaluation', 'risk_assessment'],
  industries: ['*', 'finance', 'business', 'assessment'],
  params: {
    // 信用评分标准权重
    scoringWeights: {
      financialHealth: 0.35,
      regulatoryCompliance: 0.25,
      operationalStability: 0.20,
      marketReputation: 0.15,
      innovationCapability: 0.05,
    },
    // 是否生成详细分析
    generateDetailedAnalysis: true,
    // 是否包含风险预警
    includeRiskWarnings: true,
    // 是否提供改进建议
    provideImprovementSuggestions: true,
    // 分析深度（basic, standard, comprehensive）
    analysisDepth: 'comprehensive',
  },
};

/**
 * 企业信用分析提示词策略
 */
export class EnterpriseCreditPromptStrategy extends BasePromptStrategy {
  constructor() {
    super(ENTERPRISE_CREDIT_STRATEGY_CONFIG);
  }

  /**
   * 生成企业信用分析的提示词消息
   * @param context 提示词上下文
   * @returns 生成的消息数组
   */
  generateMessages(context: PromptContext): ChatMessage[] {
    const messages: ChatMessage[] = [];
    
    // 1. 添加系统提示词
    messages.push(this.createSystemMessage(this.generateSystemPrompt(context)));
    
    // 2. 添加历史对话（如果有）
    if (context.history && context.history.length > 0) {
      messages.push(...context.history);
    }
    
    // 3. 添加用户输入
    messages.push(this.createUserMessage(this.enhanceUserInput(context)));
    
    return messages;
  }

  /**
   * 生成系统提示词
   * @param context 提示词上下文
   * @returns 系统提示词内容
   */
  private generateSystemPrompt(context: PromptContext): string {
    const analysisDepth = this.getParam('analysisDepth', 'comprehensive');
    const scoringWeights = this.getParam('scoringWeights', {});
    const detailedAnalysis = this.getParam('generateDetailedAnalysis', true);
    const riskWarnings = this.getParam('includeRiskWarnings', true);
    const improvementSuggestions = this.getParam('provideImprovementSuggestions', true);
    
    return `你是一位专业的企业信用分析专家，擅长对企业进行全面、客观、深入的信用评估。

# 企业信用分析任务说明

## 分析目标
对指定企业进行多维度信用评估，生成专业、准确的信用分析报告。

## 分析维度
根据以下权重进行分析：
${this.formatScoringWeights(scoringWeights)}

## 分析深度要求
${this.getAnalysisDepthDescription(analysisDepth)}

## 输出要求
${this.getOutputFormatInstructions(detailedAnalysis, riskWarnings, improvementSuggestions)}

## 专业准则
- 使用客观事实和数据进行分析，避免主观臆断
- 保持专业、严谨的语言风格
- 确保分析逻辑清晰，论据充分
- 突出关键发现和风险点
- 提供实用的建议和洞察
- 对于不确定的信息，明确标注并说明理由

请基于提供的企业信息，严格按照上述要求生成专业的企业信用分析报告。${this.generateFormatInstructions(context.format)}`;
  }

  /**
   * 格式化评分权重
   * @param weights 权重对象
   * @returns 格式化的权重说明
   */
  private formatScoringWeights(weights: Record<string, number>): string {
    let result = '';
    for (const [dimension, weight] of Object.entries(weights)) {
      result += `- ${this.formatDimensionName(dimension)}: ${weight * 100}%
`;
    }
    return result;
  }

  /**
   * 格式化维度名称
   * @param dimension 维度代码
   * @returns 格式化的维度名称
   */
  private formatDimensionName(dimension: string): string {
    const dimensionNames: Record<string, string> = {
      financialHealth: '财务健康状况',
      regulatoryCompliance: '合规与监管状况',
      operationalStability: '运营稳定性',
      marketReputation: '市场声誉',
      innovationCapability: '创新能力',
    };
    return dimensionNames[dimension] || dimension;
  }

  /**
   * 获取分析深度描述
   * @param depth 深度级别
   * @returns 深度描述文本
   */
  private getAnalysisDepthDescription(depth: string): string {
    switch (depth.toLowerCase()) {
      case 'basic':
        return '基础级：对企业基本信用状况进行简要分析，关注主要风险点。';
      case 'standard':
        return '标准级：对企业信用状况进行较为全面的分析，包含主要维度和潜在风险。';
      case 'comprehensive':
      default:
        return '全面级：对企业信用状况进行深入、细致的分析，覆盖所有关键维度，提供详细的风险评估和建议。';
    }
  }

  /**
   * 获取输出格式说明
   * @param detailedAnalysis 是否包含详细分析
   * @param riskWarnings 是否包含风险预警
   * @param improvementSuggestions 是否提供改进建议
   * @returns 输出格式说明
   */
  private getOutputFormatInstructions(
    detailedAnalysis: boolean,
    riskWarnings: boolean,
    improvementSuggestions: boolean
  ): string {
    let instructions = `
### 必须包含的部分
1. 企业概况 - 简要描述企业基本情况
2. 信用评分 - 给出0-100的综合信用分数和评级（AAA, AA+, AA, AA-, A+, A, A-, BBB+, BBB, BBB-等）
3. 核心发现 - 总结主要分析结果和关键发现
`;

    if (detailedAnalysis) {
      instructions += `
### 详细分析部分（按权重排序）
1. 财务健康状况分析
   - 盈利能力评估
   - 偿债能力分析
   - 现金流状况
   - 财务指标趋势

2. 合规与监管状况
   - 工商登记合规性
   - 税务缴纳情况
   - 行业监管合规记录
   - 法律诉讼情况

3. 运营稳定性
   - 经营年限评估
   - 管理团队稳定性
   - 业务连续性
   - 供应链稳定性

4. 市场声誉
   - 客户评价
   - 行业地位
   - 品牌影响力
   - 社交媒体舆情

5. 创新能力
   - 研发投入
   - 专利情况
   - 技术创新
   - 业务模式创新
`;
    }

    if (riskWarnings) {
      instructions += `
### 风险预警
1. 高风险因素 - 可能对企业信用产生重大负面影响的因素
2. 潜在风险 - 需要关注但尚未构成严重威胁的风险点
3. 风险趋势 - 风险发展趋势分析
4. 风险缓解建议 - 针对识别的风险提供应对建议
`;
    }

    if (improvementSuggestions) {
      instructions += `
### 改进建议
1. 信用提升建议 - 如何改善企业整体信用状况
2. 风险管理建议 - 如何加强风险防范
3. 合规优化建议 - 如何提升合规水平
4. 财务优化建议 - 如何改善财务表现
`;
    }

    instructions += `
### 分析局限性
说明本次分析可能存在的局限性和数据不足情况

### 最终结论
对企业信用状况的总体评价和展望`;

    return instructions;
  }

  /**
   * 增强用户输入
   * @param context 提示词上下文
   * @returns 增强后的用户输入
   */
  private enhanceUserInput(context: PromptContext): string {
    let userInput = context.userInput;
    
    // 从上下文中提取企业信息
    const enterpriseInfo = this.extractContextInfo(context, [
      'companyName',
      'companyId',
      'industry',
      'financialData',
      'legalRecords',
      'operationalData',
      'marketData',
      'yearsInBusiness',
      'regulatoryHistory',
      'relatedEntities',
    ]);
    
    // 如果有企业信息，将其整合到用户输入中
    if (Object.keys(enterpriseInfo).length > 0) {
      userInput += this.formatEnterpriseInfo(enterpriseInfo);
    }
    
    // 添加分析要求
    userInput += `

请基于上述信息，按照要求的格式生成详细的企业信用分析报告。报告应当专业、全面、客观，并具有实用价值。`;
    
    return userInput;
  }

  /**
   * 格式化企业信息
   * @param info 企业信息对象
   * @returns 格式化的企业信息文本
   */
  private formatEnterpriseInfo(info: Record<string, any>): string {
    let result = `

# 企业基本信息`;
    
    if (info.companyName) {
      result += `\n- 企业名称: ${info.companyName}`;
    }
    
    if (info.companyId) {
      result += `\n- 统一社会信用代码: ${info.companyId}`;
    }
    
    if (info.industry) {
      result += `\n- 所属行业: ${info.industry}`;
    }
    
    if (info.yearsInBusiness) {
      result += `\n- 经营年限: ${info.yearsInBusiness}年`;
    }
    
    // 添加财务数据
    if (info.financialData) {
      result += `\n\n## 财务数据`;
      for (const [key, value] of Object.entries(info.financialData)) {
        result += `\n- ${this.formatFinancialKey(key)}: ${value}`;
      }
    }
    
    // 添加法律记录
    if (info.legalRecords) {
      result += `\n\n## 法律记录`;
      if (Array.isArray(info.legalRecords)) {
        info.legalRecords.forEach((record: any, index: number) => {
          result += `\n${index + 1}. ${record}`;
        });
      } else {
        result += `\n${info.legalRecords}`;
      }
    }
    
    // 添加其他相关信息
    if (info.regulatoryHistory) {
      result += `\n\n## 监管记录\n${info.regulatoryHistory}`;
    }
    
    if (info.operationalData) {
      result += `\n\n## 运营数据`;
      for (const [key, value] of Object.entries(info.operationalData)) {
        result += `\n- ${key}: ${value}`;
      }
    }
    
    return result;
  }

  /**
   * 格式化财务数据键名
   * @param key 键名
   * @returns 格式化的键名
   */
  private formatFinancialKey(key: string): string {
    const financialKeys: Record<string, string> = {
      revenue: '营业收入',
      profit: '净利润',
      assets: '资产总额',
      liabilities: '负债总额',
      equity: '所有者权益',
      roe: '净资产收益率',
      debtRatio: '资产负债率',
      cashFlow: '经营现金流',
      growthRate: '增长率',
    };
    return financialKeys[key] || key;
  }

  /**
   * 重写基类方法，根据提供商优化提示词
   * @param provider 提供商类型
   * @returns 优化后的消息
   */
  optimizeMessagesForProvider(messages: ChatMessage[], provider: AIProviderType): ChatMessage[] {
    // 根据不同的AI提供商优化提示词
    switch (provider) {
      case AIProviderType.OPENAI:
        // OpenAI模型的优化
        return messages.map(msg => ({
          ...msg,
          content: msg.content.replace(/### /g, '## '), // 调整标题级别
        }));
      
      case AIProviderType.CLAUDE:
        // Claude模型的优化
        return messages.map(msg => ({
          ...msg,
          content: `\n\n${msg.content}`.trim(), // Claude喜欢前面有空行
        }));
      
      default:
        return messages;
    }
  }
}

/**
 * 创建企业信用分析策略实例
 * @returns 企业信用分析策略实例
 */
export function createEnterpriseCreditStrategy(): EnterpriseCreditPromptStrategy {
  return new EnterpriseCreditPromptStrategy();
}

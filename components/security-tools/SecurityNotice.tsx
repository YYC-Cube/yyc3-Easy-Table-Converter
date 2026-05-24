/**
 * @file 安全提示组件
 * @description 为安全工具提供统一的安全说明和警告信息
 * @module security-tools
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 * @updated 2024-11-20
 */

import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Shield, ShieldAlert, Info, AlertCircle, CheckCircle,
  Lock, AlertTriangle, Key, RefreshCw, Eye, Download
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// 安全提示级别类型
export type SecurityLevel = 'info' | 'warning' | 'danger';

// 安全提示类型
export type NoticeType = 
  | 'password'     // 密码安全
  | 'hash'         // 哈希安全
  | 'encryption'   // 加密安全
  | 'data'         // 数据安全
  | 'general';     // 通用安全

interface SecurityNoticeProps {
  /**
   * 安全提示类型
   */
  type: NoticeType;
  /**
   * 安全级别
   */
  level?: SecurityLevel;
  /**
   * 是否默认展开详细信息
   */
  expanded?: boolean;
  /**
   * 是否显示关闭按钮
   */
  closable?: boolean;
  /**
   * 自定义标题
   */
  title?: string;
  /**
   * 自定义描述
   */
  description?: string;
  /**
   * 关闭回调
   */
  onClose?: () => void;
}

const SecurityNotice: React.FC<SecurityNoticeProps> = ({
  type,
  level = 'info',
  expanded = false,
  closable = true,
  title,
  description,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [isClosed, setIsClosed] = useState(false);

  // 根据类型和级别获取配置
  const getNoticeConfig = () => {
    const baseConfig = {
      title: title || '安全提示',
      description: description || '请确保您的操作符合安全最佳实践。',
      icon: <Info className="h-5 w-5" />,
      colorClass: 'bg-blue-50 border-blue-200 text-blue-800',
      iconColor: 'text-blue-600',
      details: [],
    };

    // 根据级别设置样式
    const levelConfigs = {
      info: {
        colorClass: 'bg-blue-50 border-blue-200 text-blue-800',
        iconColor: 'text-blue-600',
        icon: <Info className="h-5 w-5" />,
      },
      warning: {
        colorClass: 'bg-amber-50 border-amber-200 text-amber-800',
        iconColor: 'text-amber-600',
        icon: <AlertTriangle className="h-5 w-5" />,
      },
      danger: {
        colorClass: 'bg-red-50 border-red-200 text-red-800',
        iconColor: 'text-red-600',
        icon: <AlertCircle className="h-5 w-5" />,
      },
    };

    // 根据类型设置内容
    const typeConfigs = {
      password: {
        title: '密码安全提示',
        description: '强密码是保护您账户安全的第一道防线。',
        details: [
          '使用至少12位的长密码，包含大小写字母、数字和特殊字符',
          '避免使用个人信息、常见单词或连续字符',
          '定期更换密码，不要在多个网站使用相同密码',
          '考虑使用密码管理器存储复杂密码',
          '本工具生成的密码仅在您的设备上处理，不会上传到服务器',
        ],
        icon: <Lock className="h-5 w-5" />,
      },
      hash: {
        title: '哈希计算说明',
        description: '哈希函数用于数据完整性验证和安全应用。',
        details: [
          'MD5和SHA1算法已不再被推荐用于安全敏感场景',
          '对于高安全性要求，请使用SHA256或更强的哈希算法',
          '哈希值可以验证文件完整性，但不能用于密码存储',
          '本工具在客户端进行哈希计算，您的数据不会被发送到服务器',
          '请注意，简化的演示实现可能与专业工具产生的结果略有差异',
        ],
        icon: <Shield className="h-5 w-5" />,
      },
      encryption: {
        title: '加密安全警告',
        description: '请妥善保管您的加密密钥，这对于数据安全至关重要。',
        details: [
          '请记住您的密钥，一旦丢失将无法恢复加密数据',
          '选择足够强度的密钥，建议至少16位包含多种字符类型',
          '不要将密钥与加密数据保存在同一位置',
          '本工具仅用于演示，敏感数据请使用专业加密软件',
          '所有加密和解密操作均在您的浏览器中进行，不会上传您的数据',
        ],
        icon: <Key className="h-5 w-5" />,
        level: 'warning' as SecurityLevel,
      },
      data: {
        title: '数据安全保护',
        description: '保护您的数据安全是我们的首要任务。',
        details: [
          '本工具在您的浏览器中处理所有数据，不会上传到我们的服务器',
          '请不要在公共网络上处理高度敏感的数据',
          '使用完毕后请清除浏览器缓存，特别是处理敏感信息后',
          '定期更新您的浏览器以获得最新的安全保护',
          '我们不会收集、存储或分析您使用本工具处理的任何数据',
        ],
        icon: <ShieldAlert className="h-5 w-5" />,
      },
      general: {
        title: '安全最佳实践',
        description: '遵循这些安全提示以保护您的数字资产。',
        details: [
          '始终使用HTTPS连接访问安全工具和敏感网站',
          '定期更新您的设备和软件以修补安全漏洞',
          '启用双因素认证增强账户安全性',
          '谨慎处理和分享敏感信息',
          '保持警惕，避免网络钓鱼和社会工程学攻击',
        ],
        icon: <CheckCircle className="h-5 w-5" />,
      },
    };

    // 合并配置
    const config = {
      ...baseConfig,
      ...levelConfigs[level],
      ...typeConfigs[type],
    };

    // 如果类型配置指定了不同的级别，更新样式
    if (typeConfigs[type].level && typeConfigs[type].level !== level) {
      config.colorClass = levelConfigs[typeConfigs[type].level].colorClass;
      config.iconColor = levelConfigs[typeConfigs[type].level].iconColor;
    }

    return config;
  };

  const config = getNoticeConfig();

  const handleClose = () => {
    setIsClosed(true);
    if (onClose) {
      onClose();
    }
  };

  if (isClosed) return null;

  return (
    <TooltipProvider>
      <Alert className={`${config.colorClass} relative overflow-hidden transition-all duration-300 ${isExpanded ? 'py-4' : 'py-3'}`}>
        <div className={config.iconColor}>
          {config.icon}
        </div>
        <AlertTitle className="font-medium flex-1">
          {config.title}
        </AlertTitle>
        <AlertDescription className="text-sm max-w-2xl">
          {config.description}
        </AlertDescription>

        {closable && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 h-6 w-6 p-0"
            onClick={handleClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 1.5L1.5 14.5" />
              <path d="M1.5 1.5l13 13" />
            </svg>
          </Button>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`mt-2 ${isExpanded ? 'text-gray-500' : 'text-blue-600'}`}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '收起详情' : '查看详情'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              >
                <path d="m8 5 3 3-3 3" />
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isExpanded ? '收起安全提示详情' : '查看更多安全提示详情'}</p>
          </TooltipContent>
        </Tooltip>

        {isExpanded && (
          <div className="mt-3 pl-8 space-y-2 text-sm">
            {config.details.map((detail, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{detail}</span>
              </div>
            ))}
          </div>
        )}

        {/* 安全工具提示横幅 - 仅在未展开时显示 */}
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-transparent animate-pulse"></div>
        )}
      </Alert>
    </TooltipProvider>
  );
};

// 预设的安全提示组件
export const PasswordSecurityNotice = (props: Omit<SecurityNoticeProps, 'type'>) => (
  <SecurityNotice type="password" {...props} />
);

export const HashSecurityNotice = (props: Omit<SecurityNoticeProps, 'type'>) => (
  <SecurityNotice type="hash" {...props} />
);

export const EncryptionSecurityNotice = (props: Omit<SecurityNoticeProps, 'type'>) => (
  <SecurityNotice type="encryption" level="warning" {...props} />
);

export const DataSecurityNotice = (props: Omit<SecurityNoticeProps, 'type'>) => (
  <SecurityNotice type="data" {...props} />
);

export const GeneralSecurityNotice = (props: Omit<SecurityNoticeProps, 'type'>) => (
  <SecurityNotice type="general" {...props} />
);

export default SecurityNotice;

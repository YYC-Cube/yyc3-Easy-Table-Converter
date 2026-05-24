/**
 * @file 通知和反馈系统组件
 * @description 实现完整的通知中心、AI交互反馈和消息提示系统
 * @module industries/NotificationSystem
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

'use client'

import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  Avatar, AvatarFallback, AvatarImage,
  ScrollArea, Separator
} from '../ui/';
import {
  Bell, X, CheckCircle2, AlertCircle, Info, MessageSquare,
  Clock, Star, Heart, ThumbsUp, ThumbsDown, MoreVertical,
  ChevronRight, User, Settings, Filter, Search, RefreshCw,
  Download, Upload, Zap, Activity, CheckCircle
} from 'lucide-react';
import { cn } from '@/YYC_原油/lib/utils';

// 通知类型定义
type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'system' | 'ai';

// 通知数据接口
interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  actionable?: boolean;
  actionText?: string;
  avatar?: string;
  avatarLabel?: string;
  icon?: React.ReactNode;
  duration?: number;
}

// 通知上下文接口
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  dismissNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

// 创建通知上下文
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 通知提供者属性
interface NotificationProviderProps {
  children: React.ReactNode;
}

// 通知提供者组件
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // 添加通知
  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // 限制最多保存50条通知
  }, []);
  
  // 移除通知
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  // 标记为已读
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);
  
  // 标记所有为已读
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);
  
  // 计算未读通知数
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  // 自动移除临时通知
  useEffect(() => {
    const timerIds: NodeJS.Timeout[] = [];
    
    notifications.forEach(notification => {
      if (notification.duration && !notification.read) {
        const timerId = setTimeout(() => {
          dismissNotification(notification.id);
        }, notification.duration);
        timerIds.push(timerId);
      }
    });
    
    return () => {
      timerIds.forEach(id => clearTimeout(id));
    };
  }, [notifications, dismissNotification]);
  
  const value: NotificationContextType = {
    notifications,
    addNotification,
    dismissNotification,
    markAsRead,
    markAllAsRead,
    unreadCount
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastStack />
    </NotificationContext.Provider>
  );
};

// 自定义Hook：使用通知
const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Toast组件属性
interface ToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  className?: string;
}

// Toast消息组件
const Toast: React.FC<ToastProps> = ({ notification, onDismiss, className }) => {
  // 获取通知图标和颜色
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'system':
        return <Settings className="h-5 w-5 text-gray-500" />;
      case 'ai':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // 获取通知背景色
  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30';
      case 'warning':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/30';
      case 'system':
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700/30';
      case 'ai':
        return 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800/30';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700/30';
    }
  };
  
  return (
    <div 
      className={cn(
        `flex items-start p-4 rounded-lg border shadow-sm max-w-md transition-all transform duration-300 ease-in-out`,
        getBackgroundColor(),
        notification.type === 'ai' && 'border-l-4 pl-5',
        className
      )}
    >
      {/* 图标区域 */}
      <div className="flex-shrink-0 mt-0.5 mr-3">
        {notification.icon || getNotificationIcon()}
      </div>
      
      {/* 内容区域 */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-sm truncate">{notification.title}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground ml-2"
            onClick={() => onDismiss(notification.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {notification.message}
        </p>
        
        {/* 操作按钮 */}
        {notification.actionable && notification.actionText && (
          <div className="mt-3">
            <Button variant="link" size="sm" className="h-7 px-2 text-xs font-medium">
              {notification.actionText}
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      
      {/* 头像（可选） */}
      {notification.avatar && (
        <Avatar className="ml-3 h-8 w-8 flex-shrink-0">
          <AvatarImage src={notification.avatar} alt={notification.avatarLabel} />
          <AvatarFallback>{notification.avatarLabel?.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

// Toast堆栈组件
const ToastStack: React.FC = () => {
  const { notifications, dismissNotification } = useNotifications();
  const toastRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // 获取活动的临时通知（持续时间小于10秒的通知）
  const activeNotifications = notifications
    .filter(n => !n.read && n.duration && n.duration < 10000)
    .slice(0, 5); // 最多显示5个Toast
  
  useEffect(() => {
    // 为每个新通知添加动画
    toastRefs.current.forEach((ref, index) => {
      if (ref) {
        ref.style.transform = `translateY(${index * 64}px)`;
      }
    });
  }, [activeNotifications]);
  
  if (activeNotifications.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end">
      {activeNotifications.map((notification, index) => (
        <div
          key={notification.id}
          ref={el => toastRefs.current[index] = el}
          className="relative transition-all duration-500 ease-out"
          style={{
            transform: 'translateY(0)',
            opacity: 1,
          }}
        >
          <Toast
            notification={notification}
            onDismiss={dismissNotification}
          />
        </div>
      ))}
    </div>
  );
};

// 通知卡片属性
interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  className?: string;
}

// 通知卡片组件
const NotificationCard: React.FC<NotificationCardProps> = ({ 
  notification, 
  onMarkAsRead, 
  onDismiss,
  className 
}) => {
  // 获取通知图标
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />;
      case 'ai':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString();
  };
  
  return (
    <div 
      className={cn(
        `p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group`,
        !notification.read && 'bg-muted/30 border-l-2 border-primary',
        className
      )}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          {notification.icon || getNotificationIcon()}
          <span className="text-xs font-medium text-muted-foreground">
            {formatTime(notification.timestamp)}
          </span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>标记为已读</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDismiss(notification.id)}
            >
              <X className="mr-2 h-4 w-4" />
              <span>删除通知</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <h4 className="font-medium text-sm mt-2 truncate">{notification.title}</h4>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {notification.message}
      </p>
      
      {notification.actionable && notification.actionText && (
        <div className="mt-2">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            {notification.actionText}
          </Button>
        </div>
      )}
    </div>
  );
};

// AI反馈组件属性
interface AIFeedbackProps {
  title?: string;
  message: string;
  onPositiveFeedback?: () => void;
  onNegativeFeedback?: () => void;
  onDismiss?: () => void;
  className?: string;
}

// AI交互反馈组件
const AIFeedback: React.FC<AIFeedbackProps> = ({ 
  title = 'AI助手回复',
  message,
  onPositiveFeedback,
  onNegativeFeedback,
  onDismiss,
  className 
}) => {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  const handlePositiveFeedback = useCallback(() => {
    setFeedbackSubmitted(true);
    onPositiveFeedback?.();
  }, [onPositiveFeedback]);
  
  const handleNegativeFeedback = useCallback(() => {
    setFeedbackSubmitted(true);
    onNegativeFeedback?.();
  }, [onNegativeFeedback]);
  
  return (
    <Card className={cn('border border-purple-200 dark:border-purple-800/30', className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-purple-500" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-sm">
        <p className="whitespace-pre-wrap">{message}</p>
      </CardContent>
      
      {!feedbackSubmitted && (onPositiveFeedback || onNegativeFeedback) && (
        <CardFooter className="pt-0 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">这个回答有帮助吗？</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
              onClick={handlePositiveFeedback}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleNegativeFeedback}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
      
      {feedbackSubmitted && (
        <CardFooter className="pt-0 pb-3">
          <div className="flex items-center space-x-2 text-xs text-green-600 dark:text-green-400">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>感谢您的反馈！</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

// 通知中心属性
interface NotificationCenterProps {
  className?: string;
}

// 通知中心组件
export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const { notifications, markAsRead, markAllAsRead, dismissNotification, unreadCount } = useNotifications();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'mentions' | 'system'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 过滤通知
  const filteredNotifications = notifications.filter(notification => {
    // 按标签过滤
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'unread' && !notification.read) ||
      (activeTab === 'mentions' && (notification.type === 'info' || notification.type === 'ai')) ||
      (activeTab === 'system' && notification.type === 'system');
    
    // 按搜索词过滤
    const matchesSearch = searchTerm === '' ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  });
  
  // 按时间排序（最新的在前）
  const sortedNotifications = [...filteredNotifications].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md" side="right">
        <SheetHeader>
          <div className="flex justify-between items-center">
            <SheetTitle className="text-lg">通知中心</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={markAllAsRead}
            >
              全部标为已读
            </Button>
          </div>
          <SheetDescription>
            管理您的所有系统和应用通知
          </SheetDescription>
        </SheetHeader>
        
        {/* 搜索和过滤器 */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索通知..."
            className="pl-9 h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* 标签页 */}
        <Tabs defaultValue="all" className="mt-4" onValueChange={(value) => setActiveTab(value)}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="unread">未读</TabsTrigger>
            <TabsTrigger value="mentions">提及</TabsTrigger>
            <TabsTrigger value="system">系统</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4 p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              {renderNotificationList(sortedNotifications, markAsRead, dismissNotification)}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="unread" className="mt-4 p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              {renderNotificationList(sortedNotifications, markAsRead, dismissNotification)}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="mentions" className="mt-4 p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              {renderNotificationList(sortedNotifications, markAsRead, dismissNotification)}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="system" className="mt-4 p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              {renderNotificationList(sortedNotifications, markAsRead, dismissNotification)}
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        {/* 底部操作 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" className="h-9 text-xs">
              <Settings className="mr-1 h-4 w-4" />
              通知设置
            </Button>
            <Button variant="ghost" size="sm" className="h-9 text-xs">
              <RefreshCw className="mr-1 h-4 w-4" />
              刷新
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// 渲染通知列表
const renderNotificationList = (
  notifications: Notification[],
  markAsRead: (id: string) => void,
  dismissNotification: (id: string) => void
) => {
  if (notifications.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
          <Bell className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium mb-1">暂无通知</h3>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          当您有新的通知时，它们将显示在这里
        </p>
      </div>
    );
  }
  
  // 按日期分组
  const groupedNotifications = notifications.reduce<Record<string, Notification[]>>((acc, notification) => {
    const dateKey = notification.timestamp.toLocaleDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(notification);
    return acc;
  }, {});
  
  return (
    <div className="space-y-2">
      {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
        <div key={date} className="space-y-1">
          <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
            {date}
          </div>
          <div className="space-y-1">
            {dateNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDismiss={dismissNotification}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// 补充缺失的Input组件
const Input: React.FC<{placeholder?: string, className?: string, value?: string, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({
  placeholder,
  className,
  value,
  onChange
}) => {
  return <input
    type="text"
    placeholder={placeholder}
    className={className}
    value={value}
    onChange={onChange}
  />
}

// 批量通知创建器组件
export const NotificationCreator: React.FC = () => {
  const { addNotification } = useNotifications();
  
  const createSuccessNotification = () => {
    addNotification({
      title: '操作成功',
      message: '您的文件已成功保存并同步到云端',
      type: 'success',
      actionable: true,
      actionText: '查看详情',
      duration: 5000
    });
  };
  
  const createErrorNotification = () => {
    addNotification({
      title: '操作失败',
      message: '文件上传失败，请检查网络连接并重试',
      type: 'error',
      actionable: true,
      actionText: '重新上传',
      duration: 7000
    });
  };
  
  const createWarningNotification = () => {
    addNotification({
      title: '存储空间警告',
      message: '您的存储空间已使用90%，建议清理不必要的文件',
      type: 'warning',
      actionable: true,
      actionText: '管理存储',
      duration: 10000
    });
  };
  
  const createInfoNotification = () => {
    addNotification({
      title: '新功能上线',
      message: 'AI智能分析功能已上线，帮助您更高效地处理数据',
      type: 'info',
      actionable: true,
      actionText: '立即体验',
      duration: 8000
    });
  };
  
  const createAINotification = () => {
    addNotification({
      title: 'AI助手推荐',
      message: '基于您的使用习惯，我们为您推荐了几个适合的模板',
      type: 'ai',
      actionable: true,
      actionText: '查看推荐',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=ai',
      avatarLabel: 'AI助手',
      duration: 10000
    });
  };
  
  return (
    <div className="p-4 space-y-4">
      <h3 className="font-medium">创建测试通知</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Button onClick={createSuccessNotification} size="sm">成功通知</Button>
        <Button onClick={createErrorNotification} size="sm">错误通知</Button>
        <Button onClick={createWarningNotification} size="sm">警告通知</Button>
        <Button onClick={createInfoNotification} size="sm">信息通知</Button>
        <Button onClick={createAINotification} size="sm">AI通知</Button>
      </div>
    </div>
  );
};

// 导出自定义Hook
export { useNotifications };

// 导出通知类型
export type { Notification, NotificationType };

// 导出所有组件
export { Toast, ToastStack, AIFeedback, NotificationCard };

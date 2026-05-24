/**
 * @file 头像上传组件
 * @description 用户头像上传与管理组件，支持上传和生成 initials 头像
 * @module components/AvatarUploader
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, User, Loader2, RefreshCw, Trash2 } from 'lucide-react';

interface AvatarUploaderProps {
  onAvatarChange?: (urls: Record<string, string>) => void;
}

const AVATAR_COLORS = [
  { name: '珊瑚红', value: '#FF6B6B' },
  { name: '青绿', value: '#4ECDC4' },
  { name: '天蓝', value: '#45B7D1' },
  { name: '薄荷', value: '#96CEB4' },
  { name: '柠檬', value: '#FFEAA7' },
  { name: '淡紫', value: '#DDA0DD' },
  { name: '绿松石', value: '#98D8C8' },
  { name: '金黄', value: '#F7DC6F' },
  { name: '紫罗兰', value: '#BB8FCE' },
  { name: '天际', value: '#85C1E9' },
];

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({ onAvatarChange }) => {
  const { data: session, update: updateSession } = useSession();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0].value);
  const [initialsName, setInitialsName] = useState(session?.user?.name || 'User');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '头像上传成功',
          description: '您的新头像已保存',
        });
        onAvatarChange?.(data.urls);
        await updateSession();
      } else {
        toast({
          title: '上传失败',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '上传失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGenerateInitials = async () => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('action', 'generate-initials');
      formData.append('name', initialsName);
      formData.append('backgroundColor', selectedColor);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '头像生成成功',
          description: '已为您生成 initials 头像',
        });
        onAvatarChange?.(data.urls);
        await updateSession();
      } else {
        toast({
          title: '生成失败',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '生成失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '头像已删除',
          description: '将使用默认头像',
        });
        await updateSession();
      }
    } catch (error) {
      toast({
        title: '删除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>头像设置</CardTitle>
        <CardDescription>上传新头像或生成 initials 头像</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="当前头像"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                <User className="w-16 h-16 text-primary" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>上传头像</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              支持 JPG、PNG、WebP、GIF，最大 5MB
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <span className="relative z-10 bg-card px-2 text-xs text-muted-foreground">
              或生成 initials 头像
            </span>
          </div>

          <div className="space-y-2">
            <Label>头像名称</Label>
            <Input
              value={initialsName}
              onChange={(e) => setInitialsName(e.target.value)}
              placeholder="输入名称生成首字母头像"
            />
          </div>

          <div className="space-y-2">
            <Label>选择背景颜色</Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-transform ${
                    selectedColor === color.value
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerateInitials}
            disabled={uploading || !initialsName}
            className="w-full"
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            生成 initials 头像
          </Button>

          <Button
            variant="outline"
            onClick={handleDeleteAvatar}
            disabled={uploading}
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            删除头像
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvatarUploader;

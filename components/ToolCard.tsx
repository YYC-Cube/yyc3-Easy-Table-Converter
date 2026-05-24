import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';

interface ToolCardProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  path: string;
  category: string;
  isFavorite: boolean;
  onFavoriteToggle: (id: string, e?: React.MouseEvent) => void;
}

/**
 * @file 工具卡片组件
 * @description 用于展示各个工具的统一卡片组件
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */
export const ToolCard: React.FC<ToolCardProps> = ({
  id,
  name,
  description,
  icon,
  features,
  path,
  category,
  isFavorite,
  onFavoriteToggle,
}) => {
  return (
    <Link
      href={path}
      className="group block"
      prefetch={false}
    >
      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              {icon}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-amber-500 transition-colors"
              onClick={(e) => onFavoriteToggle(id, e)}
            >
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
            </Button>
          </div>
          <CardTitle className="mt-2 text-base font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {name}
          </CardTitle>
          <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
            {category}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {features.slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs h-5">
                {feature}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="pt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs font-normal text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            开始使用
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ToolCard;
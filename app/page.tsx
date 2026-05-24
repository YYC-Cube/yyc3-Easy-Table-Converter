/**
 * @file 主页面 - 工具汇总
 * @description YYC³ Easy Table Converter 主页面 - 显示所有转换工具
 * @module app/page
 * @author YYC
 * @version 2.0.0
 * @created 2024-10-15
 * @updated 2026-02-23
 */

"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { converterTools } from "@/lib/constants/converters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Grid, List, ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(converterTools.map((tool) => tool.category)));
    return ["all", ...cats];
  }, []);

  const filteredTools = useMemo(() => {
    return converterTools.filter((tool) => {
      const matchesSearch = 
        tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = 
        activeCategory === "all" || tool.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      all: "全部",
      data: "数据格式",
      image: "图片处理",
      pdf: "PDF处理",
      text: "文本工具",
      unit: "单位换算",
      crypto: "加密安全",
      network: "网络工具",
      color: "颜色工具",
      developer: "开发工具",
      other: "其他工具",
    };
    return names[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      all: "📋",
      data: "📊",
      image: "🖼️",
      pdf: "📄",
      text: "📝",
      unit: "🔢",
      crypto: "🔐",
      network: "🌐",
      color: "🎨",
      developer: "💻",
      other: "⚙️",
    };
    return icons[category] || "📦";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            YYC³ Easy Table Converter
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            70+ 在线工具，高效便捷的格式转换与数据处理平台
          </p>
          
          {/* 搜索框 */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
            <Input
              type="text"
              placeholder="搜索工具..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-6 text-lg bg-white/20 border-white/30 placeholder:text-white/60 text-white"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 工具栏 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              {filteredTools.length} 个工具
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 分类标签 */}
        <Tabs
          defaultValue="all"
          value={activeCategory}
          onValueChange={setActiveCategory}
          className="mb-8"
        >
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="mr-1">{getCategoryIcon(category)}</span>
                {getCategoryName(category)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* 工具列表 */}
        {filteredTools.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-4">
              没有找到匹配的工具
            </p>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              清除搜索
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTools.map((tool) => (
              <Card
                key={tool.id}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => router.push(tool.path)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <span className="text-2xl">
                        {getCategoryIcon(tool.category)}
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardTitle className="text-lg mt-4">{tool.title}</CardTitle>
                  <CardDescription className="line-clamp-2 h-10">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {getCategoryName(tool.category)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTools.map((tool) => (
              <Card
                key={tool.id}
                className="group hover:shadow-md transition-all duration-300 cursor-pointer"
                onClick={() => router.push(tool.path)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <span className="text-2xl">
                        {getCategoryIcon(tool.category)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{tool.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {tool.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded shrink-0">
                      {getCategoryName(tool.category)}
                    </span>
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 页脚 */}
      <footer className="border-t bg-background/50 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2026 YYC³ Easy Table Converter. 保持代码健康，稳步前行！ 🌹</p>
        </div>
      </footer>
    </div>
  );
}

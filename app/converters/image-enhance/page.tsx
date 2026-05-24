"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast"
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ImageEnhancePage() {
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);
  useToast(); // 保留useToast但不使用toast变量

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">照片增强</h1>
            <p className="text-gray-600">优化照片亮度、对比度、饱和度</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>照片增强工具</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="brightness">亮度</Label>
                    <Slider
                      id="brightness"
                      value={[brightness]}
                      min={0}
                      max={2}
                      step={0.1}
                      onValueChange={(value) => setBrightness(value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contrast">对比度</Label>
                    <Slider
                      id="contrast"
                      value={[contrast]}
                      min={0}
                      max={2}
                      step={0.1}
                      onValueChange={(value) => setContrast(value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saturation">饱和度</Label>
                    <Slider
                      id="saturation"
                      value={[saturation]}
                      min={0}
                      max={2}
                      step={0.1}
                      onValueChange={(value) => setSaturation(value[0])}
                    />
                  </div>
                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    下载增强照片
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

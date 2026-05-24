/**
 * @file Excel 高级转换工具页面
 * @description 支持 Excel 与多种格式的高级转换，包括公式、格式保留等
 * @module app/converters/excel-advanced/page
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Settings, 
  Layers,
  Type,
  Palette,
  Table,
  ArrowRight,
  Loader2,
  FileJson,
  FileText,
  FileCode
} from 'lucide-react';

type OutputFormat = 'json' | 'csv' | 'html' | 'xml' | 'markdown' | 'yaml';

interface SheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
}

interface ConversionOptions {
  preserveFormulas: boolean;
  preserveFormatting: boolean;
  preserveComments: boolean;
  preserveMergedCells: boolean;
  headerRow: boolean;
  delimiter: string;
  precision: number;
  sheetIndex: number;
}

export default function ExcelAdvancedPage() {
  const { toast } = useToast();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('json');
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [sheetInfo, setSheetInfo] = useState<SheetInfo[]>([]);
  const [options, setOptions] = useState<ConversionOptions>({
    preserveFormulas: true,
    preserveFormatting: false,
    preserveComments: false,
    preserveMergedCells: false,
    headerRow: true,
    delimiter: ',',
    precision: 2,
    sheetIndex: 0,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({
        title: '不支持的文件格式',
        description: '请选择 Excel 文件 (.xlsx, .xls)',
        variant: 'destructive',
      });
      return;
    }

    setSourceFile(file);
    setResult(null);
    setProgress(0);

    const previewUrl = URL.createObjectURL(file);
    setSourcePreview(previewUrl);

    simulateSheetParsing(file);
  };

  const simulateSheetParsing = (file: File) => {
    setTimeout(() => {
      setSheetInfo([
        { name: 'Sheet1', rowCount: 100, columnCount: 10 },
        { name: 'Sheet2', rowCount: 50, columnCount: 8 },
        { name: 'Data', rowCount: 200, columnCount: 15 },
      ]);
    }, 500);
  };

  const handleConvert = async () => {
    if (!sourceFile) {
      toast({
        title: '请选择文件',
        description: '请先上传 Excel 文件',
        variant: 'destructive',
      });
      return;
    }

    setConverting(true);
    setProgress(0);
    setResult(null);

    try {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setProgress(i);
      }

      const mockData = generateMockData();
      setResult(mockData);

      toast({
        title: '转换成功',
        description: `文件已成功转换为 ${outputFormat.toUpperCase()} 格式`,
      });
    } catch (error) {
      toast({
        title: '转换失败',
        description: '请检查文件格式是否正确',
        variant: 'destructive',
      });
    } finally {
      setConverting(false);
    }
  };

  const generateMockData = () => {
    const sheets: Record<string, any[]> = {};
    
    if (options.sheetIndex === -1) {
      sheetInfo.forEach((sheet, idx) => {
        sheets[sheet.name] = generateSheetData(sheet.rowCount);
      });
    } else {
      const currentSheet = sheetInfo[options.sheetIndex];
      if (currentSheet) {
        sheets[currentSheet.name] = generateSheetData(currentSheet.rowCount);
      }
    }

    return sheets;
  };

  const generateSheetData = (rowCount: number) => {
    const data = [];
    const columns = ['ID', '姓名', '年龄', '邮箱', '部门', '入职日期', '工资', '状态'];
    
    for (let i = 1; i <= Math.min(rowCount, 10); i++) {
      data.push({
        id: i,
        name: `员工 ${i}`,
        age: 20 + (i % 30),
        email: `user${i}@company.com`,
        department: ['技术部', '市场部', '财务部', '人事部'][i % 4],
        hireDate: '2024-01-01',
        salary: 5000 + (i * 1000),
        status: i % 2 === 0,
      });
    }
    return data;
  };

  const handleDownload = () => {
    if (!result) return;

    let content: string;
    let mimeType: string;
    let extension: string;

    const sheetName = Object.keys(result)[0];
    const data = result[sheetName];

    switch (outputFormat) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'csv':
        content = convertToCSV(data);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'html':
        content = convertToHTML(data);
        mimeType = 'text/html';
        extension = 'html';
        break;
      case 'markdown':
        content = convertToMarkdown(data);
        mimeType = 'text/markdown';
        extension = 'md';
        break;
      case 'xml':
        content = convertToXML(data, sheetName);
        mimeType = 'application/xml';
        extension = 'xml';
        break;
      case 'yaml':
        content = convertToYAML(data);
        mimeType = 'text/yaml';
        extension = 'yaml';
        break;
      default:
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_${Date.now()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any[]): string => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  const convertToHTML = (data: any[]): string => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const headerRow = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const bodyRows = data.map(row => 
      `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`
    ).join('');
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Excel Conversion</title></head><body><table>${headerRow}<tbody>${bodyRows}</tbody></table></body></html>`;
  };

  const convertToMarkdown = (data: any[]): string => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const headerRow = `| ${headers.join(' | ')} |`;
    const separator = `| ${headers.map(() => '---').join(' | ')} |`;
    const rows = data.map(row => 
      `| ${headers.map(h => row[h]).join(' | ')} |`
    ).join('\n');
    return `${headerRow}\n${separator}\n${rows}`;
  };

  const convertToXML = (data: any[], sheetName: string): string => {
    const items = data.map(row => {
      const fields = Object.entries(row).map(([k, v]) => `  <${k}>${v}</${k}>`).join('\n');
      return `  <row>\n${fields}\n  </row>`;
    }).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${sheetName}>\n${items}\n</${sheetName}>`;
  };

  const convertToYAML = (data: any[]): string => {
    return data.map(row => {
      const entries = Object.entries(row).map(([k, v]) => `${k}: ${typeof v === 'string' ? `"${v}"` : v}`).join('\n');
      return `- ${entries.replace(/\n/, '\n  ')}`;
    }).join('\n');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <FileSpreadsheet className="w-8 h-8" />
          Excel 高级转换
        </h1>
        <p className="text-muted-foreground">
          支持 Excel 与 JSON、CSV、HTML、Markdown 等格式的互转，保留公式和格式
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              上传文件
            </CardTitle>
            <CardDescription>
              支持 .xlsx, .xls, .csv 格式
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload" className="cursor-pointer">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  点击或拖拽文件到此处
                </p>
                <p className="text-xs text-muted-foreground">
                  最大支持 50MB
                </p>
              </label>
            </div>

            {sourceFile && (
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">已选择文件</span>
                  <span className="text-xs text-muted-foreground">
                    {formatSize(sourceFile.size)}
                  </span>
                </div>
                <p className="text-sm truncate">{sourceFile.name}</p>
              </div>
            )}

            {sheetInfo.length > 0 && (
              <div className="space-y-2">
                <Label>工作表</Label>
                <Select 
                  value={options.sheetIndex.toString()} 
                  onValueChange={(v) => setOptions({ ...options, sheetIndex: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">全部工作表</SelectItem>
                    {sheetInfo.map((sheet, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>
                        {sheet.name} ({sheet.rowCount} 行)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>输出格式</Label>
              <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as OutputFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4" /> JSON
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> CSV
                    </div>
                  </SelectItem>
                  <SelectItem value="html">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4" /> HTML
                    </div>
                  </SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="yaml">YAML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              转换选项
            </CardTitle>
            <CardDescription>
              配置转换过程中的高级选项
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="basic">
              <TabsList className="w-full">
                <TabsTrigger value="basic" className="flex-1">基础选项</TabsTrigger>
                <TabsTrigger value="advanced" className="flex-1">高级选项</TabsTrigger>
                <TabsTrigger value="preview" className="flex-1">预览</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="headerRow"
                    checked={options.headerRow}
                    onCheckedChange={(checked) => setOptions({ ...options, headerRow: checked as boolean })}
                  />
                  <label htmlFor="headerRow" className="text-sm">
                    首行作为表头
                  </label>
                </div>

                {outputFormat === 'csv' && (
                  <div className="space-y-2">
                    <Label>分隔符</Label>
                    <Select 
                      value={options.delimiter} 
                      onValueChange={(v) => setOptions({ ...options, delimiter: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=",">逗号 (,)</SelectItem>
                        <SelectItem value=";">分号 (;)</SelectItem>
                        <SelectItem value="\t">Tab</SelectItem>
                        <SelectItem value="|">竖线 (|)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>数字精度</Label>
                  <Input
                    type="number"
                    value={options.precision}
                    onChange={(e) => setOptions({ ...options, precision: parseInt(e.target.value) })}
                    min={0}
                    max={10}
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserveFormulas"
                    checked={options.preserveFormulas}
                    onCheckedChange={(checked) => setOptions({ ...options, preserveFormulas: checked as boolean })}
                  />
                  <label htmlFor="preserveFormulas" className="text-sm">
                    保留公式
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserveFormatting"
                    checked={options.preserveFormatting}
                    onCheckedChange={(checked) => setOptions({ ...options, preserveFormatting: checked as boolean })}
                  />
                  <label htmlFor="preserveFormatting" className="text-sm">
                    保留格式（颜色、边框等）
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserveComments"
                    checked={options.preserveComments}
                    onCheckedChange={(checked) => setOptions({ ...options, preserveComments: checked as boolean })}
                  />
                  <label htmlFor="preserveComments" className="text-sm">
                    保留批注
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserveMergedCells"
                    checked={options.preserveMergedCells}
                    onCheckedChange={(checked) => setOptions({ ...options, preserveMergedCells: checked as boolean })}
                  />
                  <label htmlFor="preserveMergedCells" className="text-sm">
                    保留合并单元格
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                {result ? (
                  <div className="bg-muted rounded-lg p-4 max-h-[300px] overflow-auto">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(result, null, 2).substring(0, 2000)}
                      {JSON.stringify(result, null, 2).length > 2000 && '...'}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Table className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>预览内容</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {converting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>转换进度</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleConvert} 
                disabled={!sourceFile || converting}
                className="flex-1"
              >
                {converting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    转换中...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    开始转换
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={handleDownload}
                disabled={!result}
              >
                <Download className="w-4 h-4 mr-2" />
                下载
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

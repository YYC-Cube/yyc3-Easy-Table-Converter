/**
 * @file SQL生成器工具页面
 * @description 将数据转换为 SQL 语句，支持多种 SQL 操作
 * @module app/converters/sql-generator/page
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, RefreshCw, Database, Table, Code, FileJson } from 'lucide-react';

type SqlOperation = 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT' | 'CREATE';

interface TableData {
  tableName: string;
  columns: string[];
  rows: any[];
}

export default function SqlGeneratorPage() {
  const { toast } = useToast();
  const [inputData, setInputData] = useState('');
  const [tableName, setTableName] = useState('users');
  const [operation, setOperation] = useState<SqlOperation>('INSERT');
  const [outputSql, setOutputSql] = useState('');
  const [generatedData, setGeneratedData] = useState<TableData | null>(null);

  const parseInputData = (input: string): TableData | null => {
    try {
      const data = JSON.parse(input);
      const tableData: TableData = {
        tableName: tableName,
        columns: [],
        rows: []
      };

      if (Array.isArray(data) && data.length > 0) {
        tableData.columns = Object.keys(data[0]);
        tableData.rows = data;
      } else if (typeof data === 'object' && data !== null) {
        tableData.columns = Object.keys(data);
        tableData.rows = [data];
      }

      return tableData.columns.length > 0 ? tableData : null;
    } catch {
      const lines = input.trim().split('\n');
      if (lines.length < 2) return null;

      const headers = lines[0].split(/[,;\t]/).map(h => h.trim().replace(/^["']|["']$/g, ''));
      const rows = lines.slice(1).map(line => {
        const values = line.split(/[,;\t]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || '';
        });
        return row;
      });

      return { tableName, columns: headers, rows };
    }
  };

  const generateSql = () => {
    const data = parseInputData(inputData);
    if (!data || data.rows.length === 0) {
      toast({
        title: '解析失败',
        description: '请输入有效的数据格式',
        variant: 'destructive',
      });
      return;
    }

    setGeneratedData(data);
    let sql = '';

    switch (operation) {
      case 'INSERT':
        sql = generateInsert(data);
        break;
      case 'UPDATE':
        sql = generateUpdate(data);
        break;
      case 'DELETE':
        sql = generateDelete(data);
        break;
      case 'SELECT':
        sql = generateSelect(data);
        break;
      case 'CREATE':
        sql = generateCreate(data);
        break;
    }

    setOutputSql(sql);
  };

  const generateInsert = (data: TableData): string => {
    const columns = data.columns.map(c => `\`${c}\``).join(', ');
    const values = data.rows.map(row => {
      const vals = data.columns.map(c => {
        const val = row[c];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return val;
        if (typeof val === 'boolean') return val ? '1' : '0';
        return `'${String(val).replace(/'/g, "''")}'`;
      }).join(', ');
      return `(${vals})`;
    }).join(',\n  ');

    return `INSERT INTO \`${data.tableName}\` (${columns})\nVALUES\n  ${values};`;
  };

  const generateUpdate = (data: TableData): string => {
    if (data.rows.length === 0) return '';

    const firstRow = data.rows[0];
    const setClause = data.columns
      .filter(c => c !== 'id')
      .map(c => {
        const val = firstRow[c];
        if (val === null || val === undefined) return `${c} = NULL`;
        if (typeof val === 'number') return `${c} = ${val}`;
        if (typeof val === 'boolean') return `${c} = ${val ? 1 : 0}`;
        return `${c} = '${String(val).replace(/'/g, "''")}'`;
      })
      .join(',\n    ');

    const whereClause = data.columns.includes('id') && firstRow.id
      ? `WHERE \`id\` = ${firstRow.id}`
      : `-- WHERE 条件`;

    return `UPDATE \`${data.tableName}\`\nSET ${setClause}\n${whereClause};`;
  };

  const generateDelete = (data: TableData): string => {
    if (data.rows.length === 0) return '';

    const hasId = data.columns.includes('id') && data.rows.some(r => r.id);

    if (hasId) {
      const ids = data.rows.map(r => r.id).filter(Boolean).join(', ');
      return `DELETE FROM \`${data.tableName}\`\nWHERE \`id\` IN (${ids});`;
    }

    return `DELETE FROM \`${data.tableName}\`\n-- WHERE 条件;`;
  };

  const generateSelect = (data: TableData): string => {
    const columns = data.columns.map(c => `\`${c}\``).join(', ');
    const conditions = data.rows.slice(0, 3).map(row => {
      const conds = data.columns
        .filter(c => row[c] !== null && row[c] !== undefined && row[c] !== '')
        .slice(0, 2)
        .map(c => {
          const val = row[c];
          if (typeof val === 'number') return `${c} = ${val}`;
          return `${c} LIKE '%${String(val).replace(/'/g, "''")}%'`;
        })
        .join(' AND ');
      return conds ? `(${conds})` : null;
    }).filter(Boolean).join('\n  OR ');

    return `SELECT ${columns}\nFROM \`${data.tableName}\`\n${conditions ? `WHERE ${conditions}` : '-- WHERE 条件'};`;
  };

  const generateCreate = (data: TableData): string => {
    const columnDefs = data.columns.map(col => {
      const sampleVal = data.rows[0]?.[col];
      let type = 'VARCHAR(255)';
      
      if (typeof sampleVal === 'number') {
        type = Number.isInteger(sampleVal) ? 'INT' : 'DECIMAL(10,2)';
      } else if (typeof sampleVal === 'boolean') {
        type = 'TINYINT(1)';
      }

      return `  \`${col}\` ${type} DEFAULT NULL`;
    }).join(',\n');

    const primaryKey = data.columns.includes('id') ? ',\n  PRIMARY KEY (`id`)' : '';

    return `CREATE TABLE \`${data.tableName}\` (\n${columnDefs}${primaryKey}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputSql);
    toast({
      title: '复制成功',
      description: 'SQL 语句已复制到剪贴板',
    });
  };

  const handleDownload = () => {
    const blob = new Blob([outputSql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_${operation.toLowerCase()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadSampleData = () => {
    const sample = [
      { id: 1, name: '张三', email: 'zhangsan@example.com', age: 28, status: true },
      { id: 2, name: '李四', email: 'lisi@example.com', age: 32, status: false },
      { id: 3, name: '王五', email: 'wangwu@example.com', age: 25, status: true }
    ];
    setInputData(JSON.stringify(sample, null, 2));
    setTableName('users');
    setOperation('INSERT');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="w-8 h-8" />
          SQL 生成器
        </h1>
        <p className="text-muted-foreground">
          将 JSON、CSV 或表格数据转换为 SQL 语句，支持 INSERT、UPDATE、DELETE、SELECT、CREATE TABLE
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5" />
              输入数据
            </CardTitle>
            <CardDescription>
              支持 JSON 数组、CSV 或 Tab 分隔的数据
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>表名</Label>
                <Input
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="输入表名"
                />
              </div>
              <div className="flex-1">
                <Label>操作类型</Label>
                <Select value={operation} onValueChange={(v) => setOperation(v as SqlOperation)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSERT">INSERT</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="SELECT">SELECT</SelectItem>
                    <SelectItem value="CREATE">CREATE TABLE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>数据内容</Label>
              <Textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder='[{"name": "张三", "age": 28}, {"name": "李四", "age": 32}]'
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={generateSql} className="flex-1">
                <Code className="w-4 h-4 mr-2" />
                生成 SQL
              </Button>
              <Button variant="outline" onClick={loadSampleData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                示例
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="w-5 h-5" />
              生成结果
            </CardTitle>
            <CardDescription>
              {generatedData ? `表名: ${generatedData.tableName}, ${generatedData.rows.length} 条记录` : '等待生成...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="sql">
              <TabsList className="w-full">
                <TabsTrigger value="sql" className="flex-1">SQL</TabsTrigger>
                <TabsTrigger value="preview" className="flex-1">数据预览</TabsTrigger>
              </TabsList>

              <TabsContent value="sql">
                <Textarea
                  value={outputSql}
                  readOnly
                  className="min-h-[250px] font-mono text-sm bg-muted"
                />
              </TabsContent>

              <TabsContent value="preview">
                {generatedData && (
                  <div className="overflow-auto max-h-[250px]">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          {generatedData.columns.map(col => (
                            <th key={col} className="border px-2 py-1 text-left">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {generatedData.rows.slice(0, 5).map((row, i) => (
                          <tr key={i}>
                            {generatedData.columns.map(col => (
                              <td key={col} className="border px-2 py-1">{String(row[col] ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopy} disabled={!outputSql}>
                <Copy className="w-4 h-4 mr-2" />
                复制
              </Button>
              <Button variant="outline" onClick={handleDownload} disabled={!outputSql}>
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

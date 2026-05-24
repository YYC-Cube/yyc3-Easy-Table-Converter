#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

async function addBackButtons() {
  const pages = await glob('app/converters/*/page.tsx', { cwd: process.cwd() });
  
  let fixedCount = 0;
  let skippedCount = 0;
  
  for (const pagePath of pages) {
    try {
      let content = readFileSync(pagePath, 'utf-8');
      
      const hasArrowLeft = content.includes('ArrowLeft');
      const hasLink = content.includes('next/link');
      const hasBackButton = content.includes('返回首页') || content.includes('返回');
      
      if (!hasArrowLeft || !hasLink || !hasBackButton) {
        console.log(`🔧 正在修复: ${pagePath}`);
        
        let modified = false;
        
        if (!hasArrowLeft || !hasLink) {
          if (content.includes('from "lucide-react"')) {
            content = content.replace(
              /from "lucide-react"/,
              'from "lucide-react";\nimport Link from "next/link"'
            );
            if (!hasArrowLeft) {
              content = content.replace(/import \{(.*?)\} from "lucide-react"/, (match, icons) => {
                if (icons.includes('ArrowLeft')) return match;
                return `import { ${icons.trim()}, ArrowLeft } from "lucide-react"`;
              });
            }
            modified = true;
          } else if (content.includes("from 'lucide-react'")) {
            content = content.replace(
              /from 'lucide-react'/,
              "from 'lucide-react';\nimport Link from 'next/link'"
            );
            if (!hasArrowLeft) {
              content = content.replace(/import \{(.*?)\} from 'lucide-react'/, (match, icons) => {
                if (icons.includes('ArrowLeft')) return match;
                return `import { ${icons.trim()}, ArrowLeft } from 'lucide-react'`;
              });
            }
            modified = true;
          }
        }
        
        if (!hasBackButton) {
          const returnPattern = /return \(\s*<div className="container mx-auto[^>]*>\s*<div className="max-w-[^>]*>/;
          const match = content.match(returnPattern);
          
          if (match) {
            const insertionPoint = match.index! + match[0].length;
            const backButtonCode = `
        <Link href="/">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>`;
            content = content.slice(0, insertionPoint) + backButtonCode + content.slice(insertionPoint);
            modified = true;
          }
        }
        
        if (modified) {
          writeFileSync(pagePath, content, 'utf-8');
          fixedCount++;
          console.log(`✅ 已修复: ${pagePath}`);
        }
      } else {
        skippedCount++;
      }
    } catch (error) {
      console.log(`❌ 修复失败: ${pagePath}`, error);
    }
  }
  
  console.log(`\n修复完成！`);
  console.log(`修复页面数: ${fixedCount}`);
  console.log(`跳过页面数: ${skippedCount}`);
}

addBackButtons().catch(console.error);

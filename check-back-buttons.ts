#!/usr/bin/env node
import { readFileSync } from 'fs';
import { glob } from 'glob';

async function checkBackButtons() {
  const pages = await glob('app/converters/*/page.tsx', { cwd: process.cwd() });
  
  const pagesWithoutBackButton: string[] = [];
  
  for (const pagePath of pages) {
    try {
      const content = readFileSync(pagePath, 'utf-8');
      const hasArrowLeft = content.includes('ArrowLeft');
      const hasLink = content.includes('next/link');
      const hasBackButton = content.includes('返回首页') || content.includes('返回');
      
      if (!hasArrowLeft || !hasLink || !hasBackButton) {
        pagesWithoutBackButton.push(pagePath);
        console.log(`❌ ${pagePath} - 缺少返回按钮`);
      } else {
        console.log(`✅ ${pagePath} - 有返回按钮`);
      }
    } catch (error) {
      console.log(`❌ ${pagePath} - 读取失败`);
    }
  }
  
  console.log(`\n总共有 ${pages.length} 个工具页面`);
  console.log(`缺少返回按钮的页面: ${pagesWithoutBackButton.length} 个`);
  
  if (pagesWithoutBackButton.length > 0) {
    console.log('\n需要修复的页面:');
    pagesWithoutBackButton.forEach(page => console.log(`- ${page}`));
  }
}

checkBackButtons().catch(console.error);

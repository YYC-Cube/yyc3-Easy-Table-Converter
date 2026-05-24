/**
 * @file 头像服务
 * @description 处理用户头像的上传、裁剪、生成多规格图片
 * @module lib/services/avatarService
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const AVATAR_SIZES = {
  favicon: 16,
  tiny: 32,
  small: 64,
  medium: 128,
  large: 256,
  xlarge: 512,
};

const AVATAR_DIR = process.env.AVATAR_DIR || path.join(process.cwd(), 'public', 'avatars');
const DEFAULT_AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

class AvatarService {
  private avatarDir: string;

  constructor() {
    this.avatarDir = AVATAR_DIR;
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.avatarDir)) {
      fs.mkdirSync(this.avatarDir, { recursive: true });
    }
  }

  private getRandomColor(): string {
    return DEFAULT_AVATAR_COLORS[Math.floor(Math.random() * DEFAULT_AVATAR_COLORS.length)];
  }

  private getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  async processAvatar(
    file: Buffer,
    userId: number,
    options: {
      format?: 'png' | 'jpg' | 'webp';
      circular?: boolean;
    } = {}
  ): Promise<{ urls: Record<string, string>; original: string }> {
    const { format = 'png', circular = true } = options;
    const timestamp = Date.now();
    const hash = crypto.randomBytes(8).toString('hex');
    const userDir = path.join(this.avatarDir, userId.toString());
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const urls: Record<string, string> = {};
    const baseFilename = `${timestamp}-${hash}`;

    let processedImage = sharp(file);
    
    if (circular) {
      const metadata = await processedImage.metadata();
      const size = Math.min(metadata.width || 512, metadata.height || 512);
      const pipeline = processedImage.resize(size, size).composite([{
        input: Buffer.from(
          `<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
        ),
        blend: 'dest-in'
      }]);
      processedImage = pipeline;
    }

    for (const [sizeName, size] of Object.entries(AVATAR_SIZES)) {
      const filename = `${baseFilename}-${sizeName}.${format}`;
      const filepath = path.join(userDir, filename);
      
      await processedImage
        .clone()
        .resize(size, size)
        .toFormat(format, { quality: 90 })
        .toFile(filepath);
      
      urls[sizeName] = `/avatars/${userId}/${filename}`;
    }

    const originalFilename = `${baseFilename}-original.${format}`;
    const originalPath = path.join(userDir, originalFilename);
    await processedImage.clone().resize(512, 512).toFormat(format, { quality: 95 }).toFile(originalPath);
    const original = `/avatars/${userId}/${originalFilename}`;

    return { urls, original };
  }

  async generateInitialsAvatar(
    name: string,
    userId: number,
    options: { backgroundColor?: string; textColor?: string } = {}
  ): Promise<{ urls: Record<string, string> }> {
    const { backgroundColor, textColor = '#ffffff' } = options;
    const bgColor = backgroundColor || this.getRandomColor();
    const initials = this.getInitials(name);
    const timestamp = Date.now();
    const hash = crypto.randomBytes(8).toString('hex');
    const userDir = path.join(this.avatarDir, userId.toString());
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const urls: Record<string, string> = {};

    for (const [sizeName, size] of Object.entries(AVATAR_SIZES)) {
      const filename = `${timestamp}-${hash}-${sizeName}.png`;
      const filepath = path.join(userDir, filename);
      
      const svg = this.generateInitialsSVG(initials, size, bgColor, textColor);
      
      await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(filepath);
      
      urls[sizeName] = `/avatars/${userId}/${filename}`;
    }

    return { urls };
  }

  private generateInitialsSVG(
    initials: string,
    size: number,
    bgColor: string,
    textColor: string
  ): string {
    const fontSize = Math.floor(size * 0.4);
    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="${bgColor}" rx="${size/2}" ry="${size/2}"/>
        <text 
          x="50%" 
          y="50%" 
          font-family="Arial, sans-serif" 
          font-size="${fontSize}" 
          font-weight="bold"
          fill="${textColor}"
          text-anchor="middle" 
          dominant-baseline="central"
        >
          ${initials}
        </text>
      </svg>
    `;
  }

  async deleteAvatar(userId: number): Promise<boolean> {
    const userDir = path.join(this.avatarDir, userId.toString());
    
    if (fs.existsSync(userDir)) {
      const files = fs.readdirSync(userDir);
      for (const file of files) {
        fs.unlinkSync(path.join(userDir, file));
      }
      fs.rmdirSync(userDir);
    }
    
    return true;
  }

  getAvatarUrl(userId: number, size: keyof typeof AVATAR_SIZES = 'medium'): string {
    return `/avatars/${userId}/default-${size}.png`;
  }
}

export const avatarService = new AvatarService();
export default avatarService;

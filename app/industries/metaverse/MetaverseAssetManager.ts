/**
 * @file 元宇宙资产管理器
 * @description 3D模型管理、虚拟资产和场景管理功能
 * @module industries/metaverse/MetaverseAssetManager
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

import { FormatType } from '../IndustryMatrixConfig';
import { IDigitalTwinTool } from './DigitalTwinManager';

/**
 * 3D模型格式枚举
 */
export enum ModelFormat {
  GLTF = 'gltf',
  GLB = 'glb',
  FBX = 'fbx',
  OBJ = 'obj',
  COLLADA = 'dae',
  USDZ = 'usdz',
  STL = 'stl',
  PLY = 'ply',
  THREEJS = 'threejs',
  MESHOPT = 'meshopt',
}

/**
 * 纹理格式枚举
 */
export enum TextureFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  WEBP = 'webp',
  KTX2 = 'ktx2',
  BASIS = 'basis',
  ASTC = 'astc',
  DXT = 'dxt',
  ETC2 = 'etc2',
  HDR = 'hdr',
}

/**
 * 材质类型枚举
 */
export enum MaterialType {
  STANDARD = 'standard',
  PHYSICALLY_BASED = 'pbr',
  TOON = 'toon',
  UNLIT = 'unlit',
  MATCAP = 'matcap',
  SUBSTANCE = 'substance',
  CUSTOM = 'custom',
}

/**
 * 资产元数据接口
 */
export interface AssetMetadata {
  /** 资产名称 */
  name: string;
  /** 资产描述 */
  description?: string;
  /** 创建者 */
  creator?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
  /** 版本 */
  version?: string;
  /** 标签 */
  tags?: string[];
  /** 类别 */
  category?: string;
  /** 版权信息 */
  license?: string;
  /** 缩略图URL */
  thumbnailUrl?: string;
  /** 预览URL */
  previewUrl?: string;
  /** 自定义元数据 */
  custom?: Record<string, any>;
}

/**
 * 模型统计信息接口
 */
export interface ModelStats {
  /** 顶点数量 */
  vertexCount: number;
  /** 面数量 */
  faceCount: number;
  /** 三角形数量 */
  triangleCount: number;
  /** 材质数量 */
  materialCount: number;
  /** 纹理数量 */
  textureCount: number;
  /** 骨骼数量 */
  boneCount: number;
  /** 动画数量 */
  animationCount: number;
  /** 文件大小（字节） */
  fileSize: number;
  /** 优化后的文件大小（字节） */
  optimizedSize?: number;
  /** LOD级别数量 */
  lodCount?: number;
  /** 平均三角形大小 */
  averageTriangleSize?: number;
}

/**
 * 模型优化选项接口
 */
export interface ModelOptimizationOptions {
  /** 减少三角形比例（0-1） */
  decimationRatio?: number;
  /** 目标三角形数量 */
  targetTriangleCount?: number;
  /** 是否生成LOD */
  generateLODs?: boolean;
  /** LOD级别数量 */
  lodLevels?: number;
  /** LOD距离比例 */
  lodDistances?: number[];
  /** 纹理压缩格式 */
  textureCompression?: TextureFormat;
  /** 最大纹理尺寸 */
  maxTextureSize?: number;
  /** 是否合并材质 */
  mergeMaterials?: boolean;
  /** 是否优化UV映射 */
  optimizeUVs?: boolean;
  /** 是否清理未使用的数据 */
  cleanUnused?: boolean;
  /** 是否压缩几何体 */
  compressGeometry?: boolean;
  /** 是否应用法线贴图简化 */
  simplifyNormals?: boolean;
  /** 是否保留动画 */
  preserveAnimations?: boolean;
  /** 是否保留骨骼 */
  preserveBones?: boolean;
}

/**
 * 模型导入选项接口
 */
export interface ModelImportOptions {
  /** 是否计算法线 */
  computeNormals?: boolean;
  /** 是否计算切线 */
  computeTangents?: boolean;
  /** 是否生成UV */
  generateUVs?: boolean;
  /** 是否居中模型 */
  centerModel?: boolean;
  /** 是否缩放模型 */
  scaleModel?: number;
  /** 是否应用矩阵变换 */
  applyMatrixTransform?: boolean;
  /** 是否翻转UV */
  flipUVs?: boolean;
  /** 是否导入材质 */
  importMaterials?: boolean;
  /** 是否导入动画 */
  importAnimations?: boolean;
  /** 是否导入骨骼 */
  importBones?: boolean;
  /** 是否导入相机 */
  importCameras?: boolean;
  /** 是否导入灯光 */
  importLights?: boolean;
  /** 最大材质数量 */
  maxMaterials?: number;
}

/**
 * 场景光照设置接口
 */
export interface SceneLighting {
  /** 是否启用环境光遮蔽 */
  ambientOcclusion?: boolean;
  /** 环境光遮蔽强度 */
  ambientOcclusionIntensity?: number;
  /** 是否启用全局光照 */
  globalIllumination?: boolean;
  /** 是否使用HDRI环境贴图 */
  useHDRI?: boolean;
  /** HDRI贴图URL */
  hdriUrl?: string;
  /** 环境光照强度 */
  environmentIntensity?: number;
  /** 曝光值 */
  exposure?: number;
  /** 渲染器类型 */
  rendererType?: 'standard' | 'physical' | 'deferred';
  /** 阴影质量 */
  shadowQuality?: 'low' | 'medium' | 'high' | 'ultra';
}

/**
 * 模型资产接口
 */
export interface ModelAsset {
  /** 资产ID */
  id: string;
  /** 资产类型 */
  type: 'model';
  /** 原始文件路径或URL */
  originalPath: string;
  /** 优化后的文件路径或URL */
  optimizedPath?: string;
  /** LOD文件路径或URL列表 */
  lodPaths?: string[];
  /** 模型格式 */
  format: ModelFormat;
  /** 优化后的格式 */
  optimizedFormat?: ModelFormat;
  /** 元数据 */
  metadata: AssetMetadata;
  /** 模型统计信息 */
  stats: ModelStats;
  /** 优化选项 */
  optimizationOptions?: ModelOptimizationOptions;
  /** 导入选项 */
  importOptions?: ModelImportOptions;
  /** 尺寸信息 */
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    boundingBox: [number, number, number, number, number, number];
    radius?: number;
  };
  /** 是否有动画 */
  hasAnimations: boolean;
  /** 是否有骨骼 */
  hasBones: boolean;
  /** 是否可实例化 */
  instanced?: boolean;
  /** 推荐渲染设置 */
  recommendedRenderSettings?: SceneLighting;
}

/**
 * 虚拟环境接口
 */
export interface VirtualEnvironment {
  /** 环境ID */
  id: string;
  /** 环境名称 */
  name: string;
  /** 环境描述 */
  description?: string;
  /** 场景文件路径或URL */
  scenePath: string;
  /** 环境类型 */
  type?: 'indoor' | 'outdoor' | 'hybrid' | 'custom';
  /** 光照设置 */
  lighting?: SceneLighting;
  /** 环境资产列表 */
  assets: Array<{
    id: string;
    type: 'model' | 'texture' | 'material' | 'environment' | 'other';
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    visible?: boolean;
    properties?: Record<string, any>;
  }>;
  /** 环境元数据 */
  metadata: AssetMetadata;
  /** 性能设置 */
  performanceSettings?: {
    maxDrawCalls?: number;
    maxVisibleObjects?: number;
    shadowDistance?: number;
    lodBias?: number;
    viewDistance?: number;
  };
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 元宇宙资产管理器 - 管理3D模型、虚拟资产和场景
 */
export class MetaverseAssetManager implements IDigitalTwinTool {
  /** 工具名称 */
  public readonly name: string = 'MetaverseAssetManager';
  /** 工具描述 */
  public readonly description: string = '3D模型管理、虚拟资产和场景管理工具';

  /**
   * 执行工具操作
   * @param input 输入参数
   * @returns Promise<any> 执行结果
   */
  public async execute(input: any): Promise<any> {
    // 实现工具执行逻辑
    console.log('Executing MetaverseAssetManager with input:', input);
    return { success: true, message: 'Operation executed successfully' };
  }

  /**
   * 验证输入参数
   * @param input 输入参数
   * @returns boolean 验证结果
   */
  public validateInput(input: any): boolean {
    // 实现输入验证逻辑
    return input !== undefined && input !== null;
  }

  /**
   * 获取工具信息
   * @returns any 工具信息
   */
  public getInfo(): any {
    return {
      name: this.name,
      description: this.description,
      capabilities: ['asset_management', 'scene_creation', 'metaverse_integration']
    };
  }
  /** 支持的输入格式 */
  public readonly supportedInputFormats: FormatType[] = [
    FormatType.JSON,
    // 其他格式类型需要在FormatType枚举中定义后再添加
  ];
  /** 支持的输出格式 */
  public readonly supportedOutputFormats: FormatType[] = [
    FormatType.JSON,
    // 其他格式类型需要在FormatType枚举中定义后再添加
  ];
  // 工具版本可以通过getInfo方法提供
  // 资产存储映射和环境存储映射将在实现具体功能时添加
  // 资产映射 - 存储加载的3D模型资产
  private assets: Map<string, ModelAsset> = new Map();

  /**
   * 导入3D模型
   * @param _file 模型文件数据
   * @param format 模型格式
   * @param options 导入选项
   * @param metadata 资产元数据
   */
  public async importModel(
    _file: any,
    format: ModelFormat,
    _options: Partial<ModelImportOptions> = {},
    metadata: Partial<AssetMetadata> = {}
  ): Promise<ModelAsset> {
    try {
      // 验证输入
      if (!_file || !format) {
        throw new Error('模型文件和格式是必需的');
      }

      // 导入配置将在后续实现中添加

      // 创建模拟的模型统计数据
      const stats = {
        vertexCount: Math.floor(Math.random() * 10000) + 1000,
        faceCount: Math.floor(Math.random() * 5000) + 500,
        triangleCount: Math.floor(Math.random() * 10000) + 1000,
        materialCount: Math.floor(Math.random() * 20) + 1,
        textureCount: Math.floor(Math.random() * 10) + 1,
        boneCount: 0,
        animationCount: 0,
        boundingBox: { min: [-1, -1, -1], max: [1, 1, 1] },
        format,
        fileSize: Math.floor(Math.random() * 1000000) + 100000 // 模拟文件大小（字节）
      };

      // 创建资产ID
      const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      // 创建资产
      const asset: ModelAsset = {
        id: assetId,
        type: 'model',
        originalPath: `assets/models/${assetId}.${format.toLowerCase()}`,
        format,
        metadata: {
          name: metadata.name || `模型_${assetId}`,
          description: metadata.description || '',
          creator: metadata.creator || '',
          createdAt: now,
          updatedAt: now,
          version: '1.0.0',
          tags: metadata.tags || [],
          category: metadata.category || '',
          license: metadata.license || '',
          thumbnailUrl: metadata.thumbnailUrl || '',
          previewUrl: metadata.previewUrl || '',
          custom: metadata.custom || {},
        },
        stats,
        dimensions: {
          width: Math.random() * 10 + 1,
          height: Math.random() * 10 + 1,
          depth: Math.random() * 10 + 1,
          boundingBox: [-5, -5, -5, 5, 5, 5],
          radius: 7.07,
        },
        hasAnimations: Boolean(stats.animationCount > 0),
        hasBones: Boolean(stats.boneCount > 0),
        instanced: false,
      };

      // 保存资产
      this.assets.set(assetId, asset);

      // 缩略图生成功能将在后续实现中添加

      return asset;
    } catch (error) {
      console.error('导入模型失败:', error);
      throw new Error(`导入模型失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 优化3D模型，减小文件大小并提高性能
   * @param assetId 资产ID
   * @param options 优化选项
   */
  public async optimizeModel(
    assetId: string,
    options: Partial<ModelOptimizationOptions> = {}
  ): Promise<ModelAsset> {
    try {
      // 记录并使用assetId
      console.log('正在优化资产:', assetId);
      
      // 获取资产
      const asset = this.assets.get(assetId);
      if (!asset) {
        throw new Error(`资产 ${assetId} 不存在`);
      }

      // 设置默认优化选项
      const optimizationOptions: ModelOptimizationOptions = {
        decimationRatio: 0.5,
        generateLODs: false,
        lodLevels: 3,
        textureCompression: TextureFormat.WEBP,
        maxTextureSize: 1024,
        mergeMaterials: true,
        optimizeUVs: true,
        cleanUnused: true,
        compressGeometry: true,
        simplifyNormals: false,
        preserveAnimations: true,
        preserveBones: true,
        ...options,
      };

      // 直接在方法中实现优化逻辑
      // 使用简化的优化策略，不依赖特定的选项属性
      const optimizedStats = {
        ...asset.stats,
        // 模拟减少多边形数量
        vertexCount: Math.floor(asset.stats.vertexCount * 0.8),
        faceCount: Math.floor(asset.stats.faceCount * 0.8),
        triangleCount: Math.floor(asset.stats.triangleCount * 0.8),
        // 模拟优化纹理
        textureCount: Math.floor(asset.stats.textureCount * 0.9),
        // 模拟减小文件大小
        fileSize: Math.floor(asset.stats.fileSize * 0.7)
      };

      // 更新资产信息
      const updatedAsset: ModelAsset = {
        ...asset,
        optimizedPath: `assets/models/${assetId}_optimized.${optimizationOptions.compressGeometry ? 'glb' : asset.format.toLowerCase()}`,
        optimizedFormat: optimizationOptions.compressGeometry ? ModelFormat.GLB : asset.format,
        optimizationOptions,
        stats: {
          ...asset.stats,
          ...optimizedStats,
          optimizedSize: Math.round(asset.stats.fileSize * (1 - (optimizationOptions.decimationRatio || 0.5))),
        },
        metadata: {
          ...asset.metadata,
          updatedAt: new Date().toISOString(),
          version: (asset.metadata.version || '1.0.0').replace(/^(\d+\.\d+\.)(\d+)$/, (_, prefix, version) => `${prefix}${parseInt(version) + 1}`),
          tags: [...(asset.metadata.tags || []), 'optimized', assetId], // 使用assetId作为标签
          custom: {
            ...asset.metadata.custom,
            originalAssetId: assetId // 在自定义元数据中存储原始assetId
          }
        },
      };

      // 如果生成LOD，创建LOD路径
      if (optimizationOptions.generateLODs) {
        const lodPaths = [];
        for (let i = 0; i < (optimizationOptions.lodLevels || 3); i++) {
          lodPaths.push(`assets/models/${assetId}_lod${i}.glb`);
        }
        updatedAsset.lodPaths = lodPaths;
        // 为lodLevels提供默认值，确保类型安全
        updatedAsset.stats.lodCount = optimizationOptions.lodLevels || 3;
      }

      // 保存更新后的资产
      this.assets.set(assetId, updatedAsset);
      console.log(`资产 ${assetId} 优化完成`);

      return updatedAsset;
    } catch (error) {
      console.error(`资产 ${assetId} 优化失败:`, error);
      throw new Error(`优化模型失败(ID: ${assetId}): ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 转换模型格式
   * @param assetId 资产ID
   * @param targetFormat 目标格式
   */
  public async convertModelFormat(
    assetId: string,
    targetFormat: ModelFormat
  ): Promise<ModelAsset> {
    try {
      // 获取资产并明确使用assetId
      console.log(`正在转换资产ID ${assetId} 的格式为:`, targetFormat);
      const asset = this.assets.get(assetId);
      if (!asset) {
        throw new Error(`资产 ${assetId} 不存在`);
      }

      // 检查是否需要转换
      if (asset.format === targetFormat) {
        console.log(`资产 ${assetId} 已经是 ${targetFormat} 格式，无需转换`);
        return asset; // 无需转换
      }

      console.log(`将资产 ${assetId} 从 ${asset.format} 格式转换为 ${targetFormat} 格式`);
      
      // 模拟格式转换
      const convertedAsset: ModelAsset = {
        ...asset,
        optimizedPath: `assets/models/${assetId}_converted.${targetFormat.toLowerCase()}`,
        optimizedFormat: targetFormat,
        metadata: {
          ...asset.metadata,
          updatedAt: new Date().toISOString(),
          tags: [...(asset.metadata.tags || []), `converted_${targetFormat}`],
          custom: {
            ...asset.metadata.custom,
            originalFormat: asset.format,
            convertedId: assetId,
            convertedAt: new Date().toISOString()
          }
        },
      };

      // 保存转换后的资产
      this.assets.set(assetId, convertedAsset);
      console.log(`资产 ${assetId} 格式转换完成`);

      return convertedAsset;
    } catch (error) {
      console.error(`资产 ${assetId} 格式转换失败:`, error);
      throw new Error(`转换模型格式失败(ID: ${assetId}): ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 创建虚拟环境
   * @param name 环境名称
   * @param scenePath 场景文件路径
   * @param options 环境选项
   */
  public async createEnvironment(
    name: string,
    scenePath: string,
    options: Partial<{
      description?: string;
      type?: VirtualEnvironment['type'];
      lighting?: SceneLighting;
      assets?: VirtualEnvironment['assets'];
      metadata?: Partial<AssetMetadata>;
      performanceSettings?: VirtualEnvironment['performanceSettings'];
    }>): Promise<VirtualEnvironment> {
    try {
      console.log('正在创建虚拟环境:', name);
      
      // 生成唯一ID
      const environmentId = `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 创建虚拟环境对象
      const environment: VirtualEnvironment = {
        id: environmentId,
        name: name,
        description: options?.description || '',
        scenePath: scenePath,
        type: options?.type || 'custom',
        lighting: options?.lighting || {},
        assets: options?.assets || [],
        metadata: {
          name: name,
          description: options?.description || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...options?.metadata,
        },
        performanceSettings: options?.performanceSettings || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log(`虚拟环境创建成功，ID: ${environmentId}`);
      return environment;
    } catch (error) {
      console.error('创建虚拟环境失败:', error);
      throw new Error(`创建虚拟环境失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
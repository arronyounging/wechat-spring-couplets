'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { 
  ImageIcon, 
  Upload, 
  Download,
  Sparkles, 
  Bot, 
  Layout, 
  ListFilter,
  Camera,
  Loader2,
  X,
  Check,
  Crop as LucideCrop,
  ScrollText,
  Wand2,
  ChevronDown,
  Brush
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

const NewYearAvatarEditor = () => {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCouplet, setSelectedCouplet] = useState<string | null>(null);
  const [compositeImage, setCompositeImage] = useState<string | null>(null);
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCouplets, setGeneratedCouplets] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<'ai' | 'template'>('template');
  const [isLoading, setIsLoading] = useState(false);
  const [tempImage, setTempImage] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0
  });
  const [showCropModal, setShowCropModal] = useState(false);
  const [isDefaultCrop, setIsDefaultCrop] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 春联分类
  const coupletCategories = [
    { id: 'all', name: '全部' },
    { id: 'traditional', name: '传统春联' },
    { id: 'programmer', name: '程序员' },
    { id: 'office', name: '职场人' },
    { id: 'student', name: '学生党' },
    { id: 'gamer', name: '游戏控' },
    { id: 'foodie', name: '吃货' },
    { id: 'acg', name: '二次元' },
    { id: 'trendy', name: '潮流党' },
    { id: 'literary', name: '文艺范' },
  ];

  // 预设春联模板
  const sampleCouplets: Record<string, string[]> = {
    all: [],  // 将包含所有分类的春联
    traditional: [
      '春回大地百花香，福满人间万事兴',
      '喜居宝地财源广，福照家门瑞气多',
      '春风送暖入屠苏，岁月留香满庭芳',
      '万事如意展宏图，一帆风顺庆有余',
      '四季平安春常在，五福临门喜事多'
    ],
    programmer: [
      'Bug清零迎新春，Code优化报吉祥',
      '算法优化效率高，代码重构质量好',
      'Git提交记录新，Pull Request必过审',
      '前端后端齐打通，产品测试皆欢笑',
      'API响应速度快，数据库查询无延迟'
    ],
    office: [
      '工作顺心升职快，事业有成加薪多',
      '会议效率创新高，团队协作展风采',
      'KPI完成创佳绩，OKR达标创新高',
      '客户满意订单来，同事和谐年终美',
      '早九晚五无加班，周末双休不打扰'
    ],
    student: [
      '考试满分必过线，作业全对不加班',
      '知识积累日日新，成绩进步节节高',
      '期末考试得高分，寒假快乐不补课',
      '学习效率创新高，竞赛得奖露锋芒',
      '实习offer纷纷到，奖学金榜有我名'
    ],
    gamer: [
      '开局十连必出金，副本通关必爆紫',
      '天梯排位全胜上，组队开黑场场赢',
      '游戏加载零卡顿，网速流畅不掉线',
      '氪金不沉船长富，肝帝欧皇两开花',
      'Boss一击必掉落，成就完成解锁满'
    ],
    foodie: [
      '美食遍尝口福多，餐餐快乐胃口好',
      '火锅烤肉样样来，甜品饮料随心配',
      '早茶午餐晚宵香，零食饮料不打烊',
      '米其林三星常光顾，必胜客折扣天天有',
      '探店打卡收藏多，美食优惠券不断'
    ],
    acg: [
      '番剧更新不断档，漫画连载周周有',
      '手办收藏满上墙，展会门票抢得快',
      '老婆美图日日存，老公壁纸天天换',
      '动漫周边全收藏，剧场版票必预订',
      'CP成真大法好，二次元梦想成真'
    ],
    trendy: [
      '潮流装备焕新颜，时尚单品必收藏',
      '限量球鞋抢不停，潮牌上新买不断',
      '穿搭风格超在线，社交动态高赞爆',
      'Vlog剪辑播放高，短视频点赞多',
      '网红打卡地打卡，潮流趋势不落伍'
    ],
    literary: [
      '诗意栖居书香满，文艺生活茶味浓',
      '咖啡清香伴书香，音乐典雅绕耳旁',
      '独立书房光影美，私享时光笔墨香',
      '岁月静好读书乐，生活优雅品茗香',
      '文艺青年风雅颂，生活美学品味长'
    ]
  };

  // 初始化 all 分类
  sampleCouplets.all = Object.values(sampleCouplets).flat();

  // 处理文件上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        setTempImage(dataUrl);
        setIsDefaultCrop(true); // 重置为默认裁剪模式

        // 创建图片对象以获取尺寸
        const img = new Image();
        img.onload = () => {
          const { naturalWidth, naturalHeight } = img;
          
          if (naturalWidth === naturalHeight) {
            // 如果是正方形图片，直接使用
            setAvatar(dataUrl);
            if (selectedCouplet) {
              compositeImages(dataUrl, selectedCouplet);
            }
          } else {
            // 非正方形图片，设置默认裁剪区域为最大正方形
            const size = Math.min(naturalWidth, naturalHeight);
            const x = (naturalWidth - size) / 2;
            const y = (naturalHeight - size) / 2;
            
            // 转换为百分比
            setCrop({
              unit: '%',
              x: (x / naturalWidth) * 100,
              y: (y / naturalHeight) * 100,
              width: (size / naturalWidth) * 100,
              height: (size / naturalHeight) * 100
            });
            setShowCropModal(true);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  // 处理裁剪完成
  const handleCropComplete = async () => {
    if (!tempImage || !crop.width || !crop.height || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    const image = imgRef.current;

    // 创建临时图片以获取原始尺寸
    const tempImg = new Image();
    tempImg.src = tempImage;
    await new Promise<void>((resolve) => {
      tempImg.onload = () => resolve();
    });

    if (isDefaultCrop) {
      // 默认裁剪模式：使用百分比计算
      const naturalWidth = tempImg.naturalWidth;
      const naturalHeight = tempImg.naturalHeight;

      // 设置输出尺寸
      const outputSize = 500;
      canvas.width = outputSize;
      canvas.height = outputSize;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 使用百分比计算裁剪区域
      const pixelCrop = {
        x: Math.round((crop.x * naturalWidth) / 100),
        y: Math.round((crop.y * naturalHeight) / 100),
        width: Math.round((crop.width * naturalWidth) / 100),
        height: Math.round((crop.height * naturalHeight) / 100)
      };

      ctx.drawImage(
        tempImg,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputSize,
        outputSize
      );
    } else {
      // 用户调整裁剪模式：使用显示尺寸计算
      const displayRect = image.getBoundingClientRect();
      const displayWidth = displayRect.width;
      const displayHeight = displayRect.height;
      const naturalWidth = tempImg.naturalWidth;
      const naturalHeight = tempImg.naturalHeight;

      // 计算图片在显示区域中的实际位置
      const displayAspect = displayWidth / displayHeight;
      const imageAspect = naturalWidth / naturalHeight;
      
      let imageDisplayWidth, imageDisplayHeight;
      if (imageAspect > displayAspect) {
        imageDisplayWidth = displayWidth;
        imageDisplayHeight = displayWidth / imageAspect;
      } else {
        imageDisplayHeight = displayHeight;
        imageDisplayWidth = displayHeight * imageAspect;
      }

      // 计算偏移量
      const imageOffsetX = (displayWidth - imageDisplayWidth) / 2;
      const imageOffsetY = (displayHeight - imageDisplayHeight) / 2;

      // 计算缩放比例
      const scaleX = naturalWidth / imageDisplayWidth;
      const scaleY = naturalHeight / imageDisplayHeight;

      // 设置输出尺寸
      const outputSize = 500;
      canvas.width = outputSize;
      canvas.height = outputSize;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 计算实际裁剪区域
      const pixelCrop = {
        x: Math.round(((crop.x - imageOffsetX) * scaleX)),
        y: Math.round(((crop.y - imageOffsetY) * scaleY)),
        width: Math.round(crop.width * scaleX),
        height: Math.round(crop.height * scaleY)
      };

      // 确保裁剪区域不超出范围
      pixelCrop.x = Math.max(0, Math.min(pixelCrop.x, naturalWidth - pixelCrop.width));
      pixelCrop.y = Math.max(0, Math.min(pixelCrop.y, naturalHeight - pixelCrop.height));

      ctx.drawImage(
        tempImg,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputSize,
        outputSize
      );
    }

    // 获取裁剪后的图片
    const croppedImage = canvas.toDataURL('image/png', 1.0);
    setAvatar(croppedImage);
    setShowCropModal(false);
    
    // 如果已选择春联，立即合成
    if (selectedCouplet) {
      compositeImages(croppedImage, selectedCouplet);
    }
  };

  // 处理裁剪变化
  const handleCropChange = (newCrop: Crop) => {
    setIsDefaultCrop(false); // 用户开始调整裁剪区域
    setCrop(newCrop);
  };

  // 合成图片
  const compositeImages = (avatarSrc: string, text: string) => {
    setIsLoading(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // 设置固定的画布大小
      const canvasSize = 500;
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 启用图像平滑
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 绘制头像
      ctx.drawImage(img, 0, 0, canvasSize, canvasSize);

      // 设置春联文字样式
      const lines = text.split('，');
      const coupletWidth = canvas.width * 0.15;  // 春联宽度
      const coupletHeight = canvas.height * 0.88; // 春联高度
      const baseY = canvas.height * 0.06;        // 春联起始Y坐标

      // 绘制春联背景函数
      const drawCoupletBackground = (x: number, isLeft: boolean) => {
        const baseX = isLeft ? x : x - coupletWidth;
        
        // 创建主渐变背景
        const mainGradient = ctx.createLinearGradient(baseX, baseY, baseX + coupletWidth, baseY + coupletHeight);
        mainGradient.addColorStop(0, '#AA0000');
        mainGradient.addColorStop(0.3, '#CE1E1E');
        mainGradient.addColorStop(0.7, '#CE1E1E');
        mainGradient.addColorStop(1, '#AA0000');
        
        // 绘制主体背景
        ctx.fillStyle = mainGradient;
        ctx.fillRect(baseX, baseY, coupletWidth, coupletHeight);

        // 绘制格纹背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        const gridSize = 15;
        for (let i = 0; i < coupletHeight; i += gridSize) {
          ctx.fillRect(baseX, baseY + i, coupletWidth, 1);
        }
        for (let i = 0; i < coupletWidth; i += gridSize) {
          ctx.fillRect(baseX + i, baseY, 1, coupletHeight);
        }

        // 绘制边框
        ctx.lineWidth = 2;
        const borderGradient = ctx.createLinearGradient(baseX, baseY, baseX, baseY + coupletHeight);
        borderGradient.addColorStop(0, '#FFD700');
        borderGradient.addColorStop(0.5, '#FDB900');
        borderGradient.addColorStop(1, '#FFD700');
        ctx.strokeStyle = borderGradient;
        ctx.strokeRect(baseX, baseY, coupletWidth, coupletHeight);
      };

      // 绘制左右春联背景
      drawCoupletBackground(canvas.width * 0.03, true);
      drawCoupletBackground(canvas.width * 0.97, false);

      // 设置文字样式
      const fontSize = Math.min(canvas.width * 0.08, canvas.height * 0.08);
      ctx.font = `bold ${fontSize}px "STKaiti", "楷体"`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      
      // 计算文字位置
      const leftX = canvas.width * 0.105;
      const rightX = canvas.width * 0.895;
      const startY = canvas.height * 0.17;
      const charHeight = canvas.height * 0.115;

      // 绘制文字效果
      const drawChar = (char: string, x: number, y: number) => {
        // 绘制文字阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // 绘制描边
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;
        ctx.strokeText(char, x, y);

        // 创建文字渐变
        const gradient = ctx.createLinearGradient(x - fontSize/2, y - fontSize/2, x + fontSize/2, y + fontSize/2);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FDB900');
        gradient.addColorStop(1, '#FFD700');

        // 绘制主体文字
        ctx.fillStyle = gradient;
        ctx.fillText(char, x, y);

        // 重置阴影
        ctx.shadowColor = 'transparent';
      };
      
      // 绘制左侧春联文字
      if (lines[0]) {
        const chars = lines[0].split('');
        chars.forEach((char, i) => {
          drawChar(char, leftX, startY + (charHeight * i));
        });
      }
      
      // 绘制右侧春联文字
      if (lines[1]) {
        const chars = lines[1].split('');
        chars.forEach((char, i) => {
          drawChar(char, rightX, startY + (charHeight * i));
        });
      }

      // 绘制装饰点缀
      const drawDots = (x: number, y: number, size: number) => {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      };

      // 在每个春联顶部和底部添加装饰点
      [leftX, rightX].forEach(x => {
        drawDots(x, canvas.height * 0.08, 3);
        drawDots(x, canvas.height * 0.92, 3);
      });

      setCompositeImage(canvas.toDataURL('image/png'));
      setIsLoading(false);
    };
    img.src = avatarSrc;
  };

  // 处理模式切换
  const handleModeChange = (mode: 'ai' | 'template') => {
    setSelectedMode(mode);
    setSelectedCouplet(null);
    if (mode === 'template') {
      setGeneratedCouplets([]);
      // 设置默认春联
      const defaultCouplet = sampleCouplets[selectedCategory]?.[0];
      if (defaultCouplet) {
        setSelectedCouplet(defaultCouplet);
      }
    }
  };

  // 处理分类切换
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // 设置该分类的第一个春联为选中状态
    const defaultCouplet = sampleCouplets[categoryId]?.[0];
    if (defaultCouplet) {
      setSelectedCouplet(defaultCouplet);
    }
  };

  // 处理春联选择
  const handleCoupletSelect = (couplet: string) => {
    setSelectedCouplet(couplet);
    if (avatar) {
      compositeImages(avatar, couplet);
    }
  };

  // 当头像或春联改变时，重新合成图片
  useEffect(() => {
    if (avatar && selectedCouplet) {
      compositeImages(avatar, selectedCouplet);
    }
  }, [avatar, selectedCouplet]);

  // 下载图片
  const handleDownload = () => {
    if (compositeImage) {
      const link = document.createElement('a');
      link.download = '新年头像.png';
      link.href = compositeImage;
      link.click();
    }
  };

  // 生成春联
  const generateCouplets = async () => {
    if (!keywords.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords }),
      });

      const data = await response.json();
      if (data.couplets && data.couplets.length > 0) {
        setGeneratedCouplets(data.couplets);
        setSelectedCouplet(data.couplets[0]); // 默认选中第一个
      }
    } catch (error) {
      console.error('Error generating couplets:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-orange-50 to-red-50 py-4 px-2 sm:py-8 sm:px-4">
      <div className="w-full max-w-md mx-auto relative">
        {/* 装饰元素 */}
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-red-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-amber-100 rounded-full blur-3xl opacity-50" />
        
        <Card className="border-none shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
          {/* 顶部装饰 */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-300 via-amber-300 to-red-300" />
          
          <CardContent className="p-4 sm:p-6">
            {/* 产品标题和 slogan */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-amber-500 bg-clip-text text-transparent">
                微信春联头像
              </h1>
              <p className="mt-1.5 text-sm text-gray-500">
                贴春联，换新颜，让头像有年味
              </p>
            </div>

            <div className="space-y-6">
              {/* 头像上传区域 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-gray-500" />
                  <h3 className="text-base font-medium text-gray-800">上传头像</h3>
                </div>

                <div 
                  className="group relative w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-2xl overflow-hidden cursor-pointer
                    transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-amber-50 border-2 border-dashed border-red-200 group-hover:border-red-400 transition-colors" />
                  
                  {compositeImage ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={compositeImage} 
                        alt="预览" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <p className="text-white text-sm font-medium px-4 py-2 bg-black/30 rounded-full backdrop-blur-sm">
                          点击重新上传
                        </p>
                      </div>
                    </div>
                  ) : avatar ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={avatar} 
                        alt="上传的头像" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <p className="text-white text-sm font-medium px-4 py-2 bg-black/30 rounded-full backdrop-blur-sm">
                          点击重新上传
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-8 h-8 text-red-400" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm text-gray-600 text-center">点击上传你的头像</p>
                      <p className="text-xs text-gray-400 mt-1">建议使用正方形头像哦～</p>
                    </div>
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p className="text-sm text-gray-600">处理中...</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* 裁剪模态框 */}
              {showCropModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                    {/* 模态框头部 */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <LucideCrop className="w-5 h-5 text-red-500" />
                          <h3 className="text-lg font-semibold text-gray-800">裁剪头像</h3>
                        </div>
                        <button 
                          onClick={() => {
                            setShowCropModal(false);
                            setTempImage('');
                          }}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          aria-label="关闭"
                        >
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">调整裁剪区域以获得最佳效果</p>
                    </div>

                    {/* 裁剪区域 */}
                    <div className="relative p-4 bg-gray-50">
                      <div className="max-h-[60vh] w-full relative rounded-lg overflow-hidden">
                        <ReactCrop
                          crop={crop}
                          onChange={handleCropChange}
                          aspect={1}
                          className="max-w-full max-h-full"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            margin: '0 auto'
                          }}
                        >
                          <img
                            ref={imgRef}
                            src={tempImage}
                            alt="裁剪预览"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '60vh',
                              objectFit: 'contain',
                              margin: '0 auto',
                              display: 'block'
                            }}
                            className="rounded-lg"
                          />
                        </ReactCrop>
                      </div>
                    </div>

                    {/* 模态框底部 */}
                    <div className="p-4 bg-white border-t border-gray-100">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setShowCropModal(false);
                            setTempImage('');
                          }}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>取消</span>
                        </button>
                        <button
                          onClick={() => handleCropComplete()}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-sm hover:from-red-600 hover:to-red-700 transition-all shadow-sm hover:shadow flex items-center space-x-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>确认裁剪</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* 春联选择区域 */}
              <div className="mt-8">
                {/* 选择模式标题 */}
                <div className="flex items-center space-x-2 mb-5">
                  <Brush className="w-4 h-4 text-gray-500" />
                  <h3 className="text-base font-medium text-gray-800">选择春联模式</h3>
                </div>

                {/* 两种模式选项卡 */}
                <div className="flex gap-2 mb-5">
                  <button
                    onClick={() => setSelectedMode('template')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm transition-all
                      ${selectedMode === 'template'
                        ? 'bg-red-50 text-red-600 font-medium ring-1 ring-red-500'
                        : 'bg-gray-50/70 text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                      }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <ScrollText className="w-4 h-4" />
                      <span>春联模板</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedMode('ai')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm transition-all
                      ${selectedMode === 'ai'
                        ? 'bg-amber-50 text-amber-600 font-medium ring-1 ring-amber-500'
                        : 'bg-gray-50/70 text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                      }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Sparkles className="w-4 h-4" />
                      <span>AI 生成</span>
                    </div>
                  </button>
                </div>

                {/* 模板选择模式 */}
                {selectedMode === 'template' && (
                  <div className="space-y-4">
                    {/* 分类标签栏 */}
                    <div className="relative">
                      <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none 
                        [.no-scroll_&]:hidden" />
                      
                      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className="flex gap-1.5 pb-0.5 min-w-min">
                          {Object.entries(sampleCouplets).map(([key, couplets]) => (
                            <button
                              key={key}
                              onClick={() => handleCategoryChange(key)}
                              className={`shrink-0 px-3 py-1 rounded-full text-sm transition-all
                                ${selectedCategory === key 
                                  ? 'bg-red-500 text-white shadow-sm' 
                                  : 'bg-gray-50/70 text-gray-500 hover:bg-gray-100 hover:text-gray-600'
                                }`}
                            >
                              {coupletCategories.find(category => category.id === key)?.name}
                              <span className={`ml-1 text-xs ${selectedCategory === key ? 'text-white/90' : 'text-gray-400'}`}>
                                ({couplets.length})
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 春联列表 */}
                    <div className="relative mt-1">
                      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none
                        [.no-overflow_&]:hidden" />
                      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none
                        [.no-overflow_&]:hidden" />
                      
                      {Object.entries(sampleCouplets).map(([key, couplets]) => (
                        <div key={key} 
                          className={`transition-all duration-200 
                            ${selectedCategory === key ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 hidden'}`}
                        >
                          <div className="h-[225px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-1">
                            <div className="space-y-1.5 px-0.5">
                              {couplets.map((couplet, index) => {
                                const lines = couplet.split('，');
                                return (
                                  <button
                                    key={index}
                                    onClick={() => handleCoupletSelect(couplet)}
                                    className={`group w-full relative px-3.5 py-2 rounded-lg transition-all
                                      ${selectedCouplet === couplet
                                        ? 'bg-red-50 ring-1 ring-red-500'
                                        : 'hover:bg-gray-50/80'
                                      }`}
                                  >
                                    <div className="flex items-center justify-center gap-10">
                                      {lines.map((line, i) => (
                                        <p
                                          key={i}
                                          className={`text-sm transition-colors duration-200
                                            ${selectedCouplet === couplet 
                                              ? 'text-red-600 font-medium' 
                                              : 'text-gray-500 group-hover:text-gray-800'
                                            }`}
                                        >
                                          {line}
                                        </p>
                                      ))}
                                    </div>

                                    {/* 选中标记 */}
                                    {selectedCouplet === couplet && (
                                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-transform duration-200">
                                        <Check className="w-3.5 h-3.5 text-red-500" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI 生成模式 */}
                {selectedMode === 'ai' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="输入关键词，让 AI 为你生成专属春联"
                        className="flex-1 px-3.5 py-2 rounded-lg border border-gray-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all outline-none text-gray-600 placeholder:text-gray-400 text-sm"
                      />
                      <button
                        onClick={generateCouplets}
                        disabled={isGenerating || !keywords.trim()}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 whitespace-nowrap
                          ${isGenerating || !keywords.trim()
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-sm hover:shadow hover:from-amber-600 hover:to-red-600'
                          }`}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>生成中...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            <span>生成春联</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 生成的春联列表 */}
                    {generatedCouplets.length > 0 && (
                      <div className="relative mt-1">
                        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none
                          [.no-overflow_&]:hidden" />
                        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none
                          [.no-overflow_&]:hidden" />
                        
                        <div className="h-[225px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-1">
                          <div className="space-y-1.5 px-0.5">
                            {generatedCouplets.map((couplet, index) => {
                              const lines = couplet.split('，');
                              return (
                                <button
                                  key={index}
                                  onClick={() => handleCoupletSelect(couplet)}
                                  className={`group w-full relative px-3.5 py-2 rounded-lg transition-all
                                    ${selectedCouplet === couplet
                                      ? 'bg-red-50 ring-1 ring-red-500'
                                      : 'hover:bg-gray-50/80'
                                    }`}
                                >
                                  <div className="flex items-center justify-center gap-10">
                                    {lines.map((line, i) => (
                                      <p
                                        key={i}
                                        className={`text-sm transition-colors duration-200
                                          ${selectedCouplet === couplet 
                                            ? 'text-red-600 font-medium' 
                                            : 'text-gray-500 group-hover:text-gray-800'
                                          }`}
                                      >
                                        {line}
                                      </p>
                                    ))}
                                  </div>

                                  {/* 选中标记 */}
                                  {selectedCouplet === couplet && (
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-transform duration-200">
                                      <Check className="w-3.5 h-3.5 text-red-500" />
                                    </div>
                                  )}

                                  {/* AI标记 */}
                                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-red-500 rounded-full text-[10px] text-white shadow-sm">
                                    AI
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 下载按钮 */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleDownload}
                  disabled={!compositeImage || isLoading}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2
                    ${!compositeImage || isLoading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm hover:shadow hover:from-red-600 hover:to-red-700'
                    }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>生成中...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>下载头像</span>
                    </>
                  )}
                </button>
              </div>

              {/* 隐藏的canvas */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewYearAvatarEditor;

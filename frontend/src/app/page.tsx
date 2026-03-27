'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'

// 声明浏览器全局类型
declare const document: typeof window.document

// 3x3 网格表情类型（9 个表情）
const EXPRESSIONS = [
  { id: 1, name: '开心', emoji: '😀', row: 0, col: 0 },
  { id: 2, name: '悲伤', emoji: '😢', row: 0, col: 1 },
  { id: 3, name: '惊讶', emoji: '😮', row: 0, col: 2 },
  { id: 4, name: '生气', emoji: '😠', row: 1, col: 0 },
  { id: 5, name: '思考', emoji: '🤔', row: 1, col: 1 },
  { id: 6, name: '搞怪', emoji: '😜', row: 1, col: 2 },
  { id: 7, name: '发呆', emoji: '😴', row: 2, col: 0 },
  { id: 8, name: '卖萌', emoji: '🤗', row: 2, col: 1 },
  { id: 9, name: '害羞', emoji: '😊', row: 2, col: 2 },
]

type Step = 'upload' | 'preview' | 'generating' | 'result'

export default function Home() {
  const [step, setStep] = useState<Step>('upload')
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [base64Image, setBase64Image] = useState<string>('')
  const [taskId, setTaskId] = useState<string>('')
  const [gridImageUrl, setGridImageUrl] = useState<string>('')
  const [selected, setSelected] = useState<number[]>([])
  const [progress, setProgress] = useState(0)
  const [generatingText, setGeneratingText] = useState('')
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [splitImages, setSplitImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 将文件转换为 Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 分割 3x3 网格图为 9 张独立图
  const splitGridImage = async (imageUrl: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        const gridSize = 3
        const cellWidth = img.width / gridSize
        const cellHeight = img.height / gridSize
        const splitUrls: string[] = []

        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            canvas.width = cellWidth
            canvas.height = cellHeight
            
            // 绘制网格的一部分
            ctx.drawImage(
              img,
              col * cellWidth, row * cellHeight, cellWidth, cellHeight, // 源位置和大小
              0, 0, cellWidth, cellHeight // 目标位置和大小
            )

            // 转换为 base64
            const dataUrl = canvas.toDataURL('image/png')
            splitUrls.push(dataUrl)
          }
        }

        resolve(splitUrls)
      }
      img.onerror = reject
      img.src = imageUrl
    })
  }

  // 处理图片选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB')
      return
    }

    // 预览
    const url = URL.createObjectURL(file)
    setImage(file)
    setPreviewUrl(url)

    // 转换为 Base64
    const base64 = await fileToBase64(file)
    setBase64Image(base64)

    setStep('preview')
  }

  // 点击上传区域
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // 开始生成
  const handleGenerate = async () => {
    if (!image || !base64Image) return

    setStep('generating')
    setProgress(0)
    setGeneratingText('正在生成 3x3 网格表情包（9 个表情）...')

    try {
      // 使用 Base64 发起生成任务（不再需要 count 参数）
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: crypto.randomUUID(),
          base64: base64Image,
        }),
      })
      
      const generateData = await generateRes.json()
      
      if (generateData.error) {
        throw new Error(generateData.error)
      }

      setProgress(100)
      setGeneratingText('正在分割网格图...')

      if (generateData.results && generateData.results.length > 0) {
        const gridUrl = generateData.results[0]
        setGridImageUrl(gridUrl)
        
        // 分割网格图
        const splits = await splitGridImage(gridUrl)
        setSplitImages(splits)
        setSelected(splits.map((_: string, i: number) => i))
        setStep('result')
      } else {
        throw new Error('生成结果为空')
      }
    } catch (err) {
      console.error(err)
      alert('出错了，请重试')
      setStep('upload')
    }
  }

  // 切换选择
  const toggleSelect = (index: number) => {
    if (selected.includes(index)) {
      setSelected(selected.filter(i => i !== index))
    } else {
      setSelected([...selected, index])
    }
  }

  // 全选/取消全选
  const toggleAll = () => {
    if (selected.length === splitImages.length) {
      setSelected([])
    } else {
      setSelected(splitImages.map((_: string, i: number) => i))
    }
  }

  // 下载单张
  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  // 下载全部（ZIP 打包）
  const handleDownloadAll = async () => {
    const selectedUrls = selected.map(i => splitImages[i])
    
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: selectedUrls }),
      })
      
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'q-avatar.zip'
      link.click()
    } catch (err) {
      console.error('Download all failed:', err)
      alert('下载失败，请重试')
    }
  }

  // 复制到剪贴板
  const handleCopyToClipboard = async (url: string) => {
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ])
      alert('已复制到剪贴板')
    } catch (err) {
      console.error('Copy failed:', err)
      alert('复制失败')
    }
  }

  // 重新开始
  const handleReset = () => {
    setStep('upload')
    setImage(null)
    setPreviewUrl('')
    setBase64Image('')
    setTaskId('')
    setGridImageUrl('')
    setSplitImages([])
    setSelected([])
    setProgress(0)
    setGeneratingText('')
  }

  return (
    <main className="min-h-screen py-8 px-4 bg-gradient-to-br from-yellow-400 to-orange-500">
      <div className="max-w-md mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            🐣 Q趣头像
          </h1>
          <p className="text-white/90">AI生成你的专属Q版表情包</p>
        </div>

        {/* 上传页面 */}
        {step === 'upload' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div
              onClick={handleClick}
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors border-gray-300 hover:border-yellow-500"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="text-5xl mb-4">📷</div>
              <p className="text-gray-600 font-medium">点击或拖拽上传照片</p>
              <p className="text-gray-400 text-sm mt-1">支持 JPG/PNG，不超过10MB</p>
            </div>
          </div>
        )}

        {/* 预览确认页面 */}
        {step === 'preview' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-center mb-4">确认照片</h2>
            <img
              src={previewUrl}
              alt="预览"
              className="max-h-64 mx-auto rounded-lg mb-4"
            />
            <p className="text-gray-500 text-sm text-center mb-6">
              将以此照片生成 3x3 网格表情包（9 个表情）
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                重新选择
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 py-3 rounded-xl bg-yellow-500 text-white font-medium hover:bg-yellow-600 transition-colors"
              >
                开始生成
              </button>
            </div>
          </div>
        )}

        {/* 生成中 */}
        {step === 'generating' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <div className="text-5xl mb-4">🎨</div>
            <h2 className="text-xl font-bold mb-2">正在生成中...</h2>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-gray-500 text-sm">{generatingText}</p>
          </div>
        )}

        {/* 结果页面 */}
        {step === 'result' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-center mb-4">✅ 生成完成!</h2>

            {/* 大图预览 */}
            {selectedImage !== null && (
              <div
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedImage(null)}
              >
                <img
                  src={splitImages[selectedImage]}
                  alt={EXPRESSIONS[selectedImage]?.name}
                  className="max-w-full max-h-full rounded-lg"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload(splitImages[selectedImage], `avatar_${selectedImage + 1}.png`)
                  }}
                  className="absolute bottom-8 py-2 px-4 bg-yellow-500 text-white rounded-lg font-medium"
                >
                  下载
                </button>
              </div>
            )}

            {/* 网格展示 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {splitImages.map((url, i) => (
                <div
                  key={i}
                  onClick={() => toggleSelect(i)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden aspect-square ${
                    selected.includes(i) ? 'ring-2 ring-yellow-500' : ''
                  }`}
                >
                  <img
                    src={url}
                    alt={EXPRESSIONS[i]?.name || `表情${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                    {EXPRESSIONS[i]?.emoji} {EXPRESSIONS[i]?.name}
                  </div>
                  {selected.includes(i) && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <button onClick={toggleAll} className="text-yellow-600 text-sm font-medium">
                {selected.length === splitImages.length ? '取消全选' : '全选'}
              </button>
              <p className="text-gray-500 text-sm">
                已选择 {selected.length}/9 张
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                再生成一张
              </button>
              <button
                onClick={handleDownloadAll}
                disabled={selected.length === 0}
                className="flex-1 py-3 rounded-xl bg-yellow-500 text-white font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                下载全部
              </button>
            </div>
          </div>
        )}

        {/* 底部说明 */}
        <p className="text-center text-white/60 text-xs mt-8">
          © 2026 Q趣头像 · AI驱动
        </p>
      </div>
    </main>
  )
}

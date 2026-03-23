'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'

// 表情类型
const EXPRESSIONS = [
  { id: 1, name: '开心', emoji: '😀', prompt: 'happy smile, cute Q version cartoon, big head small body' },
  { id: 2, name: '悲伤', emoji: '😢', prompt: 'sad crying, cute Q version cartoon, big head small body' },
  { id: 3, name: '惊讶', emoji: '😮', prompt: 'surprised amazed, cute Q version cartoon, big head small body' },
  { id: 4, name: '生气', emoji: '😠', prompt: 'angry furious, cute Q version cartoon, big head small body' },
  { id: 5, name: '思考', emoji: '🤔', prompt: 'thinking pensive, cute Q version cartoon, big head small body' },
  { id: 6, name: '搞怪', emoji: '😜', prompt: 'playful mischievous, cute Q version cartoon, big head small body' },
  { id: 7, name: '发呆', emoji: '😴', prompt: 'sleepy tired, cute Q version cartoon, big head small body' },
  { id: 8, name: '卖萌', emoji: '🤗', prompt: 'love adore, cute Q version cartoon, big head small body' },
]

type Step = 'upload' | 'preview' | 'generating' | 'result'

export default function Home() {
  const [step, setStep] = useState<Step>('upload')
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [taskId, setTaskId] = useState<string>('')
  const [results, setResults] = useState<string[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [progress, setProgress] = useState(0)
  const [generatingText, setGeneratingText] = useState('')
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  // 处理图片上传
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB')
      return
    }

    setImage(file)
    setPreviewUrl(URL.createObjectURL(file))
    setStep('preview')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1,
  })

  // 开始生成
  const handleGenerate = async () => {
    if (!image) return

    setStep('generating')
    setProgress(0)
    setGeneratingText('正在上传图片...')

    try {
      // 1. 上传图片
      const formData = new FormData()
      formData.append('image', image)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()

      if (!uploadData.file_id) {
        throw new Error('Upload failed')
      }

      setProgress(10)
      setGeneratingText('AI正在生成表情包...')

      // 2. 发起生成任务
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: uploadData.file_id,
          count: 8,
        }),
      })
      const generateData = await generateRes.json()
      const newTaskId = generateData.task_id
      setTaskId(newTaskId)

      setProgress(20)

      // 3. 轮询任务状态
      const pollTask = async () => {
        const statusRes = await fetch(`/api/task/${newTaskId}`)
        const statusData = await statusRes.json()

        const prog = Math.min(20 + statusData.progress * 0.7, 90)
        setProgress(prog)

        if (statusData.status === 'completed') {
          setResults(statusData.results)
          setSelected(statusData.results.map((_: unknown, i: number) => i))
          setStep('result')
        } else if (statusData.status === 'failed') {
          alert('生成失败，请重试')
          setStep('upload')
        } else {
          setGeneratingText(statusData.message || 'AI正在生成表情包...')
          setTimeout(pollTask, 2000)
        }
      }

      setTimeout(pollTask, 1000)
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
    if (selected.length === results.length) {
      setSelected([])
    } else {
      setSelected(results.map((_, i) => i))
    }
  }

  // 下载单张
  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  // 打包下载
  const handleDownloadAll = async () => {
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: selected.map(i => results[i]),
        }),
      })
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'q-avatar.zip'
      link.click()
    } catch (err) {
      alert('下载失败')
    }
  }

  // 复制到剪贴板
  const handleCopyToClipboard = async (url: string) => {
    try {
      const res = await fetch(url)
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
    setTaskId('')
    setResults([])
    setSelected([])
    setProgress(0)
    setGeneratingText('')
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 text-shadow">
            🐣 Q趣头像
          </h1>
          <p className="text-white/80">AI生成你的专属Q版表情包</p>
        </div>

        {/* 上传页面 */}
        {step === 'upload' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
              }`}
            >
              <input {...getInputProps()} />
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="预览"
                  width={256}
                  height={256}
                  className="max-h-64 mx-auto rounded-lg"
                />
              ) : (
                <>
                  <div className="text-5xl mb-4">📷</div>
                  <p className="text-gray-600 font-medium">点击或拖拽上传照片</p>
                  <p className="text-gray-400 text-sm mt-1">支持 JPG/PNG，不超过10MB</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* 预览确认页面 */}
        {step === 'preview' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-center mb-4">确认照片</h2>
            <Image
              src={previewUrl}
              alt="预览"
              width={256}
              height={256}
              className="max-h-64 mx-auto rounded-lg mb-4"
            />
            <p className="text-gray-500 text-sm text-center mb-6">
              将以此照片生成8张Q版表情包
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
              >
                重新选择
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
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
                className="bg-primary h-3 rounded-full transition-all duration-500"
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
                <Image
                  src={results[selectedImage]}
                  alt={EXPRESSIONS[selectedImage]?.name}
                  width={400}
                  height={400}
                  className="max-w-full max-h-full rounded-lg"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload(results[selectedImage], `avatar_${selectedImage + 1}.png`)
                  }}
                  className="absolute bottom-8 py-2 px-4 bg-primary text-white rounded-lg font-medium"
                >
                  下载
                </button>
              </div>
            )}

            {/* 网格展示 */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {results.map((url, i) => (
                <div
                  key={i}
                  onClick={() => toggleSelect(i)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden aspect-square ${
                    selected.includes(i) ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <Image
                    src={url}
                    alt={EXPRESSIONS[i]?.name || `表情${i + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                    {EXPRESSIONS[i]?.emoji} {EXPRESSIONS[i]?.name}
                  </div>
                  {selected.includes(i) && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <button onClick={toggleAll} className="text-primary text-sm font-medium">
                {selected.length === results.length ? '取消全选' : '全选'}
              </button>
              <p className="text-gray-500 text-sm">
                已选择 {selected.length}/8 张
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium"
              >
                再生成一张
              </button>
              <button
                onClick={handleDownloadAll}
                disabled={selected.length === 0}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium disabled:opacity-50"
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

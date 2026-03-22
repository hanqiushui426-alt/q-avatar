import { useState } from 'react'
import axios from 'axios'

const EXPRESSIONS = [
  { id: 1, name: '开心', emoji: '😀' },
  { id: 2, name: '悲伤', emoji: '😢' },
  { id: 3, name: '惊讶', emoji: '😮' },
  { id: 4, name: '生气', emoji: '😠' },
  { id: 5, name: '思考', emoji: '🤔' },
  { id: 6, name: '搞怪', emoji: '😜' },
  { id: 7, name: '发呆', emoji: '😴' },
  { id: 8, name: '卖萌', emoji: '🤗' },
]

function App() {
  const [step, setStep] = useState('upload') // upload, generating, result
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [taskId, setTaskId] = useState(null)
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState([])
  const [progress, setProgress] = useState(0)
  const [generatingText, setGeneratingText] = useState('')

  // 处理图片上传
  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB')
      return
    }

    setImage(file)
    setPreview(URL.createObjectURL(file))
    setStep('preview')
  }

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
      
      const uploadRes = await axios.post('/api/upload', formData)
      const fileId = uploadRes.data.file_id
      
      setProgress(10)
      setGeneratingText('AI正在生成表情包...')

      // 2. 发起生成任务
      const generateRes = await axios.post('/api/generate', {
        file_id: fileId,
        count: 8
      })
      const taskId = generateRes.data.task_id
      setTaskId(taskId)
      
      setProgress(20)

      // 3. 轮询任务状态
      const pollTask = async () => {
        const statusRes = await axios.get(`/api/task/${taskId}`)
        const { status, progress: prog, results: imgs } = statusRes.data
        
        setProgress(Math.min(20 + prog * 0.7, 90))
        
        if (status === 'completed') {
          setResults(imgs)
          setSelected(imgs.map((_, i) => i))
          setStep('result')
        } else if (status === 'failed') {
          alert('生成失败，请重试')
          setStep('upload')
        } else {
          setGeneratingText(statusRes.data.message || 'AI正在生成表情包...')
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
  const toggleSelect = (index) => {
    if (selected.includes(index)) {
      setSelected(selected.filter(i => i !== index))
    } else {
      setSelected([...selected, index])
    }
  }

  // 下载单张
  const handleDownload = (url) => {
    window.open(url, '_blank')
  }

  // 打包下载
  const handleDownloadAll = async () => {
    try {
      const res = await axios.post('/api/download', {
        urls: selected.map(i => results[i])
      }, {
        responseType: 'blob'
      })
      const blob = new Blob([res.data])
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'q-avatar.zip'
      link.click()
    } catch (err) {
      alert('下载失败')
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🐣 Q趣头像
          </h1>
          <p className="text-white/80">AI生成你的专属Q版表情包</p>
        </div>

        {/* 上传页面 */}
        {step === 'upload' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary transition-colors">
                {preview ? (
                  <img src={preview} alt="预览" className="max-h-64 mx-auto rounded-lg" />
                ) : (
                  <>
                    <div className="text-5xl mb-4">📷</div>
                    <p className="text-gray-600 font-medium">点击上传照片</p>
                    <p className="text-gray-400 text-sm mt-1">支持 JPG/PNG，不超过10MB</p>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        )}

        {/* 预览确认页面 */}
        {step === 'preview' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-center mb-4">确认照片</h2>
            <img src={preview} alt="预览" className="max-h-64 mx-auto rounded-lg mb-4" />
            <p className="text-gray-500 text-sm text-center mb-6">
              将以此照片生成8张Q版表情包
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => { setPreview(null); setImage(null); setStep('upload') }}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200"
              >
                重新选择
              </button>
              <button 
                onClick={handleGenerate}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:opacity-90"
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
            
            <div className="grid grid-cols-4 gap-2 mb-4">
              {results.map((url, i) => (
                <div 
                  key={i} 
                  onClick={() => toggleSelect(i)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden ${
                    selected.includes(i) ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <img src={url} alt={EXPRESSIONS[i]?.name} className="w-full aspect-square object-cover" />
                  {selected.includes(i) && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-center text-gray-500 text-sm mb-4">
              已选择 {selected.length}/8 张
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => { setStep('upload'); setImage(null); setPreview(null); setResults([]) }}
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
          © 2026 Q趣头像 · AI驅動
        </p>
      </div>
    </div>
  )
}

export default App

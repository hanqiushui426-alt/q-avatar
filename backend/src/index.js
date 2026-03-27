import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'))
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  }
})
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
})

// 模拟任务存储（生产环境用Redis）
const tasks = new Map()

// AI API 配置（火山引擎 Doubao Seedream 4.0）
const AI_API_KEY = '37da519c-8e1a-4c7c-9e90-f08ec59a78d1'
const AI_API_URL = 'https://ark.cn-beijing.volces.com/api/v3'

// 表情包提示词（3x3 网格，9 个表情）
const EXPRESSION_PROMPT = `Based on the reference image character, create a brand new set of Q-version half-body emoticons. Style should imitate LINE stickers, with cute colorful hand-drawn texture. Must accurately reproduce the character's iconic headwear. Layout: 3x3 grid matrix (9 emoticons). Each expression's action and expression must be redesigned, not directly copied from the original. Content covers daily online chat common phrases (no memes). All text labels must be handwritten simplified Chinese. 4K resolution, 1:1 aspect ratio.`

// 上传图片
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    
    const file_id = uuidv4()
    const fileUrl = `/uploads/${req.file.filename}`
    
    // 这里可以上传到云存储，返回云存储URL
    // 暂时使用本地路径
    
    res.json({
      file_id,
      url: fileUrl,
      filename: req.file.filename
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Upload failed' })
  }
})

// 发起生成任务（生成 3x3 网格表情包，9 个表情）
app.post('/api/generate', async (req, res) => {
  try {
    const { file_id, base64 } = req.body
    
    if (!file_id || !base64) {
      return res.status(400).json({ error: 'file_id and base64 required' })
    }

    const task_id = uuidv4()
    
    // 初始化任务
    tasks.set(task_id, {
      status: 'processing',
      progress: 0,
      results: [],
      message: '准备生成...'
    })

    // 异步生成（生产环境用队列）
    generateImages(task_id, file_id, base64)
    
    res.json({ task_id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Generate failed' })
  }
})

// 查询任务状态
app.get('/api/task/:task_id', async (req, res) => {
  const { task_id } = req.params
  const task = tasks.get(task_id)
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' })
  }
  
  res.json(task)
})

// 下载打包
app.post('/api/download', async (req, res) => {
  try {
    const { urls } = req.body
    
    if (!urls || urls.length === 0) {
      return res.status(400).json({ error: 'No URLs provided' })
    }

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', 'attachment; filename=q-avatar.zip')

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.pipe(res)

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      try {
        // 如果是本地文件
        if (url.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, url)
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: `avatar_${i + 1}.png` })
          }
        } else if (url.startsWith('http')) {
          // 远程文件需要先下载
          const response = await axios.get(url, { responseType: 'arraybuffer' })
          archive.append(response.data, { name: `avatar_${i + 1}.png` })
        }
      } catch (e) {
        console.error(`Failed to add ${url}:`, e.message)
      }
    }

    await archive.finalize()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Download failed' })
  }
})

// AI生成图片（一次生成 9 个表情的 3x3 网格图）
async function generateImages(taskId, fileId, base64Image) {
  const task = tasks.get(taskId)
  
  try {
    // 更新任务状态
    task.progress = 10
    task.message = '正在生成 3x3 网格表情包（9 个表情）...'
    tasks.set(taskId, { ...task })
    
    // 调用 AI API 生成 1 张包含 9 个表情的网格图
    const result = await callAIApi(base64Image, EXPRESSION_PROMPT)
    
    task.progress = 100
    task.results.push(result)
    task.status = 'completed'
    task.message = '生成完成！'
    tasks.set(taskId, task)
    
  } catch (err) {
    task.status = 'failed'
    task.message = '生成失败：' + err.message
    tasks.set(taskId, task)
  }
}

// AI API 调用（火山引擎 Doubao Seedream 4.0）
async function callAIApi(base64Image, prompt) {
  // 火山引擎 Doubao Seedream 4.0 API 调用
  // 一次生成 1 张包含 9 个表情的 3x3 网格图
  
  const response = await axios.post(
    `${AI_API_URL}/images/generation`,
    {
      model: 'doubao-seedream-4.0',
      prompt: prompt,
      negative_prompt: 'ugly, blurry, low quality, watermark, signature',
      num_images: 1,
      width: 1024,  // 4K 分辨率宽度
      height: 1024, // 4K 分辨率高度 (1:1 宽高比）
      image: base64Image, // 使用 base64 图片
    },
    {
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  return response.data.data[0].url
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

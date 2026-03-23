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

// AI API 配置（硅基流动）
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_API_URL = 'https://api.siliconflow.cn/v1'

// 表情包提示词模板
const EXPRESSION_PROMPTS = [
  'happy smile, cute Q version cartoon',
  'sad crying, cute Q version cartoon',
  'surprised amazed, cute Q version cartoon',
  'angry furious, cute Q version cartoon',
  'thinking pensive, cute Q version cartoon',
  'playful mischievous, cute Q version cartoon',
  'sleepy tired, cute Q version cartoon',
  'love adore, cute Q version cartoon',
]

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

// 发起生成任务
app.post('/api/generate', async (req, res) => {
  try {
    const { file_id, count = 8 } = req.body
    
    if (!file_id) {
      return res.status(400).json({ error: 'file_id required' })
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
    generateImages(task_id, file_id, count)
    
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

// AI生成图片（模拟/实际调用）
async function generateImages(taskId, fileId, count) {
  const task = tasks.get(taskId)
  
  try {
    // 模拟生成过程
    for (let i = 0; i < count; i++) {
      task.progress = ((i + 1) / count) * 100
      task.message = `正在生成第 ${i + 1}/${count} 张...`
      tasks.set(taskId, { ...task })
      
      // 模拟生成延迟
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 这里实际应该调用AI API
      // const result = await callAIApi(fileId, EXPRESSION_PROMPTS[i])
      
      // 暂时使用占位图
      task.results.push(`/uploads/${fileId}.jpg`) // 实际会替换为AI生成的图
    }
    
    task.status = 'completed'
    task.message = '生成完成!'
    tasks.set(taskId, task)
    
  } catch (err) {
    task.status = 'failed'
    task.message = '生成失败'
    tasks.set(taskId, task)
  }
}

// AI API 调用（实际实现）
async function callAIApi(imagePath, prompt) {
  // 硅基流动 API 调用示例
  // 需要先上传图片获取URL，然后调用SD生成
  
  const response = await axios.post(
    `${AI_API_URL}/v1/images/generations`,
    {
      model: 'stabilityai/stable-diffusion-xl-base-1.0',
      prompt: prompt,
      negative_prompt: 'ugly, blurry, low quality',
      image_count: 1,
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

import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { tasks } from '@/lib/tasks'

// AI 配置
const AI_API_KEY = process.env.AI_API_KEY
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://ark.cn-beijing.volces.com/api/coding/v3'
const AI_MODEL = process.env.AI_MODEL || 'ark-code-latest'

// 表情包提示词模板
const EXPRESSION_PROMPTS = [
  'happy smile, cute Q version cartoon avatar, big head small body, anime style',
  'sad crying, cute Q version cartoon avatar, big head small body, anime style',
  'surprised amazed, cute Q version cartoon avatar, big head small body, anime style',
  'angry furious, cute Q version cartoon avatar, big head small body, anime style',
  'thinking pensive, cute Q version cartoon avatar, big head small body, anime style',
  'playful mischievous, cute Q version cartoon avatar, big head small body, anime style',
  'sleepy tired, cute Q version cartoon avatar, big head small body, anime style',
  'love adore, cute Q version cartoon avatar, big head small body, anime style',
]

export async function POST(request: NextRequest) {
  try {
    const { file_id, count = 8, prompt } = await request.json()

    if (!file_id) {
      return NextResponse.json({ error: 'file_id required' }, { status: 400 })
    }

    const task_id = uuidv4()

    // 初始化任务
    tasks.set(task_id, {
      status: 'processing',
      progress: 0,
      results: [],
      message: '准备生成...',
    })

    // 异步生成
    generateImages(task_id, file_id, count, prompt || EXPRESSION_PROMPTS)

    return NextResponse.json({ task_id })
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: 'Generate failed' }, { status: 500 })
  }
}

// AI生成图片
async function generateImages(taskId: string, fileId: string, count: number, prompts: string[]) {
  const task = tasks.get(taskId)

  try {
    for (let i = 0; i < count; i++) {
      task.progress = ((i + 1) / count) * 100
      task.message = `正在生成第 ${i + 1}/${count} 张...`
      tasks.set(taskId, { ...task })

      try {
        // 调用 AI API 生成图片
        const imageUrl = await callAIApi(prompts[i], fileId)
        task.results.push(imageUrl)
      } catch (e) {
        console.error(`Failed to generate image ${i}:`, e)
        // 如果 API 调用失败，使用占位图
        task.results.push(`/uploads/${fileId}.jpg`)
      }

      tasks.set(taskId, { ...task })
    }

    task.status = 'completed'
    task.message = '生成完成!'
    tasks.set(taskId, task)
  } catch (err) {
    console.error('Generate error:', err)
    task.status = 'failed'
    task.message = '生成失败'
    tasks.set(taskId, task)
  }
}

// AI API 调用
async function callAIApi(prompt: string, fileId: string): Promise<string> {
  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY not configured')
  }

  // 使用火山引擎 API（兼容 OpenAI 格式）
  const response = await fetch(`${AI_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AI API error: ${error}`)
  }

  const data = await response.json()
  
  // 检查返回格式
  if (data.data && data.data[0] && data.data[0].url) {
    return data.data[0].url
  }
  
  if (data.data && data.data[0] && data.data[0].b64_json) {
    // 如果返回 base64，需要保存为文件
    return `data:image/png;base64,${data.data[0].b64_json}`
  }

  throw new Error('Invalid response from AI API')
}

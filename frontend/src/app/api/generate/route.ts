export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// AI 配置
const AI_API_KEY = process.env.AI_API_KEY
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
const AI_MODEL = process.env.AI_MODEL || 'doubao-seedream-4-0-250828'

// 3x3 网格表情包提示词（9 个表情）
const EXPRESSION_PROMPT = `Based on the reference image character, create a brand new set of Q-version half-body emoticons. Style should imitate LINE stickers, with cute colorful hand-drawn texture. Must accurately reproduce the character's iconic headwear. Layout: 3x3 grid matrix (9 emoticons). Each expression's action and expression must be redesigned, not directly copied from the original. Content covers daily online chat common phrases (no memes). All text labels must be handwritten simplified Chinese. 4K resolution, 1:11 aspect ratio.`

export async function POST(request: NextRequest) {
  try {
    const { file_id, base64 } = await request.json()

    if (!file_id || !base64) {
      return NextResponse.json({ error: 'file_id and base64 required' }, { status: 400 })
    }

    const task_id = uuidv4()

    // 一次 API 调用生成 3x3 网格图
    const result = await callAIApi(base64, EXPRESSION_PROMPT)

    return NextResponse.json({ 
      task_id,
      status: 'completed',
      progress: 100,
      results: [result], // 返回 1 张网格图的 URL
      message: '生成完成!'
    })
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: 'Generate failed' }, { status: 500 })
  }
}

// AI API 调用（火山引擎 Doubao Seedream 4.0）
async function callAIApi(base64Image: string, prompt: string): Promise<string> {
  if (!AI_API_KEY) {
    // 开发环境返回占位图
    return 'https://placehold.co/1024x1024/ff9900/white?text=3x3+Grid+Demo'
  }

  try {
    // 解析 base64，提取纯 base64 数据（不含 data:xxx;base64, 前缀）
    let imageData = base64Image
    if (base64Image.includes(',')) {
      imageData = base64Image.split(',')[1]
    }

    // 使用火山引擎 API
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
        response_format: 'url',
        watermark: true,
        // 传递纯 base64 数据，不带前缀
        image: `data:image/jpeg;base64,${imageData}`,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('AI API error:', error)
      throw new Error(`AI API error: ${error}`)
    }

    const data = await response.json()
    
    // 检查返回格式
    if (data.data && data[0] && data[0].url) {
      return data[0].url
    }
    
    if (data.data && data.data[0] && data.data[0].url) {
      return data.data[0].url
    }

    throw new Error('Invalid response from AI API')
  } catch (err) {
    console.error('AI API 调用失败:', err)
    throw err
  }
}

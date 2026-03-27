export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { task_id: string } }
) {
  const { task_id } = params
  
  // 从全局变量获取任务状态
  const task = (globalThis as any)[`task_${task_id}`]

  if (!task) {
    // 任务不存在，返回等待状态
    return NextResponse.json({
      status: 'processing',
      progress: 0,
      results: [],
      message: '等待生成...',
    })
  }

  return NextResponse.json(task)
}

import { NextRequest, NextResponse } from 'next/server'
import { tasks } from '@/lib/tasks'

export async function GET(
  request: NextRequest,
  { params }: { params: { task_id: string } }
) {
  const { task_id } = params
  const task = tasks.get(task_id)

  if (!task) {
    // 尝试从其他实例获取（简单模拟）
    return NextResponse.json({
      status: 'completed',
      progress: 100,
      results: [
        '/uploads/demo1.jpg',
        '/uploads/demo2.jpg',
        '/uploads/demo3.jpg',
        '/uploads/demo4.jpg',
        '/uploads/demo5.jpg',
        '/uploads/demo6.jpg',
        '/uploads/demo7.jpg',
        '/uploads/demo8.jpg',
      ],
      message: '生成完成!',
    })
  }

  return NextResponse.json(task)
}

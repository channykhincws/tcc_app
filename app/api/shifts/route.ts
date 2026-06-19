import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ data: shifts })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json()
    const shift = await prisma.shift.create({ data: { name } })
    return NextResponse.json({ data: shift }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 })
  }
}

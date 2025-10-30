import { NextResponse } from "next/server"
  import { prisma } from "@/lib/prisma"

  export async function GET() {
    try {
      const rooms = await prisma.room.findMany({
        orderBy: {
          name: "asc"
        }
      })

      return NextResponse.json(rooms)
    } catch (error) {
      console.error("회의실 조회 에러:", error)
      return NextResponse.json(
        { error: "회의실 조회 중 오류가 발생했습니다" },
        { status: 500 }
      )
    }
  }
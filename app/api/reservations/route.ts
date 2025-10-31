import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 예약 목록 조회
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const reservations = await prisma.reservation.findMany({
      where: {
        ...(startDate && endDate && {
          startTime: {
            gte: new Date(startDate)
          },
          endTime: {
            lte: new Date(endDate)
          }
        })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            lab: true
          }
        },
        room: true
      },
      orderBy: {
        startTime: "asc"
      }
    })

    return NextResponse.json(reservations)
  } catch (error) {
    console.error("예약 조회 에러:", error)
    return NextResponse.json(
      { error: "예약 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// 예약 생성
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const { roomId, startTime, endTime, purpose } = await req.json()

    // 입력 검증
    if (!roomId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "필수 정보를 입력해주세요" },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    // 시간 유효성 검사
    if (start >= end) {
      return NextResponse.json(
        { error: "종료 시간은 시작 시간보다 늦어야 합니다" },
        { status: 400 }
      )
    }

    // 과거 시간 검증
    if (start < new Date()) {
      return NextResponse.json(
        { error: "과거 시간으로 예약할 수 없습니다" },
        { status: 400 }
      )
    }

    // 예약 충돌 검사
    const conflict = await prisma.reservation.findFirst({
      where: {
        roomId,
        OR: [
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } }
            ]
          },
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } }
            ]
          },
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } }
            ]
          }
        ]
      }
    })

    if (conflict) {
      return NextResponse.json(
        { error: "해당 시간에 이미 예약이 있습니다" },
        { status: 409 }
      )
    }

    // 예약 생성
    const reservation = await prisma.reservation.create({
      data: {
        roomId,
        userId: session.user.id,
        startTime: start,
        endTime: end,
        purpose: purpose || ""
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            lab: true
          }
        },
        room: true
      }
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error("예약 생성 에러:", error)
    return NextResponse.json(
      { error: "예약 생성 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}l
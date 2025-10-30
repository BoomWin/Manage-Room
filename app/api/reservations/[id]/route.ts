import { NextResponse } from "next/server"
  import { getServerSession } from "next-auth"
  import { authOptions } from "@/lib/auth"
  import { prisma } from "@/lib/prisma"

  // 예약 삭제
  export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions)

      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "인증이 필요합니다" },
          { status: 401 }
        )
      }

      const { id } = await params

      const reservation = await prisma.reservation.findUnique({
        where: { id }
      })

      if (!reservation) {
        return NextResponse.json(
          { error: "예약을 찾을 수 없습니다" },
          { status: 404 }
        )
      }

      // 본인의 예약만 삭제 가능
      if (reservation.userId !== session.user.id) {
        return NextResponse.json(
          { error: "본인의 예약만 삭제할 수 있습니다" },
          { status: 403 }
        )
      }

      await prisma.reservation.delete({
        where: { id }
      })

      return NextResponse.json({ message: "예약이 삭제되었습니다" })
    } catch (error) {
      console.error("예약 삭제 에러:", error)
      return NextResponse.json(
        { error: "예약 삭제 중 오류가 발생했습니다" },
        { status: 500 }
      )
    }
  }

  // 예약 수정
  export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions)

      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "인증이 필요합니다" },
          { status: 401 }
        )
      }

      const { id } = await params

      const reservation = await prisma.reservation.findUnique({
        where: { id }
      })

      if (!reservation) {
        return NextResponse.json(
          { error: "예약을 찾을 수 없습니다" },
          { status: 404 }
        )
      }

      // 본인의 예약만 수정 가능
      if (reservation.userId !== session.user.id) {
        return NextResponse.json(
          { error: "본인의 예약만 수정할 수 있습니다" },
          { status: 403 }
        )
      }

      const { startTime, endTime, purpose } = await req.json()

      const start = startTime ? new Date(startTime) : reservation.startTime
      const end = endTime ? new Date(endTime) : reservation.endTime

      // 시간 유효성 검사
      if (start >= end) {
        return NextResponse.json(
          { error: "종료 시간은 시작 시간보다 늦어야 합니다" },
          { status: 400 }
        )
      }

      // 충돌 검사 (본인 예약 제외)
      const conflict = await prisma.reservation.findFirst({
        where: {
          id: { not: id },
          roomId: reservation.roomId,
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

      const updated = await prisma.reservation.update({
        where: { id },
        data: {
          ...(startTime && { startTime: start }),
          ...(endTime && { endTime: end }),
          ...(purpose !== undefined && { purpose })
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

      return NextResponse.json(updated)
    } catch (error) {
      console.error("예약 수정 에러:", error)
      return NextResponse.json(
        { error: "예약 수정 중 오류가 발생했습니다" },
        { status: 500 }
      )
    }
  }
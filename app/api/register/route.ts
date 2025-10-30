import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { name, email, password, lab } = await req.json()

    // 입력 검증
    if (!name || !email || !password || !lab) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요" },
        { status: 400 }
      )
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다" },
        { status: 400 }
      )
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10)

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        lab
      },
      select: {
        id: true,
        name: true,
        email: true,
        lab: true,
        createdAt: true
      }
    })

    return NextResponse.json(
      { message: "회원가입이 완료되었습니다", user },
      { status: 201 }
    )
  } catch (error) {
    console.error("회원가입 에러:", error)
    return NextResponse.json(
      { error: "회원가입 처리 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
import { PrismaClient } from '@prisma/client'

  const prisma = new PrismaClient()

  async function main() {
    // 기존 데이터 삭제
    await prisma.reservation.deleteMany()
    await prisma.room.deleteMany()
    await prisma.user.deleteMany()

    // 회의실 생성
    const room = await prisma.room.create({
      data: {
        name: '공동 회의실',
        capacity: 10,
        description: '양자보안연구실과 모바일인터넷보안연구실이 공동으로 사용하는 회의실'
      }
    })

    console.log('✅ 회의실 생성 완료:', room.name)
  }

  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })

import { prisma } from '@/lib/prisma'

export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  })

  return Response.json(users)
}

export async function POST(req: Request) {
  const { email, name, password } = await req.json()

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: password ?? null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  })

  return Response.json(user, { status: 201 })
}
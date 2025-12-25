import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'teacher@codinglive.com'
    const password = await bcrypt.hash('teacher123', 10)

    const teacher = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Enseignant Coding Live',
            password,
            role: Role.TEACHER,
            isBlocked: false,
        },
    })

    console.log({ teacher })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

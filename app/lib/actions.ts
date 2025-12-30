'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        throw error;
    }
}

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';

const CreateUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['TEACHER', 'STUDENT']),
});

export async function createUser(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== 'TEACHER') {
        return { error: 'Unauthorized: Only teachers can create users.' };
    }

    const validatedFields = CreateUserSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
    });

    if (!validatedFields.success) {
        return { error: 'Invalid fields' };
    }

    const { name, email, password, role } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role as Role,
            },
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create user. Email might be taken.' };
    }
}

export async function toggleUserBlock(userId: string, isBlocked: boolean) {
    const session = await auth();
    if (session?.user?.role !== 'TEACHER') {
        throw new Error('Unauthorized');
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isBlocked },
        });
        revalidatePath('/dashboard');
    } catch (error) {
        throw new Error('Failed to update user status');
    }
}

export async function getUsers() {
    const session = await auth();
    if (session?.user?.role !== 'TEACHER') {
        return [];
    }
    return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
    });
}


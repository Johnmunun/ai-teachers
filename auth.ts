import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { User } from "@prisma/client";

async function getUser(email: string): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        throw new Error("Failed to fetch user.");
    }
}

// Configuration de l'URL de base pour NextAuth
const getBaseUrl = () => {
    // Priorité: AUTH_URL > NEXTAUTH_URL > valeur par défaut
    const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
    if (authUrl) {
        try {
            new URL(authUrl); // Valider que c'est une URL valide
            return authUrl;
        } catch {
            console.warn(`Invalid AUTH_URL/NEXTAUTH_URL: ${authUrl}, using default`);
        }
    }
    // Valeur par défaut pour le développement local
    return process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com' // À remplacer en production
        : 'http://localhost:3000';
};

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    trustHost: true, // Permet à NextAuth de faire confiance aux headers de proxy
    basePath: '/api/auth',
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;

                    // Check if blocked
                    if (user.isBlocked) {
                        throw new Error("Account blocked");
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password);

                    if (passwordsMatch) return user;
                }

                console.log("Invalid credentials");
                return null;
            },
        }),
    ],
});

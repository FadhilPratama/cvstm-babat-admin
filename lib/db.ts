import { PrismaClient } from '@/lib/generated/prisma'
declare global {
    var prisma: PrismaClient | undefined;
}

const db = global.globalThis.prisma || new  PrismaClient();
if (process.env.NODE_ENV === 'production') globalThis.prisma = db

export default db
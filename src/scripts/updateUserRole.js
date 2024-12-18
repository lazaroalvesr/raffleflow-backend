import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function updateUserRole() {
    const userId = '40064cc9-6bc0-4411-bbf8-59505ec575a8'; // Substitua pelo ID do usuário
    const newRole = 'ADM'; // Nova role

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        });
        console.log('User updated:', updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateUserRole();
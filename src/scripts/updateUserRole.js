const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUserRole() {
    const userId = process.argv[2]; 
    const newRole = process.argv[3];

    if (!userId || !newRole) {
        console.error('Erro: ID do usuário ou nova role não passados como argumentos');
        return;
    }

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

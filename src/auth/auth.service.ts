import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDTO } from '../dto/auth/RegisterDto';
import { LoginAdminDTO } from '../dto/auth/LoginAdminDTO';
import { MailerService } from '@nestjs-modules/mailer';
import { v4 as uuidv4 } from 'uuid';
import { ChangePasswordDto } from '../dto/auth/ChangePasswordDto';
import { UpdateProfileDTO } from '../dto/auth/UpdateProfileDTO';

@Injectable()
export class AuthService {

    constructor(
        private jwtService: JwtService,
        private readonly prismaService: PrismaService,
        private mailerService: MailerService,
    ) { }

    private formatTelephone(telephone: string): string {
        return telephone.replace(/\D/g, '');
    }

    async login({ email, password }: LoginAdminDTO) {
        try {
            const user = await this.prismaService.user.findFirst({
                where: { email },
            });

            if (!user) {
                throw new BadRequestException('Email ou senha inválido.');
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                throw new BadRequestException('Email ou senha estão inválidos!');
            }

            const { password: _, ...userSemSenha } = user;
            const payload = { sub: user.id, username: user.name, role: user.role };

            const access_token = await this.jwtService.signAsync(payload);

            return { user: userSemSenha, access_token };
        } catch (error) {
            throw new BadRequestException('Email ou senha Inválidos!');
        }
    }

    async register({ name, email, password, telephone, surname }: RegisterDTO) {
        const existingAdmin = await this.prismaService.user.findUnique({
            where: { email },
        });

        if (existingAdmin) {
            throw new BadRequestException('Email já em uso!');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const confirmationToken = uuidv4();
        const formattedTelephone = this.formatTelephone(telephone);

        const user = await this.prismaService.user.create({
            data: {
                name,
                surname,
                email,
                telephone: formattedTelephone,
                password: hashedPassword,
                confirmationToken,
            },
        });

        const mail = {
            to: user.email,
            from: "noreply@rafflemaster.com",
            subject: "Email de confirmação",
            template: "email-confirmation",
            context: {
                token: user.confirmationToken,
            }
        };

        await this.mailerService.sendMail(mail);

        const { password: _, ...userWithoutPassword } = user;

        const accessToken = await this.jwtService.signAsync(userWithoutPassword);

        return { user: userWithoutPassword, access_token: accessToken };
    }

    async getById(id: string) {
        const response = await this.prismaService.user.findFirst({
            where: { id },
            include: {
                tickets: {
                    include: {
                        raffle: {
                            select: {
                                _count: true
                            }
                        }
                    }
                },
            },
        });

        return response;
    }

    async confirmEmail(confirmationToken: string) {
        const user = await this.prismaService.user.findFirst({
            where: { confirmationToken: confirmationToken },
        });

        if (!user) {
            throw new NotFoundException("Token inválido");
        }

        const updatedUser = await this.prismaService.user.update({
            where: { id: user.id },
            data: {
                confirmationToken: confirmationToken
            }
        });
    }

    async updateUser(id: string, userUpdate: UpdateProfileDTO) {
        try {
            const update = await this.prismaService.user.update({
                where: { id },
                data: {
                    name: userUpdate.name,
                    surname: userUpdate.surname,
                    email: userUpdate.email,
                    telephone: userUpdate.telephone
                },
            });

            const payload = { ...update };

            const access_token = await this.jwtService.signAsync(payload);

            return { user: payload, token: access_token };
        } catch (e) {
            throw new InternalServerErrorException("Erro ao atualizar infos do user");
        }
    }

    async sendPasswordResetEmailService(email: string) {
        const user = await this.prismaService.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new NotFoundException("There is no registered user with this email.");
        }

        const resetToken = uuidv4();

        await this.prismaService.user.update({
            where: { id: user.id },
            data: {
                recoverToken: resetToken,
            },
        });

        const mail = {
            to: user.email,
            from: 'noreply@yourdomain.com',
            subject: 'Password Reset Request',
            template: 'recover-password',
            context: {
                name: user.name,
                recoverToken: resetToken
            },
        };

        await this.mailerService.sendMail(mail);

    }

    async changePassword(id: string, changePasswordDTO: ChangePasswordDto) {
        const { password, passwordConfirmation } = changePasswordDTO;

        if (password !== passwordConfirmation) {
            throw new UnprocessableEntityException('As senhas não conferem');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await this.prismaService.user.update({
            where: { id },
            data: {
                password: hashedPassword,
            },
        });
    }

    async resetPassword(recoverToken: string, changePasswordDto: ChangePasswordDto) {
        const { password, passwordConfirmation } = changePasswordDto;

        if (password !== passwordConfirmation) {
            throw new UnprocessableEntityException('As senhas não conferem');
        }

        const user = await this.prismaService.user.findFirst({
            where: { recoverToken },
            select: { id: true },
        });

        if (!user) {
            throw new NotFoundException('Parece que o link para redefinir a senha não é válido ou expirou. Por favor, solicite um novo link.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await this.prismaService.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                recoverToken: null,
            },
        });

        return { message: "Password updated successfully" };
    }

    async usersAll() {
        const users = await this.prismaService.user.findMany({
            select: {
                name: true,
                surname: true,
                email: true,
                telephone: true,
            },
        });

        return users; 
    }

    async deleteUser(id: string) {
        await this.prismaService.user.delete({
            where: { id }
        })

        return { message: "Usuário deletado com sucesso!" }
    }

}

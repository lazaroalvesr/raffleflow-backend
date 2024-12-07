import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAdminDTO } from '../dto/auth/LoginAdminDTO';
import { RegisterDTO } from '../dto/auth/RegisterDto';
import { Public } from '../lib/public.decorator';
import { ChangePasswordDto } from '../dto/auth/ChangePasswordDto';
import { UpdateProfileDTO } from '../dto/auth/UpdateProfileDTO';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from '../lib/AdmGuard';
import { SearchUserDTO } from '../dto/auth/SearchUserDTO';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("login")
    @Public()
    async login(@Body() loginAdminData: LoginAdminDTO) {
        return this.authService.login(loginAdminData)
    }

    @Post("create")
    @Public()
    async create(@Body() CreateAdminData: RegisterDTO) {
        return this.authService.register(CreateAdminData);
    }

    @Patch(":token")
    @Public()
    async confirmEmail(@Param("token") token: string) {
        const user = await this.authService.confirmEmail(token);
        return {
            message: "Email confirmado"
        }
    }

    @Post("/send-recover-email")
    @Public()
    async sendRecoverPasswordEmail(@Body("email") email: string) {
        await this.authService.sendPasswordResetEmailService(email);
        return {
            message: 'Foi enviado um email com instruções para resetar sua senha',
        }
    }

    @Patch("/reset-password/:token")
    @Public()
    async resetPassword(@Param("token") token: string, @Body(ValidationPipe) changePasswordDto: ChangePasswordDto) {
        await this.authService.resetPassword(token, changePasswordDto)
        return {
            message: 'Senha alterada com sucesso',
        };
    }

    @Get("getById/:id")
    async getById(@Param("id") id: string) {
        return await this.authService.getById(id);
    }

    @Patch("editUser/:id")
    @UseGuards(JwtAuthGuard)
    async editInfoUser(@Param("id") id: string, @Body() updateUser: UpdateProfileDTO) {
        return await this.authService.updateUser(id, updateUser)
    }

    // @Get("usersAll")
    // @UseGuards(AdminGuard)
    // @UsePipes(new ValidationPipe({ transform: true }))
    // async usersAll(@Query() filters: SearchUserDTO) {
    //     return await this.authService.usersAll(filters);
    // }

    @Get("usersAll")
    @UseGuards(AdminGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async usersAll(@Query() filters: SearchUserDTO) {
        return this.authService.searchUser(filters);
    }

    @Delete("delete/:id")
    @UseGuards(JwtAuthGuard)
    async deleteUser(@Param("id") id: string) {
        return await this.authService.deleteUser(id)
    }
}

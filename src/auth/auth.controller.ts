import {
  Controller,
  Response,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Param,
  UploadedFile,
  UseInterceptors,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { CreateUserDto } from './../user/dto/create-user.dto';
import { AccessTokenGuard } from './guards/accessToken.guard';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { GoogleGuard } from './guards/google.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleGuard)
  async googleAuth(@Req() req) {}

  @Get('google/redirect')
  @UseGuards(GoogleGuard)
  async googleAuthRedirect(@Req() req, @Res() res) {
    await this.authService.googleAuth(req.user, res);
  }

  @Post('registration')
  @UsePipes(new ValidationPipe())
  @UseInterceptors(FileInterceptor('photo'))
  registration(@Body() createUserDto: CreateUserDto, @UploadedFile() file: Express.Multer.File) {
    
    return this.authService.registration(createUserDto, file);
  }

  @Post('login')
  @UsePipes(new ValidationPipe())
  login(@Body() data: CreateAuthDto) {
    return this.authService.login(data);
  }

  @UseGuards(AccessTokenGuard)
  @Get('logout')
  logout(@Req() req) {
    this.authService.logout(req.user['sub']);
  }

  @Get('token/refresh')
  @UseGuards(RefreshTokenGuard)
  refreshTokens(@Req() req) {
    return this.authService.refreshTokens(req.user);
  }

  @Get('verify/:id/:token')
  async verify(@Response() res, @Param('token') token: string) {
    const user = await this.authService.activate(token);
    if (user) {
      return res.redirect(`${this.configService.get('CLIENT_URL')}#/sign-in`);
    }
  }

  @Get('token/refresh/refresh-login')
  @UseGuards(RefreshTokenGuard)
  refreshTokensLogin(@Req() req) {
    return this.authService.refreshTokensLogin(req.user);
  }

  @Post('send/message/recover-password')
  sendMessageForRecoverPassword(@Body() { email }: { email: string }) {
    return this.authService.sendMessageForRecoverPassword(email);
  }

  @Post('recover/user-password')
  recoverUserPassword(@Body() { token, password }: { token: string; password: string }) {
    return this.authService.recoverUserPassword(token, password);
  }
}

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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { AccessTokenGuard } from './guards/accessToken.guard';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { GoogleGuard } from './guards/google.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleGuard)
  async googleAuth(@Req() req) {}

  @Get('google/redirect')
  @UseGuards(GoogleGuard)
  googleAuthRedirect(@Req() req) {
    return this.authService.getUserFromGoogleAuth(req.user);
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

  @Get('refresh')
  @UseGuards(RefreshTokenGuard)
  refreshTokens(@Req() req) {
    return this.authService.refreshTokens(req.user);
  }

  @Get('verify/:id/:token')
  async verify(@Response() res, @Param('token') token: string) {
    const user = await this.authService.activate(token);
    if (user) {
      return res.redirect('https://nestjs.com/');
    }
  }

  @Get('refresh-login')
  @UseGuards(RefreshTokenGuard)
  refreshTokensLogin(@Req() req) {
    return this.authService.refreshTokensLogin(req.user);
  }
}

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
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { AccessTokenGuard } from './guards/accessToken.guard';
import { RefreshTokenGuard } from './guards/refreshToken.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('registration')
  @UsePipes(new ValidationPipe())
  registration(@Body() createUserDto: CreateUserDto) {
    return this.authService.registration(createUserDto);
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

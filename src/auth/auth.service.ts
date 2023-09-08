import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UserRequest } from './types';
import { mapToUserProfile } from './mappers';
import { RefreshTokenService } from './refreshToken.service';
import * as argon2 from 'argon2';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private refreshTokenService: RefreshTokenService,
    private configService: ConfigService,
  ) {}

  async registration(createUserDto: CreateUserDto): Promise<any> {
    const userExists = await this.userService.findOneByEmail(
      createUserDto.email,
    );
    if (userExists) {
      throw new BadRequestException('User already exists');
    }
    const hash = await argon2.hash(createUserDto.password);
    const newUser = await this.userService.create({
      ...createUserDto,
      password: hash,
    });
    const tokens = await this.refreshTokenService.getTokens(
      newUser.id,
      newUser.email,
    );
    await this.refreshTokenService.create({
      user: newUser,
      token: tokens.refreshToken,
    });

    if (!createUserDto.isEmailConfirmed) {
      const link = `${this.configService.get('BASE_URL')}/auth/verify/${
        newUser.id
      }/${tokens.refreshToken}`;

      await this.verifyEmail(newUser.email, link);
    }
    return { ...tokens, user: mapToUserProfile(newUser) };
  }

  async login(data: CreateAuthDto) {
    const findUser = await this.userService.findOneByEmail(data.email);
    if (!findUser) throw new BadRequestException('User does not exist');
    const passwordMatches = await argon2.verify(
      findUser.password,
      data.password,
    );
    if (!passwordMatches)
      throw new BadRequestException('Password is incorrect');
    const tokens = await this.refreshTokenService.getTokens(
      findUser.id,
      findUser.email,
    );
    await this.refreshTokenService.create({
      user: findUser,
      token: tokens.refreshToken,
    });
    return { ...tokens, user: mapToUserProfile(findUser) };
  }

  getUserFromGoogleAuth(user: any) {
    if (!user) {
      throw new BadRequestException('No user from google');
    }

    return {
      ...user,
      isEmailConfirmed: true,
    };
  }

  logout(userId: number) {
    return this.refreshTokenService.removeToken(userId);
  }

  refreshTokens(user: UserRequest) {
    return this.refreshTokenService.refreshTokens(user);
  }

  async refreshTokensLogin(userData: UserRequest) {
    const findUser = await this.userService.findOneById(userData.sub);
    const tokens = await this.refreshTokens(userData);
    const user = mapToUserProfile(findUser);
    return { user, tokens };
  }

  async verifyEmail(to: string, link: string) {
    try {
      const transporter = nodemailer.createTransport({
        host: this.configService.get('EMAIL_HOST'),
        port: this.configService.get('EMAIL_PORT'),
        service: 'gmail',
        secure: true,
        auth: {
          user: this.configService.get('EMAIL_USER'),
          pass: this.configService.get('EMAIL_PASS'),
        },
        from: this.configService.get('EMAIL_USER'),
      });

      await transporter.sendMail({
        from: this.configService.get('EMAIL_USER'),
        to,
        subject: 'Activation an account' + this.configService.get('BASE_URL'),
        text: '',
        html: `
        <div>
          <h1>For activation, follow the link</h1>
          <a href='${link}'>${link}</a>
        </div>
        `,
      });
    } catch (e) {
      console.error(e);
    }
  }

  async activate(activationLink: string) {
    return await this.userService.confirmEmailAddress(activationLink);
  }
}

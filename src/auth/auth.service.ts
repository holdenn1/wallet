import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UserDataFromGoogle, UserRequest } from './types';
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

  async registration(
    createUserDto: CreateUserDto,
    userPhoto: Express.Multer.File,
  ): Promise<any> {
    try {
      const userExists = await this.userService.findOneUserByEmail(
        createUserDto.email,
      );
      if (userExists) {
        throw new BadRequestException('User already exists');
      }
      const hash = await argon2.hash(createUserDto.password);

      const avatar = await this.userService.uploadAvatar(userPhoto);

      const userWithPhotoAndHashPassword = {
        ...createUserDto,
        password: hash,
        photo: avatar,
      };
      const newUser = await this.userService.create(
        userWithPhotoAndHashPassword,
      );
      const tokens = await this.refreshTokenService.getTokens(
        newUser.id,
        newUser.email,
      );
      await this.refreshTokenService.create({
        user: newUser,
        token: tokens.refreshToken,
      });

      const link = `${this.configService.get('BASE_URL')}/auth/verify/${
        newUser.id
      }/${tokens.refreshToken}`;

      await this.verifyEmail(newUser.email, link);

      return { ...tokens, user: mapToUserProfile(newUser) };
    } catch {
      throw new BadRequestException('An error occurred');
    }
  }

  async login(data: CreateAuthDto) {
    try {
      const findUser = await this.userService.findOneUserByEmail(data.email);
      if (!findUser) throw new BadRequestException('User does not exist');
      const passwordMatches = await argon2.verify(
        findUser.password,
        data.password,
      );
      if (!passwordMatches) {
        throw new BadRequestException('Password is incorrect');
      }

      const tokens = await this.refreshTokenService.getTokens(
        findUser.id,
        findUser.email,
      );
      await this.refreshTokenService.create({
        user: findUser,
        token: tokens.refreshToken,
      });
      return { ...tokens, user: mapToUserProfile(findUser) };
    } catch {
      throw new BadRequestException('An error occurred');
    }
  }

  async googleAuth(userDataFromGoogle: UserDataFromGoogle, res) {
    try {
      if (!userDataFromGoogle) {
        throw new BadRequestException('No user from google');
      }

      const user = await this.userService.findOneUserByEmail(
        userDataFromGoogle.email,
      );

      const createGoogleUser: CreateUserDto = {
        email: userDataFromGoogle.email,
        firstName: userDataFromGoogle.firstName,
        lastName: userDataFromGoogle.lastName,
        photo: userDataFromGoogle.picture ?? null,
        isEmailConfirmed: true,
        password: null,
        birthday: null,
      };

      const userData = user
        ? user
        : await this.userService.create(createGoogleUser);

      const userDataTokens = await this.refreshTokenService.getTokens(
        userData.id,
        userData.email,
      );

      await this.refreshTokenService.create({
        user: userData,
        token: userDataTokens.refreshToken,
      });

      res.cookie(
        'userData',
        { ...userDataTokens, user: mapToUserProfile(userData) },
        { maxAge: 3600000 },
      );
      res.redirect(`${this.configService.get('CLIENT_URL')}#/`);
    } catch {
      throw new BadRequestException('An error occurred');
    }
  }

  logout(userId: number) {
    return this.refreshTokenService.removeToken(userId);
  }

  refreshTokens(user: UserRequest) {
    return this.refreshTokenService.refreshTokens(user);
  }

  async refreshTokensLogin(userData: UserRequest) {
    try {
      const findUser = await this.userService.findOneUserById(userData.sub);
      const tokens = await this.refreshTokens(userData);
      const user = mapToUserProfile(findUser);
      return { user, tokens };
    } catch {
      throw new BadRequestException('An error occurred');
    }
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
      throw new BadRequestException('An error occurred');
    }
  }

  async activate(userId: number) {
    return await this.userService.confirmEmailAddress(userId);
  }
}

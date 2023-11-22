import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from './../user/dto/create-user.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { DecodedToken, UserDataFromGoogle, UserRequest } from './types';
import { mapToUserProfile } from './mappers';
import { RefreshTokenService } from './refreshToken.service';
import * as argon2 from 'argon2';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private refreshTokenService: RefreshTokenService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async registration(dto: CreateUserDto, userPhoto: Express.Multer.File): Promise<any> {
    const userExists = await this.userService.findOneUserByEmail(dto.email);

    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const hash = await argon2.hash(dto.password);

    const avatar = await this.userService.uploadAvatar(userPhoto);

    const userWithPhotoAndHashPassword = {
      ...dto,
      password: hash,
      photo: avatar,
    };
    const newUser = await this.userService.create(userWithPhotoAndHashPassword);

    const tokens = await this.generateTokens(newUser);

    const link = `${this.configService.get('BASE_URL')}/auth/verify/${newUser.id}/${tokens.accessToken}`;

    await this.verifyEmail(newUser.email, link);

    return { ...tokens, user: mapToUserProfile(newUser) };
  }

  async login(dto: CreateAuthDto) {
    const findUser = await this.userService.findOneUserByEmail(dto.email);

    if (!findUser) throw new BadRequestException('User does not exist');

    if (!findUser.password) {
      throw new ForbiddenException('The password is not correct');
    }

    const passwordMatches = await argon2.verify(findUser.password, dto.password);

    if (!passwordMatches) {
      throw new BadRequestException('Password is incorrect');
    }

    const tokens = await this.generateTokens(findUser);

    return { ...tokens, user: mapToUserProfile(findUser) };
  }

  async googleAuth(userDataFromGoogle: UserDataFromGoogle, res) {
    if (!userDataFromGoogle) {
      throw new BadRequestException('No user from google');
    }

    const user = await this.userService.findOneUserByEmail(userDataFromGoogle.email);

    const createGoogleUser: CreateUserDto = {
      email: userDataFromGoogle.email,
      firstName: userDataFromGoogle.firstName,
      lastName: userDataFromGoogle.lastName,
      photo: userDataFromGoogle.picture ?? null,
      isEmailConfirmed: true,
      password: null,
      birthday: null,
    };

    const userData = user ? user : await this.userService.create(createGoogleUser);

    const tokens = await this.generateTokens(userData);

    // res.cookie('userData', { ...tokens, user: mapToUserProfile(userData) }, { maxAge: 3600000 });
    res.redirect(`${this.configService.get('CLIENT_URL')}#/?token=${tokens.refreshToken}`);
  }

  logout(userId: number) {
    return this.refreshTokenService.removeToken(userId);
  }

  refreshTokens(user: UserRequest) {
    return this.refreshTokenService.refreshTokens(user);
  }

  async refreshTokensLogin(userData: UserRequest) {
    try {
      const findUser = await this.userService.getUserWithCreditCard(userData.sub);
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
          <a href='${link}'>Activate account</a>
        </div>
        `,
      });
    } catch (e) {
      throw new BadRequestException('An error occurred');
    }
  }

  async sendMessageForRecoverPassword(userEmail: string) {
    const user = await this.userService.findOneUserByEmail(userEmail);
    if (!user) {
      throw new BadRequestException('User does not exist');
    }

    const tokens = await this.generateTokens(user);

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
      to: userEmail,
      subject: 'Recover password',
      text: '',
      html: `
      <div>
        <h1>For recover password, follow the link</h1>
        <h3><a href='${this.configService.get('CLIENT_URL')}#/recover-password?token=${
          tokens.accessToken
        }'>Recover password</a></h3> 
      </div>
      `,
    });
  }

  async activate(token: string) {
    const decodedToken = this.jwtService.decode(token) as DecodedToken;

    if (!decodedToken.email || !decodedToken.sub) {
      throw new BadRequestException('Token is invalid');
    }

    const user = await this.userService.findOneUserByEmail(decodedToken.email);

    if (!user) {
      throw new BadRequestException('Uncorrected link');
    }

    const updatedUser = await this.userService.updateUser(decodedToken.sub, {
      isEmailConfirmed: true,
    });

    return mapToUserProfile(updatedUser);
  }

  async recoverUserPassword(token: string, password: string) {
    const decodedToken = this.jwtService.decode(token) as DecodedToken;

    if (!decodedToken.email || !decodedToken.sub) {
      throw new BadRequestException('Token is invalid');
    }

    const user = await this.userService.findOneUserByEmail(decodedToken.email);

    if (!user) {
      throw new BadRequestException('User does not exist');
    }

    const hashPassword = await argon2.hash(password);

    const updatedUser = await this.userService.updateUser(decodedToken.sub, {
      password: hashPassword,
    });

    return mapToUserProfile(updatedUser);
  }

  async generateTokens(user: User) {
    const tokens = await this.refreshTokenService.getTokens(user.id, user.email);

    await this.refreshTokenService.create({
      user,
      token: tokens.refreshToken,
    });

    return tokens;
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UserRequest } from './types';
import * as argon2 from 'argon2';
import { mapToUserProfile } from './mappers';
import { RefreshTokenService } from './refreshToken.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private refreshTokenService: RefreshTokenService,
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

  logout(userId: number) {
    return this.refreshTokenService.removeToken(userId);
  }

  async refreshTokens(user: UserRequest) {
    return this.refreshTokenService.refreshTokens(user);
  }

  async refreshTokensLogin(userData: UserRequest) {
    const findUser = await this.userService.findOneById(userData.sub);
    const tokens = await this.refreshTokens(userData);
    const user = mapToUserProfile(findUser);
    return { user, tokens };
  }
}

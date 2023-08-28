import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    return await this.userRepository.save(dto);
  }

  async findOneById(id: number) {
    return await this.userRepository.findOne({
      where: { id },
    });
  }

  async findOneByEmail(email: string) {
    return await this.userRepository.findOne({
      where: {
        email: email,
      },
    });
  }

  async confirmEmailAddress(link: string) {
    const user = await this.userRepository.findOne({
      relations: { refreshTokens: true },
      where: { refreshTokens: { refreshToken: link } },
    });
    if (!user) {
      throw new BadRequestException('Uncorrected link');
    }
    user.isEmailConfirmed = true;
    return await this.userRepository.save(user);
  }
}

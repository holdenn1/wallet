import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from 'src/firebase';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    return await this.userRepository.save(dto);
  }

  async findOneUserById(id: number) {
    return await this.userRepository.findOne({
      where: { id },
    });
  }

  async findOneUserByEmail(email: string) {
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

  async updateUser(id: number, dto: Partial<UpdateUserDto>) {
    const user = await this.findOneUserById(id);
    user.firstName = dto.firstName ?? user.firstName;
    user.lastName = dto.lastName ?? user.lastName;
    user.photo = dto.photo ?? user.photo;
    return this.userRepository.save({ ...user });
  }

  async uploadAvatar(cover: Express.Multer.File, userId?: number) {
    const user = await this.findOneUserById(userId);
    const metadata = { contentType: 'image/jpeg' };
    const storageRef = ref(storage, 'images/' + cover.originalname);
    const uploadBook = uploadBytesResumable(storageRef, cover.buffer, metadata);

    await new Promise((res, rej) => {
      uploadBook.on('state_changed', null, rej, res as () => void);
    });

    const downloadURL = await getDownloadURL(uploadBook.snapshot.ref);
    if (user) {
      await this.updateUser(userId, { photo: downloadURL });
    }
    return downloadURL;
  }
}

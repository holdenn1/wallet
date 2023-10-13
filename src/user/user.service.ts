import { Injectable } from '@nestjs/common';
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


  async updateUser(id: number, dto: Partial<UpdateUserDto>) {
    const user = await this.findOneUserById(id);
    user.firstName = dto.firstName ?? user.firstName;
    user.lastName = dto.lastName ?? user.lastName;
    user.photo = dto.photo ?? user.photo;
    user.password = dto.password ?? user.password
    user.isEmailConfirmed = dto.isEmailConfirmed ?? user.isEmailConfirmed
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

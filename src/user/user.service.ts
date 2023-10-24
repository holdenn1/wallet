import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from 'src/firebase';
import { PaymentMethod, TypeOperation } from '@/transactions/types';
import { CreditCard } from './entities/creditCard.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CreditCard)
    private creditCardRepository: Repository<CreditCard>,
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
    user.password = dto.password ?? user.password;
    user.isEmailConfirmed = dto.isEmailConfirmed ?? user.isEmailConfirmed;
    // user.cash = dto.cash ?? user.cash //!don't forget about updateUserDto
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

  async updateUserBalance(
    userId: number,
    amount: number,
    paymentMethod: PaymentMethod,
    bank: string,
    typeOperation: TypeOperation,
  ) {
    if (paymentMethod === PaymentMethod.CASH) {
      return await this.updateUserCash(userId, typeOperation, amount);
    }
    if (paymentMethod === PaymentMethod.CREDIT_CARD) {
      return await this.updateUserBalance(userId, amount, paymentMethod, bank, typeOperation);
    }
  }

  async updateUserCash(userId: number, operationType: TypeOperation, amount: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    switch (operationType) {
      case TypeOperation.COST: {
        if (user.cash < amount) {
          throw new BadRequestException('Insufficient funds');
        }
        user.cash = user.cash - amount;
        return await this.userRepository.save(user);
      }
      case TypeOperation.INCOME: {
        user.cash = user.cash + amount;
        return await this.userRepository.save(user);
      }
      case TypeOperation.TRANSFER: {
        if (user.cash < amount) {
          throw new BadRequestException('Insufficient funds');
        }
        user.cash = user.cash - amount;
        return await this.userRepository.save(user);
      }

      default: {
        return operationType;
      }
    }
  }

  async updateUserCreditCardBalance(
    userId: number,
    amount: number,
    bank: string,
    operationType: TypeOperation,
  ) {
    const creditCard = await this.creditCardRepository.findOne({
      relations: { user: true },
      where: { user: { id: userId }, bankName: bank },
    });

    if (!creditCard) {
      throw new BadRequestException('Credit card not found');
    }

    switch (operationType) {
      case TypeOperation.COST: {
        if (creditCard.balance < amount) {
          throw new BadRequestException('Insufficient funds');
        }
        creditCard.balance = creditCard.balance - amount;
        return await this.creditCardRepository.save(creditCard);
      }
      case TypeOperation.INCOME: {
        creditCard.balance = creditCard.balance + amount;
        return await this.creditCardRepository.save(creditCard);
      }
      case TypeOperation.TRANSFER: {
        if (creditCard.balance < amount) {
          throw new BadRequestException('Insufficient funds');
        }
        creditCard.balance = creditCard.balance - amount;
        return await this.creditCardRepository.save(creditCard);
      }

      default: {
        return operationType;
      }
    }
  }
}

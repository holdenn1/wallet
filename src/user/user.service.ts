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
import {
  Banks,
  UpdateUserBalanceDataType,
  UpdateUserCashBalanceData,
  UpdateUserCreditCardBalanceData,
} from './types';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';

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
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new BadRequestException('User does not exist');
    }

    return user;
  }

  async getUserWithCreditCard(id: number) {
    const user = await this.userRepository.findOne({
      relations: { creditCard: true },
      where: { id },
    });

    if (!user) {
      throw new BadRequestException('User does not exist');
    }

    return user;
  }

  async findOneUserByEmail(email: string) {
    return await this.userRepository.findOne({
      relations: { creditCard: true },
      where: {
        email: email,
      },
    });
  }

  checkIsBankExist(bankName: string) {
    const BANKS = ['MonoBank', 'OschadBank', 'PrivatBank'];

    if (!BANKS.includes(bankName)) {
      throw new BadRequestException(`${bankName} is not supported`);
    }
  }

  async getUserCreditCard(cardId: number) {
    
    if(!cardId){
      throw new BadRequestException(`Card does not exist`)
    }
    return await this.creditCardRepository.findOne({
      where: { id: cardId },
    });
  }

  async getCreditCardByName(userId: number, bankName: string) {
    return await this.creditCardRepository.findOne({
      relations: { user: true },
      where: { bankName, user: { id: userId } },
    });
  }
  async updateUser(id: number, dto: Partial<UpdateUserDto>) {
    
    const user = await this.findOneUserById(id);
    user.firstName = dto.firstName ?? user.firstName;
    user.lastName = dto.lastName ?? user.lastName;
    user.photo = dto.photo ?? user.photo;
    user.password = dto.password ?? user.password;
    user.isEmailConfirmed = dto.isEmailConfirmed ?? user.isEmailConfirmed;
    user.cash = dto.cash ?? user.cash;
    return this.userRepository.save(user);
  }

  async updateCreditCardBalance( cardId: number, currentBalance: number) {
    const creditCard = await this.getUserCreditCard(cardId);

    creditCard.balance = currentBalance ?? creditCard.balance;

    return await this.creditCardRepository.save(creditCard);
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

  async updateUserBalance(data: UpdateUserBalanceDataType) {
    const { amount, cardId, paymentMethod, typeOperation, userId } = data;
    if (paymentMethod === PaymentMethod.CASH) {
      return await this.updateUserCash({ amount, typeOperation, userId });
    }
    if (paymentMethod === PaymentMethod.CREDIT_CARD) {
      return await this.updateUserCreditCardBalance({ amount, typeOperation, userId, cardId });
    }
  }

  async updateUserCash(data: UpdateUserCashBalanceData) {
    const { userId, amount, typeOperation } = data;

    const user = await this.findOneUserById(userId);

    switch (typeOperation) {
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
        return null;
      }
    }
  }

  async updateUserCreditCardBalance(data: UpdateUserCreditCardBalanceData) {
    const { userId, cardId, amount, typeOperation } = data;

    const creditCard = await this.getUserCreditCard(cardId);

    this.checkIsBankExist(creditCard.bankName);

    if (!creditCard) {
      throw new BadRequestException('Credit card not found');
    }

    switch (typeOperation) {
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
        throw new BadRequestException(`${typeOperation} operation type not found`);
      }
    }
  }

  async addCreditCard(userId: number, { balance, bankName }: CreateCreditCardDto) {
    const user = await this.findOneUserById(userId);

    this.checkIsBankExist(bankName);

    const creditCard = await this.getCreditCardByName(userId, bankName);

    if (creditCard) {
      throw new BadRequestException(`User already has ${bankName} credit card  `);
    }

    return await this.creditCardRepository.save({
      balance: +balance,
      bankName,
      user,
      bankIcon: 'fa-credit-card',
      bankBackgroundColor: 'background-color: #2a52ca;',
    });
  }

  async correctUserCashBalance(userId: number, correctBalance: number) {
    const user = await this.findOneUserById(userId);

    if (correctBalance > user.cash) {
      const amountOperation = correctBalance - user.cash;

      return await this.updateUserCash({
        userId,
        amount: amountOperation,
        typeOperation: TypeOperation.INCOME,
      });
    }
  }
}

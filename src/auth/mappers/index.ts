import { User } from 'src/user/entities/user.entity';
import { UserToProfile } from 'src/user/types';

export const mapToUserProfile = (user: User): UserToProfile => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  photo: user.photo,
  birthday: user.birthday,
  cash: user.cash,
  creditCard: user.creditCard,
  isEmailConfirmed: user.isEmailConfirmed,
});


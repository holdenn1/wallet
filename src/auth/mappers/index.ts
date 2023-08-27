import { User } from 'src/user/entities/user.entity';

export const mapToUserProfile = (user: User): any => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  age: user.age,
  cash: user.cash,
  photo: user.photo,
  email: user.email,
});

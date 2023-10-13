import {User} from "@/user/entities/user.entity";

export const mapToUserProfile = (user: User): any => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  photo: user.photo,
  birthday: user.birthday,
  cash: user.cash,
  isEmailConfirmed: user.isEmailConfirmed,
});
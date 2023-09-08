import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class CreateUserDto {
  @Matches(/^(?!\s)[^\s].*$/, { message: 'First name is a required field' })
  firstName: string;

  @Matches(/^(?!\s)[^\s].*$/, { message: 'Last name is a required field' })
  lastName: string;

  photo: string;

  @IsString()
  age: string;

  @IsEmail()
  email: string;

  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/, {
    message:
      'Password is required field.' +
      'Password must contain at least six characters.' +
      'Password must contain a letter, a number and one special character',
  })
  password: string;

  @IsOptional()
  isEmailConfirmed: boolean;
}

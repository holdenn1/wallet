import {IsEmail, Matches} from "class-validator";

export class CreateAuthDto {
  @IsEmail()
  email: string;

  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/, {
    message:
      'Password is required field.\n' +
      'Password must contain at least six characters.\n' +
      'Password must contain a letter, a number and one special character',
  })
  password: string;
}
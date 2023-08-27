import { User } from "src/user/entities/user.entity"

export class CreateTokenDto{
  user: User
  token: string
}
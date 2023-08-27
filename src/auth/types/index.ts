export type JwtPayload = {
  sub: number;
  email: string;
};

export type UserRequest = JwtPayload & {
  refreshToken?: string;
  [key: string]: any;
};
export type JwtPayload = {
  sub: number;
  email: string;
};

export type DecodedToken = JwtPayload & {[key: string]: any;}

export type UserRequest = JwtPayload & {
  refreshToken?: string;
  [key: string]: any;
};

export type UserDataFromGoogle = {
  email: string;
  firstName: string;
  lastName: string;
  picture: string | undefined;
  [key: string]: any
};

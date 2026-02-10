import { User } from "./user.interface";


export type LoginResponse =
  | { user: User; requires2fa: false }
  | { requires2fa: true; challengeId: string };
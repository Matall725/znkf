import { compare } from 'bcryptjs';

export interface PasswordVerifier {
  verify(plainTextPassword: string, passwordHash: string): Promise<boolean>;
}

export class BcryptPasswordVerifier implements PasswordVerifier {
  verify(plainTextPassword: string, passwordHash: string): Promise<boolean> {
    return compare(plainTextPassword, passwordHash);
  }
}

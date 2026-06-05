import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../utils/prisma';
import { env } from '../../config/env';
import logger from '../../utils/logger';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

export interface RegisterResult {
  id: string;
  email: string;
  createdAt: Date;
}

export interface LoginResult {
  token: string;
  expiresIn: string;
}

export async function register(email: string, password: string): Promise<RegisterResult> {
  logger.info('Registering new user', { email });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  logger.info('User registered successfully', { userId: user.id, email: user.email });

  return user;
}

export async function login(email: string, password: string): Promise<LoginResult | null> {
  logger.info('Login attempt', { email });

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    logger.warn('Login failed: user not found', { email });
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    logger.warn('Login failed: invalid password', { email });
    return null;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  logger.info('User logged in successfully', { userId: user.id, email: user.email });

  return {
    token,
    expiresIn: TOKEN_EXPIRY,
  };
}

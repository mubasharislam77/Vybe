import { z } from 'zod';
import { pakistaniPhoneSchema } from './common';

export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .max(200)
  .regex(/[A-Za-z]/, 'Must include a letter')
  .regex(/[0-9]/, 'Must include a number');

export const customerRegisterSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phoneE164: pakistaniPhoneSchema,
  email: z.email().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  password: passwordSchema,
});

export const customerLoginSchema = z.object({
  identifier: z.string().trim().min(3), // phone or email
  password: z.string().min(1),
});

export const staffLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

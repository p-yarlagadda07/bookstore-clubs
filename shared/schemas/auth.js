import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(200);
const password = z.string().min(8).max(200);

export const LoginBody = z.object({
  email,
  password: z.string().min(1).max(200),
});

// used in later steps
export const SignupBody = z.object({ name: z.string().trim().min(1).max(80), email, password });
export const ForgotBody = z.object({ email });
export const ResetBody = z.object({ token: z.string().min(10), password });

'use server'

import { signIn } from '@/app/api/auth/[...nextauth]/route';

export async function authenticate(email, password) {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true, result };
  } catch (error) {
    const message = error.cause?.err?.message?.split('. Read more')[0] || 
                 error.message?.split('. Read more')[0] || 
                 'Unknown error';

    return {
      error: error.cause?.err?.type || error.type,
      message
    };
  }
}

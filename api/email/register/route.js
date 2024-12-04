import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';
export async function POST(request) {
  try {
    const { email, code, password } = await request.json();

    // Verify code first
    const { data: verificationCode, error: verifyError } = await supabaseAdmin()
      .from('verification_codes')
      .select()
      .eq('email', email)
      .eq('code', code)
      .eq('type', 'register')
      .gt('expires', new Date().toISOString())
      .single();

    if (verifyError || !verificationCode) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin()
      .from('users')
      .select()
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const { error: createError } = await supabaseAdmin()
      .from('users')
      .insert([{
        email,
        password_hash: hashedPassword,
        email_verified: new Date().toISOString(),
      }]);

    if (createError) throw createError;

    // Mark verification code as used
    await supabaseAdmin()
      .from('verification_codes')
      .update({ used: true })
      .eq('id', verificationCode.id);

    return NextResponse.json({
      success: true,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Error in registration:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
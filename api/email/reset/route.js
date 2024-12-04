import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';
export async function POST(request) {
  try {
    const { email, code, password, type = 'reset' } = await request.json();

    // 只验证验证码是否匹配且未过期，不检查 used 状态
    const { data: verificationCode, error: verifyError } = await supabaseAdmin()
      .from('verification_codes')
      .select()
      .eq('email', email)
      .eq('code', code)
      .eq('type', type)
      .gt('expires', new Date().toISOString())
      .single();

    if (verifyError || !verificationCode) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    const { error: updateError } = await supabaseAdmin()
      .from('users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (updateError) throw updateError;

    // Mark verification code as used
    await supabaseAdmin()
      .from('verification_codes')
      .update({ used: true })
      .eq('id', verificationCode.id);

    return NextResponse.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
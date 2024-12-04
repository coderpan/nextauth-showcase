import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { email, code, type = 'register' } = await request.json();

    // Verify code
    const { data: verificationCode, error } = await supabaseAdmin()
      .from('verification_codes')
      .select()
      .eq('email', email)
      .eq('code', code)
      .eq('type', type)
      .eq('used', false)
      .gt('expires', new Date().toISOString())
      .single();

    if (error || !verificationCode) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Mark code as used
    await supabaseAdmin()
      .from('verification_codes')
      .update({ used: true })
      .eq('id', verificationCode.id);

    return NextResponse.json({
      success: true,
      message: 'Verification successful'
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
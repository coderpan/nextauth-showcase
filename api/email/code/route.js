import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase';
import { html, text } from '@/lib/email-templates/verification-code';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    // 验证请求体
    const body = await request.json();
    
    if (!body?.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const { email, type = 'register' } = body;

    // 验证 email 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 如果是注册，检查邮箱是否已存在
    if (type === 'register') {
      const { data: existingUser, error: checkError } = await supabaseAdmin()
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 是未找到数据的错误码
        console.error('Database error:', checkError);
        return NextResponse.json(
          { error: 'Failed to check email' },
          { status: 500 }
        );
      }
    }

    // 生成验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 存储验证码
    const { error: dbError } = await supabaseAdmin()
      .from('verification_codes')
      .insert([{
        email,
        code,
        type,
        expires,
      }]);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to store verification code' },
        { status: 500 }
      );
    }

    // 准备邮件内容
    const emailHtml = html({ code, email, type });
    const emailText = text({ code, email, type });

    // 发送邮件
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: type === 'register' ? 'Verification Code - EasyMusic' : 'Reset Password - EasyMusic',
      html: emailHtml,
      text: emailText,
    });

    if (emailError) {
      console.error('Email service error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent'
    });

  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
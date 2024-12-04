import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/microsoft-entra-id';
import { SupabaseAdapter } from '@/lib/supabaseAdapter';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPassword } from '@/lib/auth';
import { 
  CredentialsSignin, 
  AccountNotLinked,
  EmailSignInError,
  AdapterError
} from '@auth/core/errors';

let isSignInCallback = false;

export const runtime = 'edge';

export const authOptions = {
  adapter: SupabaseAdapter(),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // 验证输入
          if (!credentials?.email || !credentials?.password) {
            throw new CredentialsSignin("Invalid credentials");
          }

          // 查询用户
          const { data: userlist, error } = await supabaseAdmin()
            .from('users')
            .select('*')
            .eq('email', credentials.email);

          if (error) {
            throw new AdapterError("Database error");
          }

          if (!userlist || userlist.length === 0) {
            throw new CredentialsSignin("Invalid credentials");
          }
          const user = userlist[0];

          // 检查是否是第三方登录用户
          if (!user.password_hash) {
            throw new AccountNotLinked(
              "This email is associated with a different sign-in method"
            );
          }

          // 验证密码
          const isValid = await verifyPassword(
            credentials.password,
            user.password_hash
          );

          if (!isValid) {
            throw new CredentialsSignin("Invalid credentials");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar_url,
            role: user.role
          };
        } catch (error) {
          console.log('authorize error:', error);
          
          // 重新抛出 AuthError 类型的错误
          if (error.type) {
            throw error;
          }
          
          // 将未知错误包装为 CredentialsSignin
          throw new CredentialsSignin(
            "An unexpected error occurred during sign in"
          );
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      },
      allowDangerousEmailAccountLinking: true
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: { params: { scope: "openid profile email" } },
      allowDangerousEmailAccountLinking: true
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/signin',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,    // 24 hours
  },
  callbacks: {
    async signIn({ user, account, profile, isNewUser }) {
      //console.log('signIn:', user, account, profile, isNewUser);
      isSignInCallback = true;
      return true;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isNewUser = isNewUser;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        //console.log('session:', session, token);
        session.user.id = token.id;
        session.user.role = token.role;
        session.accessToken = token.accessToken;
        session.user.isNewUser = token.isNewUser
        session.user.name = token.name || token.email?.split('@')[0] || 'User';

        // 在这里存储会话数据到数据库
        // try {
        //   const adapter = SupabaseAdapter();
        //   await adapter.createSession({
        //     sessionToken: session.sessionToken || token.jti, // JWT ID 作为 session token
        //     userId: token.id,
        //     expires: session.expires,
        //     userAgent: headers().get('user-agent'),
        //     ipAddress: headers().get('x-forwarded-for') || '0.0.0.0'
        //   });
        // } catch (error) {
        //   console.error('Error storing session:', error);
        //   // 继续返回session，即使存储失败
        // }
        session.provider = token.provider;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        const returnUrl = new URL(url, baseUrl);
        
        if (isSignInCallback) {
          returnUrl.searchParams.set('signInSuccess', 'true');
          isSignInCallback = false;
        }
        
        return returnUrl.toString();
      } catch (error) {
        return baseUrl;
      }
    },
  },
};

export const { handlers: { GET, POST }, auth, signIn } = NextAuth(authOptions);

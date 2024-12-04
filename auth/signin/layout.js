import { createMetadataGenerator } from '@/lib/metadata';

export const generateMetadata = createMetadataGenerator({
  t_key: 'auth.metadata.signIn',
  path: '/auth/signin'
});

export default function SignInLayout({ children }) {
    return (
        <>
            {children}
        </>
    );
}

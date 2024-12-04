import { createMetadataGenerator } from '@/lib/metadata';

export const generateMetadata = createMetadataGenerator({
  t_key: 'auth.metadata.resetPassword',
  path: '/auth/reset-password'
});

export default function ResetPasswordLayout({ children }) {
    return (
        <>
            {children}
        </>
    );
}
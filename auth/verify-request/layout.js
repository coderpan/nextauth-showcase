import { createMetadataGenerator } from '@/lib/metadata';

export const generateMetadata = createMetadataGenerator({
  t_key: 'auth.metadata.verifyRequest',
  path: '/auth/verify-request'
});

export default function VerifyRequestLayout({ children }) {
    return (
        <>
            {children}
        </>
    );
}
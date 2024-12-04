import { createMetadataGenerator } from '@/lib/metadata';

export const generateMetadata = createMetadataGenerator({
  t_key: 'auth.metadata.register',
  path: '/auth/register'
});

export default function RegisterLayout({ children }) {
    return (
        <>
            {children}
        </>
    );
}
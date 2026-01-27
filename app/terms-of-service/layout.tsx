import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'Terms of Service for Fruitful Vine Heritage Schools. Read the terms and conditions for using our services.',
    robots: {
        index: true,
        follow: true,
    },
};

export default function TermsOfServiceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

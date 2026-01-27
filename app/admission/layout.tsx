import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Apply for Admission',
    description: 'Apply online for admission to Fruitful Vine Heritage Schools. We offer quality Crèche, Pre-School, and Primary education in Badagry, Lagos. Start your child\'s journey today.',
    openGraph: {
        title: 'Apply for Admission | Fruitful Vine Heritage Schools',
        description: 'Apply online for admission. Quality Crèche, Pre-School, and Primary education in Badagry, Lagos.',
    },
};

export default function AdmissionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

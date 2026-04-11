import * as Types from '@/lib/types';

export type CardTemplate = 'premium' | 'modern' | 'classic' | 'elegant' | 'minimal';
export type CardSide = 'front' | 'back' | 'both';

export const TEMPLATES: { id: CardTemplate; name: string; description: string }[] = [
    { id: 'premium', name: 'Premium', description: 'White header with watermark' },
    { id: 'modern', name: 'Modern', description: 'Clean gradient design' },
    { id: 'elegant', name: 'Elegant', description: 'Sophisticated with patterns' },
    { id: 'classic', name: 'Classic', description: 'Traditional school card' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and clean' }
];

export const ACCENT_COLORS = [
    { id: 'brand', name: 'School Blue', primary: '#1A3A5C', secondary: '#8FC31F' },
    { id: 'navy', name: 'Navy Gold', primary: '#0F172A', secondary: '#F59E0B' },
    { id: 'green', name: 'Forest', primary: '#065F46', secondary: '#34D399' },
    { id: 'maroon', name: 'Maroon', primary: '#7F1D1D', secondary: '#FBBF24' },
    { id: 'purple', name: 'Royal Purple', primary: '#4C1D95', secondary: '#C4B5FD' },
];

export interface IDCardViewProps {
    students: Types.Student[];
    teachers?: Types.Teacher[];
    classes: Types.Class[];
    settings: Types.Settings;
}

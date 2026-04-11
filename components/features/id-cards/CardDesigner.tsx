import React from 'react';
import { Palette } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CardTemplate, TEMPLATES, ACCENT_COLORS } from './id-card-types';

interface CardDesignerProps {
    template: CardTemplate;
    setTemplate: (t: CardTemplate) => void;
    accentColor: any;
    setAccentColor: (c: any) => void;
}

export function CardDesigner({
    template,
    setTemplate,
    accentColor,
    setAccentColor
}: CardDesignerProps) {
    return (
        <div className="no-print">
            <Card className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-brand-600" />
                        <span className="text-sm font-medium text-gray-700">Template:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {TEMPLATES.map(t => (
                            <button key={t.id} onClick={() => setTemplate(t.id)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${template === t.id
                                    ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {t.name}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-sm font-medium text-gray-700">Color:</span>
                        <div className="flex gap-1.5">
                            {ACCENT_COLORS.map(c => (
                                <button key={c.id} onClick={() => setAccentColor(c)} title={c.name}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${accentColor.id === c.id ? 'ring-2 ring-offset-2 ring-brand-500' : ''}`}
                                    style={{ background: `linear-gradient(135deg, ${c.primary} 50%, ${c.secondary} 50%)` }} />
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

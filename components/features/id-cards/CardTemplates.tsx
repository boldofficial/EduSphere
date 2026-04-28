import React from 'react';
import { User, Phone, Mail, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { CardTemplate } from './id-card-types';

export const getPassportUrl = (s: Types.Student) => {
    const url = s.passport_url || (s as any).passport_media || null;
    return url ? Utils.getMediaUrl(url) : null;
};

export const getQRValue = (student: Types.Student, settings: Types.Settings, className: string) => {
    return `${settings.school_name}|${student.student_no}|${student.names}|${className}`;
};

interface TemplateProps {
    student: Types.Student;
    settings: Types.Settings;
    accentColor: any;
    currentClass: Types.Class | undefined;
    validityPeriod: string;
}

export const PremiumFront = ({ student, settings, accentColor, currentClass, validityPeriod }: TemplateProps) => (
    <div className="relative w-[340px] h-[214px] bg-white rounded-2xl overflow-hidden shadow-xl print:shadow-none break-inside-avoid border-2"
        style={{ borderColor: accentColor.primary }}>

        {settings.logo_media && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img src={Utils.getMediaUrl(settings.logo_media)} alt="" className="w-32 h-32 object-contain opacity-[0.05]" />
            </div>
        )}

        <div className="relative flex items-center justify-center gap-3 px-4 py-2 border-b" style={{ borderColor: `${accentColor.primary}25` }}>
            {settings.logo_media && (
                <img src={Utils.getMediaUrl(settings.logo_media)} className="h-11 w-11 object-contain" alt="Logo" />
            )}
            <div className="text-center">
                <h3 className="font-extrabold text-[11px] uppercase tracking-wide leading-tight" style={{ color: accentColor.primary }}>
                    {settings.school_name}
                </h3>
                <p className="text-[7px] italic font-medium" style={{ color: accentColor.secondary }}>{settings.school_tagline}</p>
                <p className="text-[6px] text-gray-500">{settings.school_address}</p>
            </div>
        </div>

        <div className="relative flex px-4 pt-2">
            <div className="h-[85px] w-[68px] rounded-lg overflow-hidden border-2 shadow-md flex-shrink-0"
                style={{ borderColor: accentColor.primary }}>
                {getPassportUrl(student) ? (
                    <img src={getPassportUrl(student)!} className="h-full w-full object-cover" alt="Photo" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                        <User className="h-8 w-8 text-gray-300" />
                    </div>
                )}
            </div>

            <div className="flex-1 pl-3">
                <h2 className="text-[12px] font-extrabold uppercase leading-tight truncate mb-2" style={{ color: accentColor.primary }}>
                    {student.names}
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px]">
                    <div>
                        <span className="text-gray-400 uppercase text-[7px] font-medium">ID No.</span>
                        <p className="font-bold" style={{ color: accentColor.primary }}>{student.student_no}</p>
                    </div>
                    <div>
                        <span className="text-gray-400 uppercase text-[7px] font-medium">Class</span>
                        <p className="font-bold text-gray-800">{currentClass?.name}</p>
                    </div>
                    <div>
                        <span className="text-gray-400 uppercase text-[7px] font-medium">Gender</span>
                        <p className="font-bold text-gray-800">{student.gender}</p>
                    </div>
                    <div>
                        <span className="text-gray-400 uppercase text-[7px] font-medium">D.O.B</span>
                        <p className="font-bold text-gray-800">{student.dob ? new Date(student.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center">
                <div className="h-14 w-14 bg-white border-2 rounded-lg p-0.5 shadow" style={{ borderColor: accentColor.primary }}>
                    <QRCodeSVG value={getQRValue(student, settings, currentClass?.name || '')} size={52} level="M" fgColor={accentColor.primary} />
                </div>
            </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-6 flex items-center justify-between px-4"
            style={{ background: accentColor.primary }}>
            <p className="text-white text-[8px] font-medium uppercase tracking-wider">Valid: {validityPeriod}</p>
            <p className="text-white/70 text-[7px] italic">{settings.school_tagline}</p>
        </div>
    </div>
);

export const ModernFront = ({ student, settings, accentColor, currentClass, validityPeriod }: TemplateProps) => (
    <div className="relative w-[340px] h-[214px] bg-white rounded-xl overflow-hidden border border-gray-200 shadow-lg print:shadow-none break-inside-avoid">
        {settings.logo_media && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img src={Utils.getMediaUrl(settings.logo_media)} alt="" className="w-24 h-24 object-contain opacity-[0.05]" />
            </div>
        )}
        <div className="absolute top-0 w-full h-[65px] flex items-center px-4"
            style={{ background: `linear-gradient(135deg, ${accentColor.primary} 0%, ${accentColor.primary}cc 100%)` }}>
            <div className="flex-1">
                <h3 className="text-white font-bold text-[10px] uppercase tracking-wide truncate">{settings.school_name}</h3>
                <p className="text-white/60 text-[7px] truncate">{settings.school_tagline}</p>
            </div>
            {settings.logo_media && (
                <img src={Utils.getMediaUrl(settings.logo_media)} className="h-10 w-10 object-contain bg-white rounded-full p-1 shadow-md" alt="Logo" />
            )}
        </div>
        <div className="absolute top-[65px] w-full h-[120px] p-3 flex gap-3">
            <div className="h-[70px] w-[56px] rounded-lg bg-gray-100 border-2 overflow-hidden flex-shrink-0 shadow-sm -mt-5"
                style={{ borderColor: accentColor.secondary }}>
                {getPassportUrl(student) ? (
                    <img src={getPassportUrl(student)!} className="h-full w-full object-cover" alt="Photo" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-50">
                        <User className="h-6 w-6 text-gray-300" />
                    </div>
                )}
            </div>
            <div className="flex-1 space-y-0.5">
                <h2 className="text-[10px] font-bold uppercase leading-tight truncate" style={{ color: accentColor.primary }}>{student.names}</h2>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0 text-[8px]">
                    <div><span className="text-gray-400 uppercase text-[6px]">ID</span><p className="font-semibold" style={{ color: accentColor.primary }}>{student.student_no}</p></div>
                    <div><span className="text-gray-400 uppercase text-[6px]">Class</span><p className="text-gray-800 font-semibold">{currentClass?.name}</p></div>
                    <div><span className="text-gray-400 uppercase text-[6px]">Gender</span><p className="text-gray-800">{student.gender}</p></div>
                    <div><span className="text-gray-400 uppercase text-[6px]">D.O.B</span><p className="text-gray-800">{student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</p></div>
                </div>
            </div>
            <div className="h-9 w-9 bg-white border-2 rounded p-0.5 flex-shrink-0 self-end" style={{ borderColor: accentColor.primary }}>
                <QRCodeSVG value={getQRValue(student, settings, currentClass?.name || '')} size={32} level="M" fgColor={accentColor.primary} />
            </div>
        </div>
        <div className="absolute bottom-0 w-full h-[22px] flex items-center justify-between px-3" style={{ background: accentColor.primary }}>
            <p className="text-white/70 text-[7px] uppercase tracking-widest">Student ID</p>
            <p className="text-white/50 text-[7px]">Valid: {validityPeriod}</p>
        </div>
    </div>
);

export const ElegantFront = ({ student, settings, accentColor, currentClass, validityPeriod }: TemplateProps) => (
    <div className="relative w-[340px] h-[214px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden border-2 shadow-lg print:shadow-none break-inside-avoid"
        style={{ borderColor: accentColor.primary }}>
        {settings.logo_media && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img src={Utils.getMediaUrl(settings.logo_media)} alt="" className="w-24 h-24 object-contain opacity-[0.05]" />
            </div>
        )}
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: accentColor.primary }} />
        <div className="flex items-center gap-2 px-4 pt-2">
            {settings.logo_media && <img src={Utils.getMediaUrl(settings.logo_media)} className="h-8 w-8 object-contain" alt="Logo" />}
            <div className="flex-1">
                <h3 className="font-bold text-[9px] uppercase truncate" style={{ color: accentColor.primary }}>{settings.school_name}</h3>
                <p className="text-gray-400 text-[6px] italic truncate">{settings.school_tagline}</p>
            </div>
        </div>
        <div className="flex gap-3 px-4 mt-1.5">
            <div className="h-[68px] w-[54px] rounded overflow-hidden border-2 flex-shrink-0" style={{ borderColor: accentColor.primary }}>
                {getPassportUrl(student) ? (
                    <img src={getPassportUrl(student)!} className="h-full w-full object-cover" alt="Photo" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100"><User className="h-5 w-5 text-gray-300" /></div>
                )}
            </div>
            <div className="flex-1">
                <h2 className="text-[10px] font-bold uppercase leading-tight truncate" style={{ color: accentColor.primary }}>{student.names}</h2>
                <div className="mt-1 space-y-0 text-[8px]">
                    <p><span className="text-gray-400">ID:</span> <span className="font-bold" style={{ color: accentColor.primary }}>{student.student_no}</span></p>
                    <p><span className="text-gray-400">Class:</span> <span className="text-gray-700 font-semibold">{currentClass?.name}</span></p>
                    <p><span className="text-gray-400">D.O.B:</span> <span className="text-gray-700">{student.dob ? new Date(student.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span></p>
                </div>
            </div>
            <div className="flex flex-col items-center gap-0.5 self-end">
                <div className="h-9 w-9 bg-white border rounded p-0.5" style={{ borderColor: accentColor.primary }}>
                    <QRCodeSVG value={getQRValue(student, settings, currentClass?.name || '')} size={32} level="M" fgColor={accentColor.primary} />
                </div>
            </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-5 flex items-center justify-between px-4" style={{ background: accentColor.primary }}>
            <p className="text-white/80 text-[7px] tracking-wider">Session: {validityPeriod}</p>
            <p className="text-white/60 text-[7px]">{settings.school_phone}</p>
        </div>
    </div>
);

export const ClassicFront = ({ student, settings, accentColor, currentClass, validityPeriod }: TemplateProps) => (
    <div className="relative w-[340px] h-[214px] bg-white rounded-xl overflow-hidden border-2 shadow-lg print:shadow-none break-inside-avoid"
        style={{ borderColor: accentColor.primary }}>
        {settings.logo_media && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img src={Utils.getMediaUrl(settings.logo_media)} alt="" className="w-20 h-20 object-contain opacity-[0.05]" />
            </div>
        )}
        <div className="absolute top-0 w-full h-[50px] flex items-center justify-center gap-2 px-3" style={{ background: accentColor.primary }}>
            {settings.logo_media && <img src={Utils.getMediaUrl(settings.logo_media)} className="h-8 w-8 object-contain" alt="Logo" />}
            <div className="text-center">
                <h3 className="text-white font-bold text-[9px] uppercase truncate">{settings.school_name}</h3>
                <p className="text-white/70 text-[6px] truncate">{settings.school_address}</p>
            </div>
        </div>
        <div className="absolute top-[50px] w-full h-[135px] p-2.5 flex gap-2" style={{ background: `${accentColor.secondary}15` }}>
            <div className="h-[60px] w-[48px] border-2 overflow-hidden flex-shrink-0 bg-white" style={{ borderColor: accentColor.primary }}>
                {getPassportUrl(student) ? (
                    <img src={getPassportUrl(student)!} className="h-full w-full object-cover" alt="Photo" />
                ) : (
                    <User className="h-full w-full p-1 text-gray-300" />
                )}
            </div>
            <div className="flex-1 text-[8px] space-y-0">
                <p><span className="font-bold" style={{ color: accentColor.primary }}>Name:</span> {student.names}</p>
                <p><span className="font-bold" style={{ color: accentColor.primary }}>ID:</span> {student.student_no}</p>
                <p><span className="font-bold" style={{ color: accentColor.primary }}>Class:</span> {currentClass?.name}</p>
                <p><span className="font-bold" style={{ color: accentColor.primary }}>D.O.B:</span> {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</p>
                <p><span className="font-bold" style={{ color: accentColor.primary }}>Gender:</span> {student.gender}</p>
            </div>
            <div className="h-9 w-9 bg-white border flex-shrink-0 p-0.5 self-end" style={{ borderColor: accentColor.primary }}>
                <QRCodeSVG value={getQRValue(student, settings, currentClass?.name || '')} size={32} level="M" fgColor={accentColor.primary} />
            </div>
        </div>
        <div className="absolute bottom-0 w-full h-[22px] flex items-center justify-center" style={{ background: accentColor.primary }}>
            <p className="text-white text-[7px] font-medium">Session: {validityPeriod}</p>
        </div>
    </div>
);

export const MinimalFront = ({ student, settings, accentColor, currentClass }: Omit<TemplateProps, 'validityPeriod'>) => (
    <div className="relative w-[340px] h-[214px] bg-white rounded-xl overflow-hidden border border-gray-200 shadow-lg print:shadow-none break-inside-avoid">
        {settings.logo_media && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img src={Utils.getMediaUrl(settings.logo_media)} alt="" className="w-20 h-20 object-contain opacity-[0.04]" />
            </div>
        )}
        <div className="p-4 flex gap-4 h-full">
            <div className="h-[80px] w-[64px] rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {getPassportUrl(student) ? (
                    <img src={getPassportUrl(student)!} className="h-full w-full object-cover" alt="Photo" />
                ) : (
                    <div className="h-full w-full p-2 text-gray-300"><User /></div>
                )}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-1 mb-2">
                    {settings.logo_media && <img src={Utils.getMediaUrl(settings.logo_media)} className="h-5 w-5 object-contain" alt="Logo" />}
                    <h4 className="text-[7px] font-medium text-gray-400 uppercase tracking-wider truncate">{settings.school_name}</h4>
                </div>
                <h2 className="text-sm font-bold mb-1.5 truncate" style={{ color: accentColor.primary }}>{student.names}</h2>
                <div className="space-y-0 text-[8px]">
                    <p><span className="text-gray-400">ID:</span> <span className="font-semibold">{student.student_no}</span></p>
                    <p><span className="text-gray-400">Class:</span> <span className="font-medium">{currentClass?.name}</span></p>
                </div>
            </div>
            <div className="self-end">
                <div className="h-9 w-9 bg-white border rounded p-0.5" style={{ borderColor: accentColor.primary }}>
                    <QRCodeSVG value={getQRValue(student, settings, currentClass?.name || '')} size={32} level="M" fgColor={accentColor.primary} />
                </div>
            </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accentColor.primary }} />
    </div>
);

export const BackCard = ({ student, settings, accentColor, template, validityPeriod }: TemplateProps & { template: CardTemplate }) => (
    <div className="relative w-[340px] h-[214px] bg-white rounded-xl overflow-hidden border shadow-lg print:shadow-none break-inside-avoid"
        style={{ borderColor: template === 'classic' || template === 'premium' ? accentColor.primary : '#E5E7EB', borderWidth: template === 'classic' || template === 'premium' ? '2px' : '1px' }}>
        {settings.logo_media && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img src={Utils.getMediaUrl(settings.logo_media)} alt="" className="w-20 h-20 object-contain opacity-[0.05]" />
            </div>
        )}
        <div className="absolute top-0 w-full h-5 flex items-center justify-center" style={{ background: accentColor.primary }}>
            <p className="text-white text-[7px] font-medium uppercase tracking-wider truncate px-2">{settings.school_name}</p>
        </div>

        <div className="absolute top-5 w-full h-[120px] p-3 flex justify-center">
            <div className="grid grid-cols-2 gap-6 max-w-[300px]">
                <div className="space-y-1">
                    <h4 className="text-[7px] font-bold uppercase border-b pb-0.5" style={{ color: accentColor.primary }}>Emergency Contact</h4>
                    <div className="space-y-0.5 text-[7px]">
                        <div className="flex items-start gap-1">
                            <User className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" style={{ color: accentColor.secondary }} />
                            <span className="text-gray-700 truncate">{student.parent_name}</span>
                        </div>
                        <div className="flex items-start gap-1">
                            <Phone className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" style={{ color: accentColor.secondary }} />
                            <span className="text-gray-700 font-medium">{student.parent_phone}</span>
                        </div>
                        <div className="flex items-start gap-1">
                            <MapPin className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" style={{ color: accentColor.secondary }} />
                            <span className="text-gray-600 leading-tight text-[6px]">{student.address}</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-1">
                    <h4 className="text-[7px] font-bold uppercase border-b pb-0.5" style={{ color: accentColor.primary }}>School Contact</h4>
                    <div className="space-y-0.5 text-[7px]">
                        <div className="flex items-start gap-1">
                            <Phone className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" style={{ color: accentColor.secondary }} />
                            <span className="text-gray-700">{settings.school_phone}</span>
                        </div>
                        <div className="flex items-start gap-1">
                            <Mail className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" style={{ color: accentColor.secondary }} />
                            <span className="text-gray-700 text-[6px] truncate">{settings.school_email}</span>
                        </div>
                        <div className="flex items-start gap-1">
                            <MapPin className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" style={{ color: accentColor.secondary }} />
                            <span className="text-gray-600 leading-tight text-[6px]">{settings.school_address}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="absolute bottom-0 w-full h-[55px] px-4 py-1 border-t" style={{ background: `${accentColor.secondary}10`, borderColor: `${accentColor.primary}20` }}>
            <div className="flex justify-between items-end h-full">
                <div>
                    <p className="text-[6px] text-gray-600 font-medium">This card is the property of {settings.school_name}.</p>
                    <p className="text-[5px] text-gray-400 italic">If found, please return to the school address.</p>
                    <p className="text-[7px] font-bold mt-0.5" style={{ color: accentColor.primary }}>Valid: {validityPeriod}</p>
                </div>
                <div className="text-center">
                    {settings.director_signature ? (
                        <img src={Utils.getMediaUrl(settings.director_signature)} alt="Signature" className="h-6 w-auto mx-auto object-contain" />
                    ) : (
                        <div className="w-16 border-b border-gray-400 mb-0.5"></div>
                    )}
                    <p className="text-[6px] font-medium" style={{ color: accentColor.primary }}>Authorized Signature</p>
                    <p className="text-[5px] text-gray-500">({settings.director_name || 'Director'})</p>
                </div>
            </div>
        </div>
    </div>
);

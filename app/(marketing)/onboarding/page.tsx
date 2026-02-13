'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle2, ArrowRight, School, User, CreditCard, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

const schema = z.object({
    school_name: z.string().min(3, "School name is required"),
    domain: z.string().min(3, "Subdomain is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    admin_name: z.string().optional().or(z.literal('')),
    plan_slug: z.string().min(1, "Please select a plan"),
    phone: z.string().optional().or(z.literal('')),
    school_email: z.string().email("Invalid school email").optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    contact_person: z.string().optional().or(z.literal('')),
    payment_method: z.enum(['paystack', 'bank_transfer']),
    payment_proof: z.string().optional().or(z.literal(''))
});

type FormData = z.infer<typeof schema>;

export default function OnboardingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1);
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isPaid, setIsPaid] = useState(false);
    const [isPaying, setIsPaying] = useState(false);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            school_name: '',
            domain: '',
            email: '',
            password: '',
            admin_name: '',
            plan_slug: searchParams.get('plan') || 'enterprise',
            phone: '',
            school_email: '',
            address: '',
            contact_person: '',
            payment_method: 'bank_transfer', // Dummy value for free phase
            payment_proof: ''
        }
    });

    const selectedPlanSlug = watch('plan_slug');

    const [rootDomain, setRootDomain] = useState('myregistra.net');

    const [platformSettings, setPlatformSettings] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setRootDomain(window.location.host.replace(/^www\./, ''));
        }
        apiClient.get('schools/plans/').then(res => setPlans(res.data)).catch(console.error);
        apiClient.get('schools/platform-settings/').then(res => setPlatformSettings(res.data)).catch(console.error);
    }, []);

    const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setValue('payment_proof', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setError('');
        try {
            console.log('[ONBOARDING] Submitting data:', data);
            await apiClient.post('schools/register/', data);
            // Redirect to success / tenant login
            const protocol = window.location.protocol;
            const tenantUrl = `${protocol}//${data.domain}.${rootDomain}/login`;
            router.push(`/onboarding/success?url=${encodeURIComponent(tenantUrl)}`);
        } catch (err: any) {
            console.error('[ONBOARDING] Registration Error Details:', err.response?.data);

            const responseData = err.response?.data;
            let detailMsg = 'Registration failed';

            if (responseData) {
                const errorObj = responseData.errors || responseData.details || responseData;
                if (typeof errorObj === 'object' && !Array.isArray(errorObj)) {
                    detailMsg = Object.entries(errorObj)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join(' | ');
                } else if (responseData.error) {
                    detailMsg = responseData.error;
                } else {
                    detailMsg = JSON.stringify(responseData);
                }
            } else if (err.message) {
                detailMsg = err.message;
            }

            setError(detailMsg);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-primary py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Setup your School</h1>
                    <p className="text-gray-500">Complete these steps to launch your Registra platform.</p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    {/* Progress Bar */}
                    <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center text-sm font-bold text-gray-400">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-brand-600' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}>1</div>
                            <span>Plan</span>
                        </div>
                        <div className={`h-1 flex-1 mx-4 bg-gray-200 rounded-full ${step >= 2 ? 'bg-brand-600' : ''}`}></div>
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-brand-600' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}>2</div>
                            <span>Details</span>
                        </div>
                        <div className={`h-1 flex-1 mx-4 bg-gray-200 rounded-full ${step >= 3 ? 'bg-brand-600' : ''}`}></div>
                        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-brand-600' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}>3</div>
                            <span>Terms</span>
                        </div>
                        <div className={`h-1 flex-1 mx-4 bg-gray-200 rounded-full ${step >= 4 ? 'bg-brand-600' : ''}`}></div>
                        <div className={`flex items-center gap-2 ${step >= 4 ? 'text-brand-600' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 4 ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}>4</div>
                            <span>Account</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-8">
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <CreditCard className="text-brand-600" /> Select Subscription
                                </h2>
                                <div className="grid grid-cols-1 gap-4">
                                    {plans.filter(p => p.slug === 'enterprise').map(plan => (
                                        <div
                                            key={plan.id}
                                            className="p-6 rounded-2xl border-2 border-brand-600 bg-brand-50"
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="font-black text-2xl text-gray-900">{plan.name}</h3>
                                                <span className="px-3 py-1 bg-brand-600 text-white text-xs font-bold rounded-full">PILOT ACCESS</span>
                                            </div>
                                            <p className="text-brand-700 font-bold mb-4">FREE for 2025/2026 Session (2nd & 3rd Term)</p>
                                            <ul className="space-y-2 text-sm text-gray-600">
                                                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand-600" /> Full academic & finance automation</li>
                                                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand-600" /> Professional PDF report cards</li>
                                                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand-600" /> Dedicated priority support</li>
                                            </ul>
                                        </div>
                                    ))}
                                    {plans.filter(p => p.slug === 'enterprise').length === 0 && (
                                        <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center text-gray-400">
                                            Loading pilot plan details...
                                        </div>
                                    )}
                                </div>
                                {errors.plan_slug && <p className="text-red-500 text-sm">{errors.plan_slug.message}</p>}
                                <div className="flex justify-end">
                                    <button type="button" onClick={() => setStep(2)} className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700">Next Step</button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <School className="text-brand-600" /> School Details
                                </h2>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">School Name</label>
                                    <input {...register('school_name')} placeholder="e.g. Registra College" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500" />
                                    {errors.school_name && <p className="text-red-500 text-sm mt-1">{errors.school_name.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Subdomain</label>
                                    <div className="flex items-center">
                                        <input {...register('domain')} placeholder="fruitfulvine" className="flex-1 px-4 py-3 rounded-l-xl border border-gray-200 focus:ring-2 focus:ring-brand-500" />
                                        <span className="px-4 py-3 bg-gray-100 border border-l-0 border-gray-200 rounded-r-xl text-gray-500 font-medium">.{rootDomain}</span>
                                    </div>
                                    {errors.domain && <p className="text-red-500 text-sm mt-1">{errors.domain.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">School Phone</label>
                                        <input {...register('phone')} placeholder="08012345678" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Official Email</label>
                                        <input {...register('school_email')} placeholder="info@school.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">School Address</label>
                                    <textarea {...register('address')} placeholder="123 Education Street..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 h-24 resize-none" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Contact Person</label>
                                    <input {...register('contact_person')} placeholder="Mr. John Doe" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500" />
                                </div>

                                <div className="flex justify-between">
                                    <button type="button" onClick={() => setStep(1)} className="text-gray-500 font-bold hover:text-gray-700">Back</button>
                                    <button type="button" onClick={() => setStep(3)} className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700">Next Step</button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div className="p-8 bg-brand-50 border-2 border-brand-100 rounded-2xl">
                                    <h3 className="font-bold text-brand-900 mb-4">Pilot Program Agreement</h3>
                                    <div className="space-y-4 text-sm text-brand-800 leading-relaxed">
                                        <p>
                                            By proceeding, you agree to use Registra for your school management for the remainder of the 2025/2026 session.
                                        </p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li>Access is completely free for 2nd and 3rd terms.</li>
                                            <li>Our team will provide setup and migration assistance.</li>
                                            <li><strong>Requirement:</strong> You agree to provide a written review and participate in a brief feedback session.</li>
                                        </ul>
                                        <div className="pt-4 flex items-start gap-3">
                                            <input type="checkbox" required className="mt-1 w-4 h-4 text-brand-600 rounded bg-white border-brand-200" />
                                            <span className="font-medium">I understand this is a pilot program and agree to provide feedback.</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <button type="button" onClick={() => setStep(2)} className="text-gray-500 font-bold hover:text-gray-700">Back</button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(4)}
                                        disabled={(watch('payment_method') === 'bank_transfer' && !watch('payment_proof')) || (watch('payment_method') === 'paystack' && !isPaid)}
                                        className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-30"
                                    >
                                        Next Step
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <User className="text-brand-600" /> Admin Account
                                </h2>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Admin Email</label>
                                    <input {...register('email')} type="email" placeholder="admin@school.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500" />
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                                    <input {...register('password')} type="password" placeholder="Create a strong password" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500" />
                                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-600"></span>
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-4">
                                    <button type="button" onClick={() => setStep(3)} className="text-gray-500 font-bold hover:text-gray-700">Back</button>
                                    <button type="submit" disabled={isLoading} className="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2">
                                        {isLoading ? <Loader2 className="animate-spin" /> : 'Create School'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

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
    plan_slug: z.string().min(1, "Please select a plan"),
    phone: z.string().optional(),
    school_email: z.string().email("Invalid school email").optional().or(z.literal('')),
    address: z.string().optional(),
    contact_person: z.string().optional()
});

type FormData = z.infer<typeof schema>;

export default function OnboardingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1);
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        school_name: '',
        domain: '',
        email: '',
        password: '',
        phone: '',
        school_email: '',
        address: '',
        contact_person: ''
    });

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            plan_slug: searchParams.get('plan') || 'starter'
        }
    });

    const selectedPlanSlug = watch('plan_slug');

    useEffect(() => {
        apiClient.get('/schools/plans/').then(res => setPlans(res.data)).catch(console.error);
    }, []);

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setError('');
        try {
            await apiClient.post('/schools/register/', data);
            // Redirect to success / tenant login
            const tenantUrl = `http://${data.domain}.localhost:3000/login`; // Adjust for prod
            router.push(`/onboarding/success?url=${encodeURIComponent(tenantUrl)}`);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-primary py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Setup your School</h1>
                    <p className="text-gray-500">Complete these steps to launch your EduSphere platform.</p>
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
                            <span>Account</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-8">
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <CreditCard className="text-brand-600" /> Select Subscription
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {plans.map(plan => (
                                        <div
                                            key={plan.id}
                                            onClick={() => setValue('plan_slug', plan.slug)}
                                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${selectedPlanSlug === plan.slug ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'}`}
                                        >
                                            <h3 className="font-bold text-gray-900">{plan.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">₦{plan.price}</p>
                                        </div>
                                    ))}
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
                                    <input {...register('school_name')} placeholder="e.g. Fruitful Vine College" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500" />
                                    {errors.school_name && <p className="text-red-500 text-sm mt-1">{errors.school_name.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Subdomain</label>
                                    <div className="flex items-center">
                                        <input {...register('domain')} placeholder="fruitfulvine" className="flex-1 px-4 py-3 rounded-l-xl border border-gray-200 focus:ring-2 focus:ring-brand-500" />
                                        <span className="px-4 py-3 bg-gray-100 border border-l-0 border-gray-200 rounded-r-xl text-gray-500 font-medium">.edusphere.ng</span>
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
                                    <button type="button" onClick={() => setStep(2)} className="text-gray-500 font-bold hover:text-gray-700">Back</button>
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

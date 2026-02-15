'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSchoolStore } from '@/lib/store';
import { useSettings } from '@/lib/hooks/use-data';
import { UserRole } from '@/lib/types';
import {
    ShieldCheck,
    Users,
    GraduationCap,
    Briefcase,
    ArrowRight
} from 'lucide-react';
import * as Utils from '@/lib/utils';

// Extracted Components
import { RoleSelection } from './login/RoleSelection';
import { FindSchoolSection } from './login/FindSchoolSection';
import { StudentLoginForm } from './login/StudentLoginForm';
import { StaffLoginForm } from './login/StaffLoginForm';
import { ForgotPasswordModal } from './login/ForgotPasswordModal';

export const LoginView = () => {
    const router = useRouter();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
    const { login } = useSchoolStore();

    const [isDemo, setIsDemo] = useState(false);
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

    // Form states
    const [studentNo, setStudentNo] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Multi-tenant root domain state
    const [isSystemRoot, setIsSystemRoot] = useState(false);
    const [searchSlug, setSearchSlug] = useState('');
    const [searchError, setSearchError] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [adminSecretCount, setAdminSecretCount] = useState(0);
    const [showSystemLogin, setShowSystemLogin] = useState(false);

    // Forgot password state
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotStudentNo, setForgotStudentNo] = useState('');
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    const backgroundImages = [
        '/login-bg-classroom.png',
        'https://images.unsplash.com/photo-1523050853064-8504f2f40fd5?auto=format&fit=crop&q=80&w=2000',
        'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=2000',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000'
    ];

    const [currentBg, setCurrentBg] = useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBg((prev) => (prev + 1) % backgroundImages.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const host = window.location.host.split(':')[0].replace(/^www\./, '');
            const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net').split(':')[0].replace(/^www\./, '');

            const isRoot =
                host === rootDomain ||
                host === 'localhost' ||
                (host.includes('vercel.app') && !host.includes('-'));

            setIsSystemRoot(isRoot);
            setIsDemo(host.startsWith('demo.'));
        }
    }, []);

    const roleDefinitions = [
        { id: 'admin' as UserRole, name: 'Admin', icon: ShieldCheck, themeColor: '#3B82F6', color: 'bg-blue-600', desc: 'System Administration' },
        { id: 'teacher' as UserRole, name: 'Teacher', icon: Users, themeColor: '#10B981', color: 'bg-emerald-600', desc: 'Class & Grade Management' },
        { id: 'student' as UserRole, name: 'Student / Parent', icon: GraduationCap, themeColor: '#8B5CF6', color: 'bg-violet-600', desc: 'Academic Portal' },
        { id: 'staff' as UserRole, name: 'Non Teaching', icon: Briefcase, themeColor: '#F59E0B', color: 'bg-amber-600', desc: 'Operations Dashboard' },
    ];

    const resetForms = () => {
        setLoginError('');
        setStudentNo('');
        setPassword('');
        setEmail('');
        setShowPassword(false);
    };

    const handleFindSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        setSearchError('');
        setIsSearching(true);
        try {
            const res = await fetch(`/api/proxy/schools/verify-slug/${searchSlug.trim().toLowerCase()}/`);
            if (!res.ok) throw new Error('School not found. Please check the spelling.');
            const data = await res.json();
            const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net').split(':')[0];
            const targetDomain = data.custom_domain || `${data.slug}.${rootDomain}`;
            window.location.href = `${window.location.protocol}//${targetDomain}/login`;
        } catch (err: any) {
            setSearchError(err.message);
            setIsSearching(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setIsLoading(true);
        try {
            let tenantSlug = '';
            if (isSystemRoot) {
                if (!searchSlug && selectedRole !== 'super_admin') {
                    setLoginError('Please find your school first.');
                    setIsLoading(false);
                    return;
                }
                tenantSlug = searchSlug;
            } else {
                tenantSlug = window.location.host.split('.')[0];
            }

            let usernamePayload = email.trim().toLowerCase();
            if (selectedRole === 'student' && tenantSlug) {
                usernamePayload = `${email}@${tenantSlug}`;
            }

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantSlug },
                body: JSON.stringify({ username: usernamePayload, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Login failed');
            }

            const data = await res.json();
            const role = selectedRole || 'admin';
            login(role, { id: data.user.id, name: data.user.username, email: email, role });
            router.push(role === 'super_admin' ? '/dashboard/super-admin' : '/dashboard');
        } catch (err: any) {
            setLoginError(err.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStudentLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setIsLoading(true);
        try {
            let tenantSlug = isSystemRoot ? searchSlug : window.location.host.split('.')[0];
            if (!tenantSlug && isSystemRoot) {
                setLoginError('Please find your school first.');
                setIsLoading(false);
                return;
            }

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantSlug },
                body: JSON.stringify({ username: `${studentNo.trim()}@${tenantSlug}`, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Invalid Student Number or Password');
            }

            const data = await res.json();
            login('student', { id: data.user.id, name: data.user.username, email: data.user.email, role: 'student' });
            router.push('/dashboard');
        } catch (err: any) {
            setLoginError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotError('');
        setIsLoading(true);
        try {
            const res = await fetch('/api/proxy/students/forgot-password/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_no: forgotStudentNo.trim(), email: forgotEmail.trim() })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Could not find a student with these details.');
            }

            const data = await res.json();
            if (data.temp_password) setNewPassword(data.temp_password);
            setForgotSuccess(true);
        } catch (err: any) {
            setForgotError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDirectLogin = async (role: UserRole) => {
        setLoginError('');
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/demo-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: role === 'super_admin' ? 'admin' : role }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Demo login failed');
            }

            const data = await res.json();
            login(role, { id: data.user.id, name: data.user.username, email: data.user.email, role });
            router.push(role === 'super_admin' ? '/dashboard/super-admin' : '/dashboard');
        } catch (err: any) {
            setLoginError(err.message || 'Demo login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const newsItems = [
        { id: 1, title: 'Annual Sports Meet 2026', date: 'March 15, 2026', excerpt: 'Get ready for the most awaited event of the year! Preparations are in full swing...' },
        { id: 2, title: 'New Science Lab Inauguration', date: 'Feb 28, 2026', excerpt: 'We are proud to announce the opening of our state-of-the-art STEM facility...' },
        { id: 3, title: 'Parent-Teacher Conference', date: 'Feb 20, 2026', excerpt: 'Discussion on academic progress and upcoming curriculum updates for the spring term.' },
    ];

    return (
        <div className="min-h-screen relative flex flex-col lg:flex-row overflow-hidden bg-white">
            {/* Left Side - Login Hub (Clean & Functional) */}
            <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-8 md:p-16 z-20 relative bg-white shadow-2xl">
                <div className="w-full max-w-md space-y-12 animate-in fade-in slide-in-from-left-10 duration-1000">
                    {/* Brand & Identity */}
                    <div className="text-center lg:text-left space-y-6">
                        {!isSystemRoot ? (
                            <div className="flex flex-col items-center lg:items-start gap-6">
                                <img src={settings.logo_media || "/logo.png"} alt={settings.school_name} className="h-16 w-auto object-contain" />
                                <div className="space-y-1">
                                    <h1 className="text-3xl font-black text-brand-950 uppercase tracking-tight">{settings.school_name}</h1>
                                    <p className="text-brand-600/60 text-[10px] font-bold uppercase tracking-[0.3em]">Authorized Access Portal</p>
                                </div>
                            </div>
                        ) : (
                            <img src="/logo.png" alt="Registra" className="h-12 w-auto" />
                        )}
                        <h2 className="text-4xl font-black text-brand-950 tracking-tight italic">User Login</h2>
                    </div>

                    {/* Authentication Area */}
                    <div className="space-y-8">
                        {isSystemRoot && !selectedRole && (
                            <FindSchoolSection
                                searchSlug={searchSlug}
                                setSearchSlug={setSearchSlug}
                                searchError={searchError}
                                isSearching={isSearching}
                                showSystemLogin={showSystemLogin}
                                onFindSchool={handleFindSchool}
                                onSelectSuperAdmin={() => setSelectedRole('super_admin')}
                            />
                        )}

                        {!selectedRole && !isSystemRoot && (
                            <div className="grid grid-cols-2 gap-4">
                                {roleDefinitions.filter(r => r.id !== 'admin').map((role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => setSelectedRole(role.id)}
                                        className="flex items-center gap-3 p-4 rounded-2xl border border-brand-100 hover:border-brand-500 hover:bg-brand-50 transition-all group"
                                    >
                                        <div className={`p-2 rounded-xl ${role.color} text-white group-hover:scale-110 transition-transform`}>
                                            <role.icon size={20} />
                                        </div>
                                        <span className="font-bold text-brand-950">{role.name}</span>
                                    </button>
                                ))}
                                <button
                                    onClick={() => setSelectedRole('admin')}
                                    className="col-span-2 flex items-center justify-center gap-3 p-4 rounded-2xl border border-brand-950 bg-brand-950 text-white hover:bg-brand-900 transition-all"
                                >
                                    <ShieldCheck size={20} />
                                    <span className="font-bold">Staff / Admin Login</span>
                                </button>
                            </div>
                        )}

                        {selectedRole && (
                            <div className="animate-in fade-in zoom-in-95 duration-500">
                                {selectedRole === 'student' ? (
                                    <StudentLoginForm
                                        studentNo={studentNo}
                                        setStudentNo={setStudentNo}
                                        password={password}
                                        setPassword={setPassword}
                                        showPassword={showPassword}
                                        setShowPassword={setShowPassword}
                                        loginError={loginError}
                                        setLoginError={setLoginError}
                                        isLoading={isLoading}
                                        onSubmit={handleStudentLogin}
                                        onBack={() => { setSelectedRole(null); resetForms(); }}
                                        onForgotPassword={() => setShowForgotPassword(true)}
                                        isDemo={isDemo}
                                        onDirectLogin={handleDirectLogin}
                                    />
                                ) : (
                                    <StaffLoginForm
                                        selectedRole={selectedRole}
                                        roles={roleDefinitions}
                                        isDemo={isDemo}
                                        email={email}
                                        setEmail={setEmail}
                                        password={password}
                                        setPassword={setPassword}
                                        showPassword={showPassword}
                                        setShowPassword={setShowPassword}
                                        loginError={loginError}
                                        setLoginError={setLoginError}
                                        isLoading={isLoading}
                                        onLogin={handleLogin}
                                        onDirectLogin={handleDirectLogin}
                                        onBack={() => { setSelectedRole(null); resetForms(); }}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Links */}
                    <div className="pt-8 border-t border-brand-50 flex flex-wrap gap-6 justify-center lg:justify-start">
                        <a href="/" className="text-[10px] font-black uppercase text-brand-400 hover:text-brand-950 transition-colors tracking-widest flex items-center gap-2">
                            <ArrowRight size={12} className="rotate-180" /> Front Site
                        </a>
                        <button onClick={() => setShowForgotPassword(true)} className="text-[10px] font-black uppercase text-brand-400 hover:text-brand-950 transition-colors tracking-widest">
                            Forgot Password?
                        </button>
                        <p className="text-[10px] font-medium text-brand-200 uppercase tracking-widest ml-auto">
                            &copy; Registra v4.0
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Informational Feed & Imagery */}
            <div className="hidden lg:flex w-[60%] relative overflow-hidden bg-brand-950">
                {backgroundImages.map((img, idx) => (
                    <div
                        key={img}
                        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[3000ms] ${currentBg === idx ? 'opacity-30' : 'opacity-0'}`}
                        style={{ backgroundImage: `url('${img}')` }}
                    />
                ))}

                <div className="absolute inset-0 bg-brand-950/40 z-10" />

                <div className="relative z-20 flex flex-col p-16 w-full h-full justify-center">
                    <div className="max-w-xl space-y-12">
                        <div className="space-y-4">
                            <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                                What's New In <br />
                                <span className="text-accent-400 not-italic">{settings.school_name || 'Mount Carmel'}</span>
                            </h3>
                            <div className="h-1 w-20 bg-accent-500 rounded-full" />
                        </div>

                        <div className="space-y-6">
                            {newsItems.map((news, idx) => (
                                <div
                                    key={news.id}
                                    className="group p-8 rounded-[2.5rem] bg-white/[0.03] backdrop-blur-xl border border-white/5 hover:bg-white/[0.08] transition-all duration-500 animate-in fade-in slide-in-from-right-10"
                                    style={{ animationDelay: `${idx * 200}ms` }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-xl font-bold text-white group-hover:text-accent-400 transition-colors">{news.title}</h4>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{news.date}</span>
                                    </div>
                                    <p className="text-white/50 text-sm leading-relaxed mb-6">
                                        {news.excerpt}
                                    </p>
                                    <button className="flex items-center gap-2 text-accent-400 text-[10px] font-black uppercase tracking-[0.3em] group/btn">
                                        Read More <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Branding */}
                <div className="absolute bottom-10 right-10 z-20 flex items-center gap-4">
                    <img src="/footer-logo.png" alt="Registra" className="h-10 w-auto opacity-50" />
                    <div className="h-6 w-px bg-white/10" />
                    <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">Enterprise Hub v4</span>
                </div>
            </div>

            <ForgotPasswordModal
                isOpen={showForgotPassword}
                onClose={() => { setShowForgotPassword(false); setForgotSuccess(false); setForgotError(''); setForgotStudentNo(''); setForgotEmail(''); }}
                studentNo={forgotStudentNo}
                setStudentNo={setForgotStudentNo}
                email={forgotEmail}
                setEmail={setForgotEmail}
                error={forgotError}
                setError={setForgotError}
                success={forgotSuccess}
                setSuccess={setForgotSuccess}
                newPassword={newPassword}
                isLoading={isLoading}
                onSubmit={handleForgotPassword}
            />
        </div>
    );
};

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

    return (
        <div className="min-h-screen relative flex overflow-hidden bg-brand-950">
            {/* Desktop Left Side - Imagery (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden">
                {backgroundImages.map((img, idx) => (
                    <div
                        key={img}
                        className={`absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] transform scale-105 ${currentBg === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                        style={{ backgroundImage: `url('${img}')` }}
                    />
                ))}
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-900/40 to-transparent" />

                {/* Branding Overlay */}
                <div className="absolute top-12 left-12 z-20 flex items-center gap-3">
                    <img src="/footer-logo.png" alt="Registra" className="h-10 w-auto" />
                    <div className="h-6 w-px bg-white/20" />
                    <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Premium Education Suite</span>
                </div>

                <div className="absolute bottom-20 left-12 z-20 max-w-lg">
                    <h2 className="text-5xl font-black text-white leading-none mb-6 tracking-tighter uppercase italic">
                        The Future of <br />
                        <span className="text-accent-400 not-italic">Academy Management</span>
                    </h2>
                    <p className="text-white/60 text-lg font-medium tracking-tight">
                        Experience a seamless, AI-driven administrative workflow designed for modern institutions.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Area */}
            <div className={`flex-1 relative flex flex-col items-center justify-center p-6 md:p-12 z-10 transition-all duration-500 ${selectedRole ? 'lg:flex-none lg:w-1/2 overflow-y-auto' : ''}`}>
                {/* Mobile Background Fallback */}
                <div className="lg:hidden absolute inset-0 z-0 text-white">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${backgroundImages[0]}')` }} />
                    <div className="absolute inset-0 bg-brand-950/90 backdrop-blur-sm" />
                </div>

                <a href="/" className="absolute top-8 right-8 z-20 flex items-center gap-2 text-white/50 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full backdrop-blur-xl border border-white/10 group">
                    <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Exit to Home</span>
                </a>

                <div className="w-full max-w-4xl space-y-12 relative z-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="text-center lg:text-left space-y-6">
                        {!isSystemRoot ? (
                            <div className="flex flex-col lg:flex-row items-center gap-6">
                                <div className="p-4 bg-white rounded-[2rem] shadow-2xl border-4 border-white inline-block">
                                    <img src={settings.logo_media || "/logo.png"} alt={settings.school_name || "School Logo"} className="h-20 w-auto object-contain" />
                                </div>
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-2">{settings.school_name}</h1>
                                    <p className="text-accent-400 text-[10px] font-black uppercase tracking-[0.3em]">Authorized Access Portal</p>
                                </div>
                            </div>
                        ) : (
                            <div className="inline-block cursor-pointer select-none active:scale-95 transition-transform" onClick={() => {
                                const newCount = adminSecretCount + 1;
                                setAdminSecretCount(newCount);
                                if (newCount >= 5) { setShowSystemLogin(true); setAdminSecretCount(0); }
                            }}>
                                <img src="/footer-logo.png" alt="Registra" className="h-16 w-auto drop-shadow-md" />
                            </div>
                        )}

                        <p className="text-white/60 text-sm md:text-lg font-medium max-w-xl">
                            {!isSystemRoot
                                ? (selectedRole === 'student' ? 'Enter your Student Number and Password to access your portal.' : 'Welcome back. Please select your specific portal to proceed to your dashboard.')
                                : (showSystemLogin ? 'System Management Access Granted.' : 'Find your institution by entering its unique subdomain below.')
                            }
                        </p>
                    </div>

                    {!selectedRole && !isSystemRoot && (
                        <RoleSelection roles={roleDefinitions} onSelectRole={setSelectedRole} />
                    )}

                    {isSystemRoot && !selectedRole && (
                        <div className="max-w-md mx-auto lg:mx-0">
                            <FindSchoolSection
                                searchSlug={searchSlug}
                                setSearchSlug={setSearchSlug}
                                searchError={searchError}
                                isSearching={isSearching}
                                showSystemLogin={showSystemLogin}
                                onFindSchool={handleFindSchool}
                                onSelectSuperAdmin={() => setSelectedRole('super_admin')}
                            />
                        </div>
                    )}

                    {selectedRole && (
                        <div className="max-w-md mx-auto lg:mx-0 p-8 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl">
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

                    <div className="pt-8 text-center lg:text-left">
                        <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] flex items-center justify-center lg:justify-start gap-2">
                            &copy; {new Date().getFullYear()} Bold Ideas Innovations Ltd <ShieldCheck size={10} className="text-accent-500" /> Secure Node
                        </p>
                    </div>
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

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSchoolStore } from '@/lib/store';
import { useSettings } from '@/lib/hooks/use-data';
import { UserRole } from '@/lib/types';
import {
    ShieldCheck,
    Users,
    GraduationCap,
    Briefcase,
    ArrowRight,
    Lock
} from 'lucide-react';
import * as Utils from '@/lib/utils';
import { StaffLoginForm } from './login/StaffLoginForm';
import { StudentLoginForm } from './login/StudentLoginForm';
import { FindSchoolSection } from './login/FindSchoolSection';
import { ForgotPasswordModal } from './login/ForgotPasswordModal';

export const LoginView = () => {
    const router = useRouter();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
    const { login } = useSchoolStore();

    const [isDemo, setIsDemo] = useState(false);
    // Default to 'teacher' only on subdomains; on root we want to force school search or super admin secret
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [studentNo, setStudentNo] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Multi-tenant root domain state
    const [isSystemRoot, setIsSystemRoot] = useState(false);
    const [searchSlug, setSearchSlug] = useState('');
    const [searchError, setSearchError] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showSystemLogin, setShowSystemLogin] = useState(false);

    // Forgot password state
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotStudentNo, setForgotStudentNo] = useState('');
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [logoClickCount, setLogoClickCount] = useState(0);

    const handleLogoClick = () => {
        if (!isSystemRoot) return;
        const newCount = logoClickCount + 1;
        setLogoClickCount(newCount);
        if (newCount === 5) {
            setShowSystemLogin(true);
            setLogoClickCount(0);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const host = window.location.host.split(':')[0].replace(/^www\./, '');
            const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net').split(':')[0].replace(/^www\./, '');

            const isRoot =
                host === rootDomain ||
                host === 'localhost' ||
                (host.includes('vercel.app') && !host.includes('-'));

            setIsSystemRoot(isRoot);
            setIsDemo(host.startsWith('demo.'));

            // Set default role if not on root domain
            if (!isRoot) {
                setSelectedRole('teacher');
            }
        }
    }, []);

    const roleDefinitions = [
        { id: 'admin' as UserRole, name: 'Admin', icon: ShieldCheck, color: 'text-purple-600' },
        { id: 'teacher' as UserRole, name: 'Teacher', icon: Users, color: 'text-green-600' },
        { id: 'student' as UserRole, name: 'Student', icon: GraduationCap, color: 'text-blue-600' },
        { id: 'staff' as UserRole, name: 'Staff', icon: Briefcase, color: 'text-orange-600' },
    ];

    const resetForms = () => {
        setLoginError('');
        setStudentNo('');
        setPassword('');
        setEmail('');
        setShowPassword(false);
    };

    const handleRoleChange = (role: UserRole) => {
        setSelectedRole(role);
        resetForms();
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

    const handleForgotPassword = async (e: React.FormEvent) => {
        // ... (Keep existing implementation)
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

    return (
        <div className={`flex min-h-screen ${isSystemRoot ? 'bg-gray-900' : 'bg-white'}`}>
            {/* Background for System Root */}
            {isSystemRoot && (
                <div className="fixed inset-0 z-0">
                    <img
                        src="/login-bg-african.png"
                        alt="Background"
                        className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 via-black/60 to-purple-900/80 backdrop-blur-[2px]" />
                </div>
            )}

            {/* Left Side: Form */}
            <div className={`flex-1 flex flex-col justify-center px-6 md:px-16 xl:px-24 py-12 relative z-10 ${isSystemRoot ? 'items-center' : 'lg:w-1/2 bg-white'}`}>
                <div className={`mb-10 ${isSystemRoot ? 'text-center' : ''}`}>
                    <div
                        className="inline-block cursor-pointer transition-transform active:scale-95"
                        onClick={handleLogoClick}
                    >
                        {!isSystemRoot ? (
                            <div className="flex items-center gap-3">
                                <img src={settings.logo_media || "/logo.png"} alt={settings.school_name} className="h-10 w-auto object-contain" />
                                <span className="text-xl font-bold text-gray-900">{settings.school_name}</span>
                            </div>
                        ) : (
                            <img src="/logo.png" alt="Registra" className="h-20 w-auto object-contain brightness-110 contrast-110 drop-shadow-lg" />
                        )}
                    </div>
                </div>

                {(isSystemRoot && selectedRole !== 'super_admin') ? null : (
                    <div className={`mb-6 ${isSystemRoot ? 'text-center' : ''}`}>
                        <h1 className={`text-2xl font-bold mb-1 ${isSystemRoot ? 'text-white' : 'text-gray-900'}`}>Sign in</h1>
                        <p className={`text-sm ${isSystemRoot ? 'text-brand-100/70' : 'text-gray-500'}`}>
                            Enter your {selectedRole === 'student' ? 'student number' : 'email'} and password to access account.
                        </p>
                    </div>
                )}

                {/* Form Area */}
                <div className="mb-6 w-full flex justify-center">
                    {isSystemRoot && selectedRole !== 'super_admin' ? (
                        <FindSchoolSection
                            searchSlug={searchSlug}
                            setSearchSlug={setSearchSlug}
                            searchError={searchError}
                            isSearching={isSearching}
                            showSystemLogin={showSystemLogin}
                            onFindSchool={handleFindSchool}
                            onSelectSuperAdmin={() => setSelectedRole('super_admin')}
                        />
                    ) : (
                        <div className={isSystemRoot ? 'w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl' : 'w-full'}>
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
                                    onBack={() => { }} // No back button in this layout
                                    onForgotPassword={() => setShowForgotPassword(true)}
                                    isDemo={isDemo}
                                    onDirectLogin={handleDirectLogin}
                                />
                            ) : (
                                <StaffLoginForm
                                    selectedRole={selectedRole as UserRole}
                                    roles={roleDefinitions.map(r => ({ ...r, themeColor: r.color, desc: '' }))}
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
                                    onBack={() => { if (isSystemRoot) setSelectedRole(null as any) }}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Login As Section */}
                {!isSystemRoot && (
                    <div className="mt-2">
                        <div className="flex items-center gap-2 mb-3 text-xs text-gray-400 font-medium uppercase tracking-wider">
                            <span>Login As</span>
                            <ArrowRight size={12} className="rotate-90" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {roleDefinitions.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => handleRoleChange(role.id)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 border ${selectedRole === role.id
                                        ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm ring-1 ring-brand-200'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-brand-200 hover:text-brand-600'
                                        }`}
                                >
                                    {role.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Side: Image - Hidden on root domain because we use it as background */}
            {!isSystemRoot && (
                <div className="hidden lg:block lg:w-1/2 relative bg-gray-100 sticky top-0 h-screen">
                    <img
                        src="/login-bg-african.png"
                        alt="African Classroom"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
            )}

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

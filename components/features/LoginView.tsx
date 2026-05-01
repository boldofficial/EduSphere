'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Utils from '@/lib/utils';
import { useSchoolStore } from '@/lib/store';
import { UserRole } from '@/lib/types';
import {
    ShieldCheck,
    Users,
    GraduationCap,
    Briefcase,
    ArrowRight,
} from 'lucide-react';
import { StaffLoginForm } from './login/StaffLoginForm';
import { StudentLoginForm } from './login/StudentLoginForm';
import { FindSchoolSection } from './login/FindSchoolSection';
import { ForgotPasswordModal } from './login/ForgotPasswordModal';
import { resolveTenantFromHost } from '@/lib/tenant-host';
import { TwoFactorVerify } from './auth/TwoFactorVerify';

export const LoginView = () => {
    const router = useRouter();
    const { login } = useSchoolStore();
    const [publicBranding, setPublicBranding] = useState({
        school_name: 'Registra',
        logo_media: null as string | null,
        domain: '' as string,
    });

    const [isDemo, setIsDemo] = useState(false);
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

    // 2FA state
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [twoFactorTempToken, setTwoFactorTempToken] = useState('');
    const [pendingUser, setPendingUser] = useState<{id: number; username: string; email: string; role: string} | null>(null);

    const resolveTenantContext = () => {
        if (typeof window === 'undefined') {
            return { isRoot: true, tenantId: '' };
        }

        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
        const resolved = resolveTenantFromHost(window.location.host, rootDomain);
        return {
            isRoot: resolved.isRootHost,
            tenantId: resolved.tenantId || '',
        };
    };

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
        if (typeof window === 'undefined') return;

        const { isRoot, tenantId } = resolveTenantContext();
        setIsSystemRoot(isRoot);
        setIsDemo(tenantId === 'demo');

        if (!isRoot) {
            setSelectedRole('teacher');

            const loadPublicBranding = async () => {
                try {
                    const res = await fetch('/api/proxy/core/public-settings/', {
                        headers: { 'x-tenant-id': tenantId },
                        cache: 'no-store',
                    });

                    if (!res.ok) return;
                    const data = await res.json();
                    setPublicBranding({
                        school_name: data.school_name || 'Registra',
                        logo_media: data.logo_media || null,
                        domain: data.domain || '',
                    });
                } catch {
                    // Keep default branding fallback
                }
            };
            if (tenantId) {
                loadPublicBranding();
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
                tenantSlug = resolveTenantContext().tenantId;
            }

            if (!tenantSlug && selectedRole !== 'super_admin') {
                setLoginError('Unable to resolve school portal. Please use your school login link.');
                setIsLoading(false);
                return;
            }

            let usernamePayload = email.trim().toLowerCase();
            if (selectedRole === 'student' && tenantSlug) {
                const usernameTenant = publicBranding.domain || tenantSlug;
                usernamePayload = `${email}@${usernameTenant}`;
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
            
            // Check if 2FA is required
            if (data.requires_2fa) {
                setPendingUser(data.user);
                setTwoFactorTempToken(data.temp_token);
                setShowTwoFactor(true);
                setIsLoading(false);
                return;
            }

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
            let tenantSlug = isSystemRoot ? searchSlug : resolveTenantContext().tenantId;
            if (!tenantSlug && isSystemRoot) {
                setLoginError('Please find your school first.');
                setIsLoading(false);
                return;
            }
            if (!tenantSlug) {
                setLoginError('Unable to resolve school portal. Please use your school login link.');
                setIsLoading(false);
                return;
            }
            const usernameTenant = publicBranding.domain || tenantSlug;

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantSlug },
                body: JSON.stringify({ username: `${studentNo.trim()}@${usernameTenant}`, password }),
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

    // 2FA handlers
    const handleTwoFactorVerify = async (code: string) => {
        const res = await fetch('/api/auth/2fa-verify', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${twoFactorTempToken}`
            },
            body: JSON.stringify({ code }),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Invalid verification code');
        }

        const data = await res.json();
        
        // Set the actual tokens
        const cookieStore = await import('next/headers').then(m => m.cookies());
        cookieStore.set('access_token', data.access, { httpOnly: true, path: '/' });
        cookieStore.set('refresh_token', data.refresh, { httpOnly: true, path: '/' });

        // Complete login
        if (pendingUser) {
            const role = pendingUser.role === 'super_admin' ? 'super_admin' : 
                        pendingUser.role === 'SCHOOL_ADMIN' ? 'admin' : 
                        pendingUser.role?.toLowerCase() || 'admin';
            login(role as UserRole, { 
                id: pendingUser.id, 
                name: pendingUser.username, 
                email: pendingUser.email, 
                role 
            });
        }
        
        setShowTwoFactor(false);
        router.push('/dashboard');
    };

    const handleTwoFactorCancel = () => {
        setShowTwoFactor(false);
        setTwoFactorTempToken('');
        setPendingUser(null);
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
            const envRootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '';
            const normalizedEnvRoot = envRootDomain.split(':')[0];
            const currentHost = window.location.hostname;
            const isLocalDevHost = currentHost === 'localhost' || currentHost.endsWith('.localhost');
            const effectiveRoot = isLocalDevHost ? 'localhost' : (normalizedEnvRoot || 'myregistra.net');
            const portSuffix = isLocalDevHost && !data.custom_domain && window.location.port ? `:${window.location.port}` : '';
            const targetHost = data.custom_domain || `${data.slug}.${effectiveRoot}`;
            window.location.href = `${window.location.protocol}//${targetHost}${portSuffix}/login`;
        } catch (err: any) {
            setSearchError(err.message);
            setIsSearching(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotError('');
        setIsLoading(true);
        try {
            const res = await fetch('/api/proxy/users/password-reset-request/', {
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
        <div className={`flex min-h-screen ${isSystemRoot ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
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
            <div className={`flex-1 flex flex-col justify-center items-center px-6 md:px-16 xl:px-24 py-12 relative z-10 ${isSystemRoot ? '' : 'lg:w-1/2 relative'}`}>
                {/* Decorative blob */}
                {!isSystemRoot && (
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                        <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
                    </div>
                )}
                <div className={`w-full ${isSystemRoot && selectedRole !== 'super_admin' ? 'max-w-4xl' : 'max-w-md'}`}>
                <div className="mb-10 w-full flex justify-start">
                    <div
                        className="inline-block cursor-pointer transition-transform active:scale-95"
                        onClick={handleLogoClick}
                    >
                        {!isSystemRoot ? (
                            <div className="flex items-center gap-3">
                                <img src={Utils.getMediaUrl(publicBranding.logo_media) || "/footer-logo.png"} alt={publicBranding.school_name || "Registra"} className="h-10 w-auto object-contain" />
                                <span className="text-xl font-bold text-gray-900">{publicBranding.school_name || "Registra"}</span>
                            </div>
                        ) : (
                            <img src="/footer-logo.png" alt="Registra" className="h-10 w-auto object-contain brightness-110 contrast-110 drop-shadow-lg" />
                        )}
                    </div>
                </div>

                {(isSystemRoot && selectedRole !== 'super_admin') ? null : (
                    <div className="mb-8 w-full text-left">
                        <h1 className={`text-3xl font-extrabold mb-2 tracking-tight ${isSystemRoot ? 'text-white' : 'text-gray-900'}`}>Welcome back 👋</h1>
                        <p className={`text-sm font-medium ${isSystemRoot ? 'text-brand-100/70' : 'text-gray-500'}`}>
                            Enter your {selectedRole === 'student' ? 'student number' : 'email'} and password to access your account.
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
                        <div className={isSystemRoot ? 'w-full max-w-md bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20' : 'w-full bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50'}>
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
                    <div className="mt-8">
                        <div className="flex items-center gap-2 mb-4 text-xs text-gray-400 font-bold uppercase tracking-widest">
                            <span>Login As</span>
                            <div className="h-px bg-gray-300 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {roleDefinitions.map((role) => {
                                const Icon = role.icon;
                                const isActive = selectedRole === role.id;
                                return (
                                    <button
                                        key={role.id}
                                        onClick={() => handleRoleChange(role.id)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl text-xs font-semibold transition-all duration-300 group ${isActive
                                            ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-500/30 scale-105'
                                            : 'bg-white/60 border border-white/80 text-gray-600 hover:bg-white hover:shadow-md hover:-translate-y-1'
                                            }`}
                                    >
                                        <Icon size={20} className={`mb-1.5 ${isActive ? 'text-white' : role.color} transition-colors`} />
                                        {role.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                </div>
            </div>

            {/* Right Side: Image - Hidden on root domain because we use it as background */}
            {!isSystemRoot && (
                <div className="hidden lg:block lg:w-1/2 relative bg-gray-100 sticky top-0 h-screen">
                    <img
                        src="/login-bg-african.png"
                        alt="African Classroom"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-900/60 via-purple-900/40 to-black/80 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-12 text-white">
                        <h2 className="text-4xl font-bold mb-4">Empowering Education.</h2>
                        <p className="text-lg text-gray-200 max-w-lg">
                            Experience a beautiful, seamless, and powerful school management system designed for modern institutions.
                        </p>
                    </div>
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

            {/* Two-Factor Authentication Modal */}
            {showTwoFactor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <TwoFactorVerify
                        onVerify={handleTwoFactorVerify}
                        onUseBackupCode={handleTwoFactorVerify}
                        onCancel={handleTwoFactorCancel}
                    />
                </div>
            )}
        </div>
    );
};

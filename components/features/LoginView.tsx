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
    const { login } = useSchoolStore();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

    const isDemo = false; // Disabled Demo Mode
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

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const host = window.location.host.split(':')[0].replace(/^www\./, '');
            const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net').split(':')[0].replace(/^www\./, '');

            const isRoot =
                host === rootDomain ||
                host === 'localhost' ||
                (host.includes('vercel.app') && !host.includes('-'));

            setIsSystemRoot(isRoot);
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

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center p-4 md:p-6 font-primary overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: "url('/login-bg-classroom.png')" }} />
                <div className="absolute inset-0 bg-brand-950/80 backdrop-blur-[1px]" />
            </div>

            <a href="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 hover:bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                <ArrowRight className="rotate-180" size={18} />
                <span className="text-sm font-bold">Back to Home</span>
            </a>

            <div className="w-full max-w-6xl space-y-8 relative z-10 animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                <div className="text-center space-y-4">
                    {!isSystemRoot ? (
                        <>
                            <div className="inline-block p-4 bg-white rounded-3xl shadow-2xl mb-4 border-4 border-white">
                                <img src={settings.logo_media || "/logo.png"} alt={settings.school_name || "School Logo"} className="h-24 md:h-32 object-contain" />
                            </div>
                            <h1 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tight drop-shadow-md">{settings.school_name}</h1>
                        </>
                    ) : (
                        <div className="inline-block mb-4 cursor-pointer select-none active:scale-95 transition-transform" onClick={() => {
                            const newCount = adminSecretCount + 1;
                            setAdminSecretCount(newCount);
                            if (newCount >= 5) { setShowSystemLogin(true); setAdminSecretCount(0); }
                        }}>
                            <div className="h-24 md:h-32 flex items-center justify-center mb-8">
                                <img src="/footer-logo.png" alt="Registra" className="h-full w-auto object-contain drop-shadow-md" />
                            </div>
                        </div>
                    )}
                    <p className="text-brand-100 text-base md:text-xl font-medium max-w-2xl mx-auto">
                        {!isSystemRoot
                            ? (selectedRole === 'student' ? 'Enter your Student Number and Password to access your portal.' : 'Welcome to the digital campus. Select your portal to proceed.')
                            : (showSystemLogin ? 'System Management Access Granted.' : 'Enter your school subdomain to find your specific portal.')
                        }
                    </p>
                </div>

                {!selectedRole && !isSystemRoot && (
                    <RoleSelection roles={roleDefinitions} onSelectRole={setSelectedRole} />
                )}

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

                {selectedRole === 'student' && (
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
                    />
                )}

                {selectedRole && selectedRole !== 'student' && (
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
                        onDirectLogin={(role) => login(role, { id: 'demo', name: 'Demo User', role })}
                        onBack={() => { setSelectedRole(null); resetForms(); }}
                    />
                )}

                <div className="pt-12 pb-6 text-center z-10 w-full px-4">
                    <p className="text-[10px] md:text-xs text-brand-100/60 font-medium flex items-center justify-center gap-1.5 bg-black/40 px-6 py-2 rounded-full backdrop-blur-sm inline-flex">
                        &copy; {new Date().getFullYear()} Bold Ideas Innovations Ltd <ShieldCheck size={10} />
                    </p>
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

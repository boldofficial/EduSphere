'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSchoolStore } from '@/lib/store';
import { useStudents, useSettings } from '@/lib/hooks/use-data';
import { UserRole, Student } from '@/lib/types';
import {
    ShieldCheck,
    Users,
    GraduationCap,
    ArrowRight,
    Briefcase,
    AlertCircle,
    Eye,
    EyeOff,
    Mail,
    CheckCircle,
    KeyRound,
    Globe,
    School
} from 'lucide-react';
import * as Utils from '@/lib/utils';

export const LoginView = () => {
    const router = useRouter();
    const { login } = useSchoolStore();
    // Use TanStack Query for data
    const { data: students = [] } = useStudents();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
    const isDemo = false; // Disabled Demo Mode
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

    // Student/Parent login form state
    const [studentNo, setStudentNo] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState(''); // Added for admin login
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

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const host = window.location.host;
            const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

            // Flexible detection: 
            // 1. Matches configured root
            // 2. Contains ".vercel.app" (unless it has a prefix like "school.")
            // 3. Doesn't have a subdomain part (no dots before the main domain)
            const isRoot = host === rootDomain ||
                host === `www.${rootDomain}` ||
                (host.includes('.vercel.app') && !host.includes('--')) || // Simple Vercel check
                !host.includes('.') ||
                host.startsWith('localhost:');

            setIsSystemRoot(isRoot);
        }
    }, []);

    // Forgot password state
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotStudentNo, setForgotStudentNo] = useState('');
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    const roles = [
        {
            id: 'super_admin' as UserRole,
            name: 'Super Admin',
            icon: ShieldCheck,
            color: 'bg-indigo-600',
            desc: 'Global System Control'
        },
        {
            id: 'admin' as UserRole,
            name: 'Admin',
            icon: ShieldCheck,
            color: 'bg-blue-600',
            desc: 'System Administration'
        },
        {
            id: 'teacher' as UserRole,
            name: 'Teacher',
            icon: Users,
            color: 'bg-green-600',
            desc: 'Class & Grade Management'
        },
        {
            id: 'student' as UserRole,
            name: 'Student / Parent',
            icon: GraduationCap,
            color: 'bg-purple-600',
            desc: 'Academic Portal'
        },
        {
            id: 'staff' as UserRole,
            name: 'Non Teaching',
            icon: Briefcase,
            color: 'bg-amber-600',
            desc: 'Operations Dashboard'
        },
    ];

    const handleFindSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        setSearchError('');
        setIsSearching(true);

        try {
            const res = await fetch(`/api/proxy/schools/verify-slug/${searchSlug.trim().toLowerCase()}/`);
            if (!res.ok) {
                throw new Error('School not found. Please check the spelling.');
            }
            const data = await res.json();

            // Construct the login URL for the found school
            const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
            const targetDomain = data.custom_domain || `${data.slug}.${rootDomain}`;

            // Using window.location.href to handle cross-origin redirect if necessary
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
            // Determine tenant slug
            let tenantSlug = '';

            if (isSystemRoot) {
                if (!searchSlug && selectedRole !== 'super_admin') {
                    // If searching for school
                    setLoginError('Please find your school first.');
                    setIsLoading(false);
                    return;
                }
                tenantSlug = searchSlug;
            } else {
                const host = window.location.host;
                const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
                tenantSlug = host.replace(`.${rootDomain}`, '');
            }

            // For Super Admin, we might not have a tenant, OR we might be logging into a specific tenant as super admin.
            // But usually Super Admin accounts are global or attached to 'preschool' (default).
            // Let's pass the tenantSlug if we have it.

            // Username logic:
            // For students, we append the @tenant suffix to match the backend unique username format
            // while allowing students to type just their ID (e.g., '001')
            let usernamePayload = email;
            if (selectedRole === 'student' && tenantSlug) {
                usernamePayload = `${email}@${tenantSlug}`;
            }

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-tenant-id': tenantSlug
                },
                body: JSON.stringify({
                    username: usernamePayload,
                    password
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Login failed');
            }

            const data = await res.json();

            // Update store
            const role = selectedRole || 'admin';
            login(role, {
                id: data.user.id,
                name: data.user.username,
                email: email,
                role: role
            });

            if (role === 'super_admin') {
                router.push('/dashboard/super-admin');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
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
            // Determine tenant slug
            let tenantSlug = '';

            if (isSystemRoot) {
                // If on root domain, we rely on the searched school or can't login as student directly without context
                // But usually students are at school.edusphere.ng
                if (!searchSlug) {
                    setLoginError('Please find your school first.');
                    setIsLoading(false);
                    return;
                }
                tenantSlug = searchSlug;
            } else {
                // Extract from hostname
                const host = window.location.host;
                const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
                tenantSlug = host.replace(`.${rootDomain}`, '');
            }

            // Construct scoped username matching backend format: ST001@vine-heritage
            const scopedUsername = `${studentNo.trim()}@${tenantSlug}`;

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-tenant-id': tenantSlug // Pass explicit tenant header
                },
                body: JSON.stringify({
                    username: scopedUsername,
                    password: password
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Invalid Student Number or Password');
            }

            const data = await res.json();

            // Store student session
            login('student', {
                id: data.user.id,
                name: data.user.username, // or fetch real name
                email: data.user.email,
                role: 'student'
            });

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Student login error:', err);
            setLoginError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setForgotError('');
        setIsLoading(true);

        const student = students.find(
            (s: Student) => s.student_no.toLowerCase() === forgotStudentNo.toLowerCase().trim()
        );

        setTimeout(() => {
            setIsLoading(false);

            if (!student) {
                setForgotError('Student not found. Please check your Student Number.');
                return;
            }

            if (!student.parent_email) {
                setForgotError('No email on file. Please contact the school admin.');
                return;
            }

            if (student.parent_email.toLowerCase() !== forgotEmail.toLowerCase().trim()) {
                setForgotError('Email does not match our records.');
                return;
            }

            // Generate new password and update student record
            const generatedPassword = 'Pass' + Math.random().toString(36).substring(2, 8);
            setNewPassword(generatedPassword);

            // Update student in storage
            const updatedStudents = students.map((s: Student) =>
                s.id === student.id ? { ...s, password: generatedPassword, updated_at: Date.now() } : s
            );
            Utils.saveToStorage(Utils.STORAGE_KEYS.STUDENTS, updatedStudents);

            setForgotSuccess(true);
        }, 1000);
    };

    const handleDirectLogin = (role: UserRole) => {
        const mockUser = {
            role: role,
            name: 'Demo User',
            student_id: undefined
        };
        login(role, mockUser);
    };

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center p-4 md:p-6 font-primary overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/favicon.png')" }}
                />
                <div className="absolute inset-0 bg-brand-900/60 backdrop-blur-[2px]" />
            </div>

            {/* Return to Home Button */}
            <a href="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 hover:bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                <ArrowRight className="rotate-180" size={18} />
                <span className="text-sm font-bold">Back to Home</span>
            </a>

            <div className="w-full max-w-6xl space-y-8 relative z-10 animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                <div className="text-center space-y-4">
                    {!isSystemRoot ? (
                        <>
                            <div className="inline-block p-4 bg-white rounded-3xl shadow-2xl mb-4 border-4 border-white">
                                <img
                                    src={settings.logo_media || '/fruitful_logo_main.png'}
                                    alt="Logo"
                                    className="h-24 md:h-32 object-contain"
                                />
                            </div>
                            <h1 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tight drop-shadow-md">
                                {settings.school_name}
                            </h1>
                        </>
                    ) : (
                        <>
                            <div className="inline-block p-4 bg-white rounded-3xl shadow-2xl mb-4 border-4 border-white cursor-pointer select-none active:scale-95 transition-transform"
                                onClick={() => {
                                    const newCount = adminSecretCount + 1;
                                    setAdminSecretCount(newCount);
                                    if (newCount >= 5) {
                                        setShowSystemLogin(true);
                                        setAdminSecretCount(0);
                                    }
                                }}
                            >
                                <div className="w-24 h-24 md:w-32 md:h-32 bg-brand-600 rounded-2xl flex items-center justify-center text-white">
                                    <Globe size={48} />
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight drop-shadow-md">
                                SchoolSync<span className="text-accent-500">.ng</span>
                            </h1>
                        </>
                    )}
                    <p className="text-brand-100 text-base md:text-xl font-medium max-w-2xl mx-auto">
                        {!isSystemRoot
                            ? (selectedRole === 'student' ? 'Enter your Student Number and Password to access your portal.' : 'Welcome to the digital campus. Select your portal to proceed.')
                            : (showSystemLogin ? 'System Management Access Granted.' : 'Enter your school subdomain to find your specific portal.')
                        }
                    </p>
                </div>

                {/* Role Selection Cards */}
                {!selectedRole && !isSystemRoot && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-0 w-full">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className="group relative bg-black/40 backdrop-blur-md rounded-3xl p-6 border transition-all duration-300 text-left hover:-translate-y-2 border-white/10 hover:bg-black/60 hover:border-white/30"
                            >
                                <div className={`${role.color} w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white mb-4 md:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <role.icon size={24} className="md:w-7 md:h-7" />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-white mb-2">{role.name}</h3>
                                <p className="text-xs md:text-sm text-gray-200 mb-6 font-medium leading-relaxed">{role.desc}</p>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">
                                    Access Portal <ArrowRight size={14} />
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* System Root View: Find School or Secret Super Admin */}
                {isSystemRoot && !selectedRole && (
                    <div className={`w-full max-w-4xl grid grid-cols-1 ${showSystemLogin ? 'md:grid-cols-2' : 'max-w-md'} gap-8 px-4`}>
                        {/* Search Section */}
                        <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col justify-center">
                            <h2 className="text-3xl font-black text-gray-900 mb-2">Find your School</h2>
                            <p className="text-gray-500 mb-8 font-medium">Enter your school's unique ID or subdomain to access your portal.</p>

                            <form onSubmit={handleFindSchool} className="space-y-6">
                                <div>
                                    <div className="relative">
                                        <School className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            value={searchSlug}
                                            onChange={e => setSearchSlug(e.target.value)}
                                            placeholder="e.g. vine-heritage"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-bold"
                                            required
                                        />
                                    </div>
                                    {searchError && (
                                        <p className="text-red-600 text-sm mt-2 font-medium flex items-center gap-1">
                                            <AlertCircle size={14} /> {searchError}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSearching ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    ) : (
                                        <>
                                            Find Portal <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Onboarding Link */}
                            <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                                <p className="text-gray-500 font-medium mb-3">Not registered yet?</p>
                                <Link href="/onboarding" className="text-brand-600 hover:text-brand-700 font-bold flex items-center justify-center gap-1 group">
                                    Create a school portal
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* Super Admin Section (Hidden by default) */}
                        {showSystemLogin && (
                            <div className="bg-black/40 backdrop-blur-md rounded-3xl p-8 border border-white/10 flex flex-col justify-between animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2">System Login</h3>
                                    <p className="text-brand-100/70 mb-8">Access the platform management dashboard. For Super Admins only.</p>
                                </div>

                                <button
                                    onClick={() => setSelectedRole('super_admin')}
                                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2"
                                >
                                    Login as Super Admin <ArrowRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Student/Parent Login Form */}
                {selectedRole === 'student' && (
                    <div className="w-full max-w-md animate-in slide-in-from-bottom-6 fade-in duration-500">
                        <div className="bg-white rounded-3xl shadow-2xl p-8">
                            <div className="text-center mb-6">
                                <div className="h-14 w-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <GraduationCap size={28} className="text-purple-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Student / Parent Portal</h2>
                            </div>

                            <form onSubmit={handleStudentLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Student Number</label>
                                    <input
                                        type="text"
                                        value={studentNo}
                                        onChange={e => { setStudentNo(e.target.value); setLoginError(''); }}
                                        placeholder="e.g. ST001"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                                            placeholder="Enter your password"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-12"
                                            required
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {loginError && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                                        <AlertCircle size={18} />
                                        {loginError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    ) : (
                                        <>
                                            Login to Portal
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="flex items-center justify-between mt-4">
                                <button onClick={() => { setSelectedRole(null); setLoginError(''); setStudentNo(''); setPassword(''); }} className="text-sm text-gray-500 hover:text-gray-700 font-medium">
                                    ← Back
                                </button>
                                <button onClick={() => setShowForgotPassword(true)} className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                                    Forgot Password?
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Direct Login for Admin/Teacher/Staff */}
                {/* Login Form for Admin/Teacher/Staff */}
                {selectedRole && selectedRole !== 'student' && (
                    <div className="w-full max-w-md animate-in slide-in-from-bottom-6 fade-in duration-500">
                        <div className="bg-white rounded-3xl shadow-2xl p-8">
                            <div className="text-center mb-6">
                                <div className={`h-14 w-14 ${roles.find(r => r.id === selectedRole)?.color.replace('bg-', 'bg-').replace('600', '100')} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                    {(() => {
                                        const Icon = roles.find(r => r.id === selectedRole)?.icon;
                                        return Icon ? <Icon size={28} className={roles.find(r => r.id === selectedRole)?.color.replace('bg-', 'text-')} /> : null;
                                    })()}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{roles.find(r => r.id === selectedRole)?.name} Login</h2>
                            </div>

                            {/* Show Direct Login button ONLY in Demo Mode */}
                            {isDemo ? (
                                <div className="flex flex-col gap-4">
                                    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm flex items-start gap-2">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <p>You are in <strong>Demo Mode</strong>. Click to login instantly without credentials.</p>
                                    </div>
                                    <button
                                        onClick={() => handleDirectLogin(selectedRole)}
                                        className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        Enter as {roles.find(r => r.id === selectedRole)?.name}
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            ) : (
                                /* Real API Login Form */
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={e => { setEmail(e.target.value); setLoginError(''); }}
                                                placeholder={`admin@school.com`}
                                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                        <div className="relative">
                                            <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                                                placeholder="Enter your password"
                                                className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                                required
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    {loginError && (
                                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                                            <AlertCircle size={18} />
                                            {loginError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        ) : (
                                            <>
                                                Login
                                                <ArrowRight size={20} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            <div className="flex justify-center mt-6">
                                <button onClick={() => { setSelectedRole(null); setLoginError(''); setEmail(''); setPassword(''); }} className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
                                    ← Select a different role
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-12 pb-6 text-center z-10 w-full px-4">
                    <p className="text-[10px] md:text-xs text-brand-100/60 font-medium flex items-center justify-center gap-1.5 bg-black/40 px-6 py-2 rounded-full backdrop-blur-sm inline-flex">
                        &copy; {new Date().getFullYear()} Bold Ideas Innovations Ltd <ShieldCheck size={10} />
                    </p>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setForgotError(''); setForgotStudentNo(''); setForgotEmail(''); }}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 fade-in duration-300" onClick={e => e.stopPropagation()}>
                        {!forgotSuccess ? (
                            <>
                                <div className="text-center mb-6">
                                    <div className="h-14 w-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <KeyRound size={28} className="text-purple-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
                                    <p className="text-sm text-gray-500 mt-2">Enter your Student Number and registered email to reset your password.</p>
                                </div>

                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Number</label>
                                        <input
                                            type="text"
                                            value={forgotStudentNo}
                                            onChange={e => { setForgotStudentNo(e.target.value); setForgotError(''); }}
                                            placeholder="e.g. ST001"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Registered Parent Email</label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                value={forgotEmail}
                                                onChange={e => { setForgotEmail(e.target.value); setForgotError(''); }}
                                                placeholder="parent@example.com"
                                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {forgotError && (
                                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                                            <AlertCircle size={18} />
                                            {forgotError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </button>
                                </form>

                                <button onClick={() => { setShowForgotPassword(false); setForgotError(''); setForgotStudentNo(''); setForgotEmail(''); }} className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 font-medium">
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <div className="text-center">
                                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle size={32} className="text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
                                <p className="text-gray-600 mb-6">Your new password has been generated. Please save it securely.</p>
                                <div className="bg-gray-100 rounded-xl p-4 mb-6">
                                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">New Password</p>
                                    <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">{newPassword}</p>
                                </div>
                                <p className="text-xs text-gray-500 mb-6">In a real system, this password would be sent to your registered email.</p>
                                <button
                                    onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setForgotStudentNo(''); setForgotEmail(''); }}
                                    className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

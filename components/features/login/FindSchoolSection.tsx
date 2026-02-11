'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, School, ShieldCheck, AlertCircle } from 'lucide-react';
import { UserRole } from '@/lib/types';

interface FindSchoolSectionProps {
    searchSlug: string;
    setSearchSlug: (slug: string) => void;
    searchError: string;
    isSearching: boolean;
    showSystemLogin: boolean;
    onFindSchool: (e: React.FormEvent) => void;
    onSelectSuperAdmin: () => void;
}

export const FindSchoolSection: React.FC<FindSchoolSectionProps> = ({
    searchSlug,
    setSearchSlug,
    searchError,
    isSearching,
    showSystemLogin,
    onFindSchool,
    onSelectSuperAdmin
}) => {
    return (
        <div className={`w-full max-w-4xl grid grid-cols-1 ${showSystemLogin ? 'md:grid-cols-2' : 'max-w-md'} gap-8 px-4`}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col justify-center">
                <h2 className="text-3xl font-black text-gray-900 mb-2">Find your School</h2>
                <p className="text-gray-500 mb-8 font-medium">Enter your school's unique ID or subdomain to access your portal.</p>

                <form onSubmit={onFindSchool} className="space-y-6">
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

                <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                    <p className="text-gray-500 font-medium mb-3">Not registered yet?</p>
                    <Link href="/onboarding" className="text-brand-600 hover:text-brand-700 font-bold flex items-center justify-center gap-1 group">
                        Create a school portal
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

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
                        onClick={onSelectSuperAdmin}
                        className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2"
                    >
                        Login as Super Admin <ArrowRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

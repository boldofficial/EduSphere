import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GraduationCap, Menu, X } from 'lucide-react';

interface SiteHeaderProps {
    settings: {
        school_name?: string;
        logo_media?: string | null;
        landing_primary_color?: string;
        school_tagline?: string;
    }
}

const SiteHeader = ({ settings }: SiteHeaderProps) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '/#home', label: 'Home' },
        { href: '/#about', label: 'About' },
        { href: '/#programs', label: 'Programs' },
        { href: '/#features', label: 'Features' },
        { href: '/#contact', label: 'Contact' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg py-2'
            : 'bg-transparent py-4'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Logo & School Name */}
                    <Link href="/" className="flex items-center gap-3">
                        {settings.logo_media ? (
                            <img src={settings.logo_media} alt="Logo" className="h-12 w-12 rounded-xl object-contain bg-white/10" />
                        ) : (
                            <div className="h-12 w-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                <GraduationCap size={24} />
                            </div>
                        )}
                        <div className={`transition-colors duration-300 ${isScrolled ? 'text-brand-900' : 'text-white'}`}>
                            <h1 className="text-xl font-bold leading-none">{settings.school_name || "Fruitful Vine"}</h1>
                            <p className={`text-xs font-medium ${isScrolled ? 'text-brand-500' : 'text-white/80'}`}>{settings.school_tagline || "Heritage Schools"}</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={`text-sm font-medium transition-colors hover:text-accent-400 ${isScrolled ? 'text-gray-700' : 'text-white/90'}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link href="/dashboard" className="px-6 py-2.5 bg-accent-500 hover:bg-accent-600 text-brand-900 font-bold rounded-xl transition-all shadow-lg hover:shadow-accent-500/30 transform hover:-translate-y-0.5">
                            Portal Access
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`p-2 rounded-lg transition-colors ${isScrolled ? 'text-gray-900' : 'text-white'}`}
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl md:hidden p-4 flex flex-col gap-4 animate-in slide-in-from-top-5">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-lg font-medium text-gray-700 py-2 border-b border-gray-50 last:border-0"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link
                        href="/dashboard"
                        className="w-full text-center py-3 bg-brand-600 text-white rounded-xl font-bold mt-2"
                    >
                        Portal Access
                    </Link>
                </div>
            )}
        </nav>
    );
};

export default SiteHeader;

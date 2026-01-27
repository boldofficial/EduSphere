import React from 'react';
import Link from 'next/link';
import { GraduationCap, Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';

interface SiteFooterProps {
    settings: {
        school_name?: string;
        school_email?: string;
        school_phone?: string;
        school_address?: string;
        school_tagline?: string;
        logo_media?: string | null;
    }
}

const SiteFooter = ({ settings }: SiteFooterProps) => {
    return (
        <footer className="bg-brand-900 text-white pt-20 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Column 1: School Info */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            {settings.logo_media ? (
                                <div className="bg-white p-1 rounded-xl">
                                    <img src={settings.logo_media} alt="Logo" className="h-14 w-14 object-contain" />
                                </div>
                            ) : (
                                <div className="h-14 w-14 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                    <GraduationCap size={28} />
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-bold text-white leading-tight">Fruitful Vine</h3>
                                <p className="text-white text-lg font-bold leading-tight">Heritage Schools</p>
                            </div>
                        </div>
                        <p className="text-white leading-relaxed mb-4 text-sm">
                            A faith-based school dedicated to training and raising a total child with godly values and excellent character.
                        </p>
                        <p className="text-accent-400 italic text-sm font-medium mb-6">
                            {settings.school_tagline}
                        </p>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 text-white">Quick Links</h4>
                        <ul className="space-y-3">
                            <li><Link href="/" className="text-white hover:text-accent-400 transition-colors text-sm">Home</Link></li>
                            <li><Link href="/#about" className="text-white hover:text-accent-400 transition-colors text-sm">About Us</Link></li>
                            <li><Link href="/#features" className="text-white hover:text-accent-400 transition-colors text-sm">Features</Link></li>
                            <li><Link href="/#contact" className="text-white hover:text-accent-400 transition-colors text-sm">Contact</Link></li>
                            <li><Link href="/dashboard" className="text-white hover:text-accent-400 transition-colors text-sm">Portal Login</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Programs */}
                    <div id="programs">
                        <h4 className="font-bold text-lg mb-6 text-white">Our Programs</h4>
                        <ul className="space-y-3">
                            <li className="text-white text-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full"></div>
                                Playschool
                            </li>
                            <li className="text-white text-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full"></div>
                                Nursery
                            </li>
                            <li className="text-white text-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full"></div>
                                Kindergarten
                            </li>
                            <li className="text-white text-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full"></div>
                                Primary School
                            </li>
                            <li className="text-white text-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full"></div>
                                Extra-Curricular
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Contact Info */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 text-white">Contact Info</h4>
                        <ul className="space-y-4 mb-6">
                            <li className="flex items-center gap-3 text-white text-sm">
                                <div className="h-8 w-8 bg-brand-700 rounded-lg flex items-center justify-center shrink-0">
                                    <Phone size={14} className="text-accent-400" />
                                </div>
                                {settings.school_phone}
                            </li>
                            <li className="flex items-center gap-3 text-white text-sm">
                                <div className="h-8 w-8 bg-brand-700 rounded-lg flex items-center justify-center shrink-0">
                                    <Mail size={14} className="text-accent-400" />
                                </div>
                                <span className="break-all">info@fruitfulvineheritageschools.org.ng</span>
                            </li>
                            <li className="flex items-start gap-3 text-white text-sm">
                                <div className="h-8 w-8 bg-brand-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                    <MapPin size={14} className="text-accent-400" />
                                </div>
                                {settings.school_address}
                            </li>
                        </ul>

                        <div className="flex items-center gap-4">
                            <a href="https://facebook.com/fruitfulvineschools" target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-white/10 hover:bg-accent-500 rounded-lg flex items-center justify-center text-white transition-all duration-300">
                                <Facebook size={20} />
                            </a>
                            <a href="https://instagram.com/fruitfulvineschools" target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-white/10 hover:bg-accent-500 rounded-lg flex items-center justify-center text-white transition-all duration-300">
                                <Instagram size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Copyright Section */}
                <div className="border-t border-white/10 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex flex-col md:flex-row items-center gap-1 md:gap-4 text-center md:text-left">
                            <p className="text-white text-sm">
                                © {new Date().getFullYear()} Fruitful Vine Heritage Schools. All rights reserved.
                            </p>
                            <span className="hidden md:block text-white/30">|</span>
                            <p className="text-white/80 text-sm">
                                Developed by <a href="https://getboldideas.com/" target="_blank" rel="noopener noreferrer" className="text-accent-400 hover:text-white transition-colors">Bold Ideas Innovations Ltd</a>
                            </p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <Link href="/privacy-policy" className="text-white hover:text-accent-400 transition-colors">Privacy Policy</Link>
                            <Link href="/terms-of-service" className="text-white hover:text-accent-400 transition-colors">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default SiteFooter;

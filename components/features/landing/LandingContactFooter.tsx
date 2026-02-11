/**
 * Landing Contact & Footer
 *
 * Contact form + info section, and site-wide footer.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowRight, Phone, Mail, MapPin,
    Facebook, Twitter, Instagram, Youtube, Zap
} from 'lucide-react';

export const ContactSection: React.FC = () => (
    <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-16"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-bold mb-6">
                    <Phone size={16} />
                    Get In Touch
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                    Ready to Transform Your School?
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Join hundreds of schools already using Registra. Let&apos;s discuss how we can help your institution thrive.
                </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-16">
                {/* Contact Form */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
                >
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h3>
                    <form className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all" placeholder="John" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all" placeholder="Doe" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all" placeholder="john@school.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                            <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all" placeholder="Your School Name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                            <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all resize-none" placeholder="Tell us about your school and how we can help..." />
                        </div>
                        <button type="submit" className="w-full py-4 bg-gradient-to-r from-brand-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand-600/30 transition-all duration-300 flex items-center justify-center gap-2">
                            Send Message
                            <ArrowRight size={20} />
                        </button>
                    </form>
                </motion.div>

                {/* Contact Info */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 flex-shrink-0">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Phone</div>
                                    <div className="text-gray-600">+234 800 REGISTRA</div>
                                    <div className="text-sm text-gray-500">Mon-Fri 9AM-6PM WAT</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 flex-shrink-0">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Email</div>
                                    <div className="text-gray-600">hello@myregistra.net</div>
                                    <div className="text-sm text-gray-500">We&apos;ll respond within 24 hours</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 flex-shrink-0">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Office</div>
                                    <div className="text-gray-600">Lagos, Nigeria</div>
                                    <div className="text-sm text-gray-500">Serving schools nationwide</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Follow Us</h4>
                        <div className="flex gap-4">
                            {[
                                { icon: Facebook, href: '#' },
                                { icon: Twitter, href: '#' },
                                { icon: Instagram, href: '#' },
                                { icon: Youtube, href: '#' }
                            ].map((social, index) => (
                                <a key={index} href={social.href} className="w-12 h-12 bg-gray-100 hover:bg-brand-100 rounded-xl flex items-center justify-center text-gray-600 hover:text-brand-600 transition-colors">
                                    <social.icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    </section>
);

export const LandingFooter: React.FC = () => (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                {/* Brand Column */}
                <div className="space-y-6">
                    <div className="h-20 mb-6">
                        <img src="/footer-logo.png" alt="Registra" className="h-full w-auto object-contain" />
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        The complete school management platform for modern Nigerian educational institutions. Streamlining administration, enhancing learning, and driving academic excellence.
                    </p>
                    <div className="flex gap-4">
                        {[
                            { icon: Facebook, href: '#' },
                            { icon: Twitter, href: '#' },
                            { icon: Instagram, href: '#' },
                            { icon: Youtube, href: '#' }
                        ].map((social, index) => (
                            <a key={index} href={social.href} className="w-10 h-10 bg-gray-800 hover:bg-brand-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                                <social.icon size={18} />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Product Column */}
                <div>
                    <h4 className="font-bold text-white mb-6">Product</h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li><Link href="#features" className="hover:text-brand-400 transition-colors">Features</Link></li>
                        <li><Link href="#pricing" className="hover:text-brand-400 transition-colors">Pricing</Link></li>
                        <li><Link href="#demo" className="hover:text-brand-400 transition-colors">Request Demo</Link></li>
                        <li><Link href="/onboarding" className="hover:text-brand-400 transition-colors">Get Started</Link></li>
                        <li><Link href="/login" className="hover:text-brand-400 transition-colors">Sign In</Link></li>
                    </ul>
                </div>

                {/* Resources Column */}
                <div>
                    <h4 className="font-bold text-white mb-6">Resources</h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li><Link href="/help" className="hover:text-brand-400 transition-colors">Help Center</Link></li>
                        <li><Link href="/success-stories" className="hover:text-brand-400 transition-colors">School Success Stories</Link></li>
                        <li><Link href="/blog" className="hover:text-brand-400 transition-colors">Blog</Link></li>
                        <li><Link href="/resources" className="hover:text-brand-400 transition-colors">Video Tutorials</Link></li>
                        <li><Link href="/developers" className="hover:text-brand-400 transition-colors">API Documentation</Link></li>
                    </ul>
                </div>

                {/* Company Column */}
                <div>
                    <h4 className="font-bold text-white mb-6">Company</h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li><Link href="/#about" className="hover:text-brand-400 transition-colors">About Us</Link></li>
                        <li><Link href="/careers" className="hover:text-brand-400 transition-colors">Careers</Link></li>
                        <li><Link href="/#contact" className="hover:text-brand-400 transition-colors">Contact</Link></li>
                        <li><Link href="/privacy-policy" className="hover:text-brand-400 transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/terms-of-service" className="hover:text-brand-400 transition-colors">Terms of Service</Link></li>
                    </ul>
                </div>
            </div>

            <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} Registra. All rights reserved.
                </p>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                    <span>Powered by</span>
                    <a
                        href="https://getboldideas.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                    >
                        Bold Ideas Innovations Ltd.
                        <Zap size={12} className="fill-current" />
                    </a>
                </div>
            </div>
        </div>
    </footer>
);

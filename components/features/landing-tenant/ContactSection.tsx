import React, { useState } from 'react';
import { Phone, Mail, MapPin, CheckCircle, Send, Loader2, GraduationCap } from 'lucide-react';
import { Settings } from '@/lib/types';

interface ContactSectionProps {
    settings: Settings;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings }) => {
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [formMessage, setFormMessage] = useState('');

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('loading');
        setFormMessage('');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactForm)
            });

            const data = await response.json();

            if (response.ok) {
                setFormStatus('success');
                setFormMessage(data.message || 'Message sent successfully!');
                setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
            } else {
                setFormStatus('error');
                setFormMessage(data.error || 'Failed to send message. Please try again.');
            }
        } catch {
            setFormStatus('error');
            setFormMessage('Network error. Please check your connection and try again.');
        }
    };

    return (
        <section id="contact" className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-5 gap-12 bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                    <div className="lg:col-span-2 bg-brand-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 p-8 opacity-10">
                            <GraduationCap size={200} />
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold mb-2">Get in Touch</h3>
                            <p className="text-brand-100 mb-10">Visit us or send a message.</p>

                            <div className="space-y-8 relative z-10">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                        <Phone className="text-accent-400" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-brand-200">Phone</p>
                                        <p className="font-semibold text-lg">{settings.school_phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                        <Mail className="text-accent-400" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-brand-200">Email</p>
                                        <p className="font-semibold text-lg break-all">{settings.school_email || 'info@myregistra.net'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                        <MapPin className="text-accent-400" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-brand-200">Address</p>
                                        <p className="font-semibold text-lg">{settings.school_address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 p-8 md:p-10">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Send us a Message</h3>
                        <p className="text-gray-500 mb-6">We&apos;d love to hear from you. Fill out the form below.</p>

                        {formStatus === 'success' ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h4 className="text-lg font-bold text-green-800 mb-2">Message Sent!</h4>
                                <p className="text-green-700 text-sm">{formMessage}</p>
                                <button onClick={() => setFormStatus('idle')} className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium">Send another message</button>
                            </div>
                        ) : (
                            <form onSubmit={handleContactSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        required
                                        value={contactForm.name}
                                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
                                        placeholder="Full Name *"
                                    />
                                    <input
                                        type="email"
                                        required
                                        value={contactForm.email}
                                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
                                        placeholder="Email Address *"
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <input
                                        type="tel"
                                        value={contactForm.phone}
                                        onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
                                        placeholder="Phone Number"
                                    />
                                    <input
                                        type="text"
                                        value={contactForm.subject}
                                        onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
                                        placeholder="Subject"
                                    />
                                </div>
                                <textarea
                                    required
                                    rows={4}
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm resize-none"
                                    placeholder="How can we help you? *"
                                />
                                {formStatus === 'error' && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{formMessage}</div>}
                                <button
                                    type="submit"
                                    disabled={formStatus === 'loading'}
                                    className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-200"
                                >
                                    {formStatus === 'loading' ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : <><Send size={18} /> Send Message</>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

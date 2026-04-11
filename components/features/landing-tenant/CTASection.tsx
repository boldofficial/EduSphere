import React from 'react';
import Link from 'next/link';

export const CTASection: React.FC = () => {
    return (
        <section className="py-24 relative overflow-hidden text-center bg-brand-900 px-4">
            <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Join the Family?</h2>
                <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                    Admission for the next academic session is ongoing. Give your child the gift of a quality foundation.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/admission" className="px-10 py-4 bg-white text-brand-900 text-lg font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-xl">
                        Start Application
                    </Link>
                    <Link href="#contact" className="px-10 py-4 bg-transparent border-2 border-white/20 text-white text-lg font-bold rounded-xl hover:bg-white/10 transition-colors">
                        Contact Us
                    </Link>
                </div>
            </div>
        </section>
    );
};

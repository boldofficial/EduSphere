'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { X, Download, Smartphone, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

interface PWAContextType {
    isInstallable: boolean;
    isInstalled: boolean;
    isIOS: boolean;
    promptInstall: () => void;
    dismissPrompt: () => void;
}

const PWAContext = createContext<PWAContextType>({
    isInstallable: false,
    isInstalled: false,
    isIOS: false,
    promptInstall: () => {},
    dismissPrompt: () => {},
});

export const usePWA = () => useContext(PWAContext);

// Storage key to track if user dismissed the prompt
const DISMISSED_KEY = 'pwa-install-dismissed';
const DISMISSED_EXPIRY_DAYS = 7; // Show again after 7 days

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    // Check if user has dismissed the prompt recently
    const isDismissedRecently = useCallback(() => {
        if (typeof window === 'undefined') return true;
        const dismissed = localStorage.getItem(DISMISSED_KEY);
        if (!dismissed) return false;
        const dismissedTime = parseInt(dismissed, 10);
        const expiryTime = dismissedTime + (DISMISSED_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        return Date.now() < expiryTime;
    }, []);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // For iOS, show instructions if not dismissed
        if (isIOSDevice && !isDismissedRecently()) {
            setIsInstallable(true);
            // Show banner after a short delay
            const timer = setTimeout(() => {
                setShowBanner(true);
            }, 3000);
            return () => clearTimeout(timer);
        }

        // For other browsers, listen for beforeinstallprompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
            
            // Show banner after a short delay if not dismissed
            if (!isDismissedRecently()) {
                setTimeout(() => {
                    setShowBanner(true);
                }, 3000);
            }
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setShowBanner(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [isDismissedRecently]);

    const promptInstall = async () => {
        if (isIOS) {
            setShowIOSInstructions(true);
            return;
        }

        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                setIsInstalled(true);
                setShowBanner(false);
            }
            setDeferredPrompt(null);
        } catch (error) {
            console.error('Install prompt failed:', error);
        }
    };

    const dismissPrompt = () => {
        setShowBanner(false);
        setShowIOSInstructions(false);
        localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    };

    return (
        <PWAContext.Provider
            value={{
                isInstallable,
                isInstalled,
                isIOS,
                promptInstall,
                dismissPrompt,
            }}
        >
            {children}

            {/* Install Banner */}
            {showBanner && !isInstalled && (
                <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-slide-up">
                    <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-4 shadow-2xl">
                        <div className="max-w-4xl mx-auto flex items-center gap-4">
                            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                <Smartphone className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm sm:text-base">Install FVHS Portal</p>
                                <p className="text-xs sm:text-sm text-brand-100 truncate">
                                    Access your portal faster with our app!
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={promptInstall}
                                    className="bg-white text-brand-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-50 transition-colors flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    <span className="hidden sm:inline">Install</span>
                                </button>
                                <button
                                    onClick={dismissPrompt}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    aria-label="Dismiss"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* iOS Installation Instructions Modal */}
            {showIOSInstructions && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-in">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Install on iOS</h3>
                            <button
                                onClick={dismissPrompt}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center shrink-0 text-brand-600 font-bold">
                                    1
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Tap the Share button</p>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        Look for the <Share className="h-4 w-4 inline" /> icon at the bottom of Safari
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center shrink-0 text-brand-600 font-bold">
                                    2
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Tap "Add to Home Screen"</p>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        Look for the <Plus className="h-4 w-4 inline" /> icon in the menu
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center shrink-0 text-brand-600 font-bold">
                                    3
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Tap "Add"</p>
                                    <p className="text-sm text-gray-500">The app will appear on your home screen</p>
                                </div>
                            </div>
                        </div>
                        
                        <button
                            onClick={dismissPrompt}
                            className="w-full mt-6 bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </PWAContext.Provider>
    );
};

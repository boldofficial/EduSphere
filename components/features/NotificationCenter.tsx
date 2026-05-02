'use client';

import React, { useMemo, useState } from 'react';
import { Bell, Calendar, Circle, CreditCard, Megaphone, X } from 'lucide-react';
import Link from 'next/link';
import {
    useMarkAllNotificationsRead,
    useMarkNotificationRead,
    useNotifications,
} from '@/lib/hooks/use-data';

export const NotificationCenter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { data: notifications = [] } = useNotifications();
    const { mutate: markNotificationRead } = useMarkNotificationRead();
    const { mutate: markAllNotificationsRead } = useMarkAllNotificationsRead();

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.is_read).length,
        [notifications]
    );

    const iconForCategory = (category: string) => {
        switch (category) {
            case 'announcement':
                return { icon: Megaphone, color: 'text-blue-500' };
            case 'bursary':
                return { icon: CreditCard, color: 'text-red-500' };
            case 'academic':
            case 'attendance':
                return { icon: Calendar, color: 'text-yellow-500' };
            default:
                return { icon: Bell, color: 'text-green-500' };
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 max-h-[480px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-900">Notifications</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[400px]">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map((n) => {
                                        const { icon: Icon, color } = iconForCategory(n.category);
                                        return (
                                            <Link
                                                key={n.id}
                                                href={n.link || '/dashboard'}
                                                onClick={() => {
                                                    if (!n.is_read) {
                                                        markNotificationRead(n.id);
                                                    }
                                                    setIsOpen(false);
                                                }}
                                                className="block p-4 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 ${color}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-gray-900">{n.title}</p>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                                                        <p className="text-[10px] text-gray-400 mt-2">
                                                            {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    <div className="mt-1">
                                                        {!n.is_read && <Circle size={8} className="fill-brand-500 text-brand-500" />}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-400 italic text-sm">No new notifications.</div>
                            )}
                        </div>

                        {unreadCount > 0 && (
                            <div className="p-3 bg-gray-50 border-t text-center">
                                <button
                                    onClick={() => markAllNotificationsRead()}
                                    className="text-xs font-bold text-brand-600 hover:text-brand-700"
                                >
                                    Mark all as read
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

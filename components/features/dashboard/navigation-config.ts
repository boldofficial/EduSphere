import {
    LayoutDashboard, Users, BookOpen, GraduationCap,
    CalendarCheck, CreditCard, Database, Settings as SettingsIcon,
    ClipboardList, BadgeCheck, UserCog,
    Megaphone as AnnouncementIcon, Calendar, BarChart3, FileCheck, Newspaper, Mail,
    MessageSquare, Activity, Heart, Wallet, ScrollText, Globe
} from 'lucide-react';

export const NAVIGATION_ITEMS = [
    { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'General' },
    { id: 'students', name: 'Students', href: '/students', icon: GraduationCap, category: 'Administration' },
    { id: 'teachers', name: 'Teachers', href: '/teachers', icon: Users, category: 'Administration' },
    { id: 'staff', name: 'Non-Academic', icon: UserCog, href: '/staff', category: 'Administration' },
    { id: 'admissions', name: 'Admissions', href: '/admissions', icon: FileCheck, category: 'Administration' },
    { id: 'id_cards', name: 'ID Cards', href: '/id_cards', icon: BadgeCheck, category: 'Administration' },
    { id: 'classes', name: 'Classes', href: '/classes', icon: BookOpen, category: 'Academics' },
    { id: 'timetables', name: 'Timetable', href: '/timetable', icon: Calendar, category: 'Academics' },
    { id: 'learning', name: 'Learning Center', href: '/learning', icon: GraduationCap, category: 'Academics' },
    { id: 'grading', name: 'Grading', href: '/grading', icon: ClipboardList, category: 'Academics' },
    { id: 'attendance', name: 'Attendance', href: '/attendance', icon: CalendarCheck, category: 'Academics' },
    { id: 'broadsheet', name: 'Broadsheet', href: '/broadsheet', icon: ScrollText, category: 'Academics' },
    { id: 'calendar', name: 'Calendar', href: '/calendar', icon: Calendar, category: 'Academics' },
    { id: 'bursary', name: 'Bursary', href: '/bursary', icon: Wallet, category: 'Account' },
    { id: 'conduct', name: 'Conduct & Log', href: '/conduct', icon: Activity, category: 'Health & Conduct' },
    { id: 'messages', name: 'Messages', href: '/messages', icon: Mail, category: 'Messages' },
    { id: 'announcements', name: 'Announcements', href: '/announcements', icon: AnnouncementIcon, category: 'Messages' },
    { id: 'newsletter', name: 'Newsletter', href: '/newsletter', icon: Newspaper, category: 'Messages' },
    { id: 'cms', name: 'Website CMS', href: '/cms', icon: Globe, category: 'Tools' },
    { id: 'analytics', name: 'Analytics', href: '/analytics', icon: BarChart3, category: 'Tools' },
    { id: 'data', name: 'System Data', href: '/data', icon: Database, category: 'Tools' },
    { id: 'support', name: 'Support & Tickets', href: '/support', icon: MessageSquare, category: 'Tools' },
    { id: 'settings', name: 'Settings', href: '/settings', icon: SettingsIcon, category: 'Tools' },
];

export const NAVIGATION_CATEGORIES = [
    { name: 'General', icon: LayoutDashboard, color: 'text-white' },
    { name: 'Administration', icon: Users, color: 'text-blue-400' },
    { name: 'Academics', icon: BookOpen, color: 'text-emerald-400' },
    { name: 'Account', icon: CreditCard, color: 'text-amber-400' },
    { name: 'Health & Conduct', icon: Heart, color: 'text-rose-400' },
    { name: 'Messages', icon: Mail, color: 'text-purple-400' },
    { name: 'Tools', icon: SettingsIcon, color: 'text-slate-400' },
];

import React from 'react';
import { fetchServer } from '@/lib/api-server';
import { DashboardView } from '@/components/features/DashboardView';
import { TeacherDashboardView } from '@/components/features/TeacherDashboardView';
import { StudentDashboardView } from '@/components/features/StudentDashboardView';
import { StaffDashboardView } from '@/components/features/StaffDashboardView';
import * as Utils from '@/lib/utils';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    let user;
    try {
        user = await fetchServer('/users/me/');
    } catch (e) {
        // If auth fails on server, middleware should have caught it, 
        // but for safety redirect to login
        redirect('/login');
    }

    let currentRole = user?.role || 'student';

    // Normalize backend role to frontend role
    if (currentRole === 'SUPER_ADMIN') currentRole = 'super_admin';
    else if (currentRole === 'SCHOOL_ADMIN') currentRole = 'admin';
    else if (currentRole === 'TEACHER') currentRole = 'teacher';
    else if (currentRole === 'STUDENT') currentRole = 'student';
    else if (currentRole === 'PARENT') currentRole = 'parent';
    else if (currentRole === 'STAFF') currentRole = 'staff';

    // Parallel data fetching for the dashboard
    // We fetch everything needed for the Admin view. 
    // Optimization: conditionally fetch based on role.

    let students = [], teachers = [], staff = [], payments = [], expenses = [], fees = [], classes = [], settings = Utils.INITIAL_SETTINGS, announcements = [], schools = [], platformSettings = null, systemHealth = null, supportTickets = [];

    // Help normalize paginated DRF responses
    const normalize = (data: any) => {
        if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
            return data.results;
        }
        return Array.isArray(data) ? data : [];
    };

    if (currentRole === 'super_admin' || currentRole === 'admin' || currentRole === 'staff') {
        try {
            const results = await Promise.all([
                fetchServer('/students/').catch(() => []),
                fetchServer('/teachers/').catch(() => []),
                fetchServer('/staff/').catch(() => []),
                fetchServer('/payments/').catch(() => []),
                fetchServer('/expenses/').catch(() => []),
                fetchServer('/fees/').catch(() => []),
                fetchServer('/classes/').catch(() => []),
                fetchServer('/settings/').catch(() => Utils.INITIAL_SETTINGS),
                fetchServer('/schools/announcements/').catch(() => []),
                // Super Admin specific fetches
                currentRole === 'super_admin' ? fetchServer('/schools/management/').catch(() => []) : Promise.resolve([]),
                currentRole === 'super_admin' ? fetchServer('/schools/platform-settings/').catch(() => null) : Promise.resolve(null),
                currentRole === 'super_admin' ? fetchServer('/schools/analytics/strategic/').catch(() => null) : Promise.resolve(null),
                currentRole === 'super_admin' ? fetchServer('/schools/governance/').catch(() => null) : Promise.resolve(null),
                currentRole === 'super_admin' ? fetchServer('/schools/health/').catch(() => null) : Promise.resolve(null),
                currentRole === 'super_admin' ? fetchServer('/schools/support/tickets/').catch(() => []) : Promise.resolve([]),
            ]);

            students = normalize(results[0]);
            teachers = normalize(results[1]);
            staff = normalize(results[2]);
            payments = normalize(results[3]);
            expenses = normalize(results[4]);
            fees = normalize(results[5]);
            classes = normalize(results[6]);
            settings = results[7];
            announcements = normalize(results[8]);
            schools = normalize(results[9]);
            platformSettings = results[10];
            systemHealth = results[13];
            supportTickets = normalize(results[14]);

            // Inject extra data for Super Admin features
            if (currentRole === 'super_admin') {
                (user as any).analyticsData = results[11];
                (user as any).governanceData = results[12];
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    }
    else if (currentRole === 'teacher') {
        // Teachers need classes, students...
        try {
            const results = await Promise.all([
                fetchServer('/classes/').catch(() => []),
                fetchServer('/students/').catch(() => []), // Should probably filter by teacher on backend
                fetchServer('/settings/').catch(() => Utils.INITIAL_SETTINGS),
            ]);
            classes = normalize(results[0]);
            students = normalize(results[1]);
            settings = results[2];
        } catch (error) {
            console.error('Error fetching teacher data:', error);
        }
    } else {
        // Students/Parents
        try {
            [settings] = await Promise.all([
                fetchServer('/settings/').catch(() => Utils.INITIAL_SETTINGS),
            ]);
        } catch (error) {
            console.error('Error fetching student data:', error);
        }
    }

    if (currentRole === 'teacher') {
        return <TeacherDashboardView />;
    }

    if (currentRole === 'student' || currentRole === 'parent') {
        return <StudentDashboardView />;
    }

    if (currentRole === 'staff') {
        return <StaffDashboardView />;
    }

    // Admin View
    return (
        <DashboardView
            user={user}
            students={students}
            teachers={teachers}
            staff={staff}
            payments={payments}
            expenses={expenses}
            fees={fees}
            classes={classes}
            settings={settings}
            announcements={announcements}
            schools={schools}
            platformSettings={platformSettings}
            systemHealthData={systemHealth}
            supportTickets={supportTickets}
        // onChangeView handled effectively by Links in the Client Component or Navigation logic
        />
    );
}


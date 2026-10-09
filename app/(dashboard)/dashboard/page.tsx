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
  } catch {
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

  // Teachers, students, parents and staff have self-loading dashboards. Admin numbers come from
  // /academic/dashboard/ on the client; here we only load what the admin tabs need.
  let settings = Utils.INITIAL_SETTINGS,
    announcements = [],
    schools = [],
    platformSettings = null,
    systemHealth = null,
    supportTickets = [];

  const normalize = (data: any) => {
    if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
      return data.results;
    }
    return Array.isArray(data) ? data : [];
  };

  if (currentRole === 'super_admin' || currentRole === 'admin') {
    const isSuper = currentRole === 'super_admin';
    try {
      const results = await Promise.all([
        fetchServer('/core/settings/').catch(() => Utils.INITIAL_SETTINGS),
        fetchServer('/schools/announcements/').catch(() => []),
        isSuper ? fetchServer('/schools/management/').catch(() => []) : Promise.resolve([]),
        isSuper
          ? fetchServer('/schools/platform-settings/').catch(() => null)
          : Promise.resolve(null),
        isSuper
          ? fetchServer('/schools/analytics/strategic/').catch(() => null)
          : Promise.resolve(null),
        isSuper ? fetchServer('/schools/governance/').catch(() => null) : Promise.resolve(null),
        isSuper ? fetchServer('/schools/health/').catch(() => null) : Promise.resolve(null),
        isSuper ? fetchServer('/schools/support/tickets/').catch(() => []) : Promise.resolve([]),
      ]);
      settings = results[0];
      announcements = normalize(results[1]);
      schools = normalize(results[2]);
      platformSettings = results[3];
      systemHealth = results[6];
      supportTickets = normalize(results[7]);
      if (isSuper) {
        (user as any).analyticsData = results[4];
        (user as any).governanceData = results[5];
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

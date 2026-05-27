'use client';

import { useEffect, useState } from 'react';
import { useSchoolStore } from '@/lib/store';
import apiClient from '@/lib/api-client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, logout, currentUser } = useSchoolStore(); // Still using store for UI state

  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If we don't have a user in store, try to fetch from API (using cookie)
        if (!currentUser) {
          const response = await apiClient.get('users/me/');
          const userData = response.data;

          // Map backend role to frontend role
          let role: any = 'student';
          const backendRole = userData.role;

          if (backendRole === 'SUPER_ADMIN') role = 'super_admin';
          else if (backendRole === 'SCHOOL_ADMIN') role = 'admin';
          else if (backendRole === 'TEACHER') role = 'teacher';
          else if (backendRole === 'STUDENT') role = 'student';
          else if (backendRole === 'PARENT') role = 'parent';
          else if (backendRole === 'STAFF') role = 'staff';
          else role = backendRole; // Fallback

          // Update store
          login(role, {
            id: userData.id,
            name: userData.username,
            email: userData.email,
            role: role,
          });
        }
      } catch {
        // If 401, logout (cleanup store) - fail silently intended behavior for guest
        logout();
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [currentUser, login, logout]); // Run on mount — stable deps

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Dashboard Roles Tab
 *
 * Roles & permissions management for navigation and dashboard widgets.
 */
'use client';

import React from 'react';
import { Save, Lock, Settings, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as Types from '@/lib/types';

interface DashboardRolesTabProps {
    editedSettings: Types.Settings;
    selectedRole: Types.UserRole;
    setSelectedRole: (role: Types.UserRole) => void;
    roleLabels: Record<Types.UserRole, string>;
    allNavItems: { id: string; name: string }[];
    allWidgets: { id: string; name: string; module?: string }[];
    currentRolePermissions: { navigation: string[]; dashboardWidgets: string[] };
    toggleNavItem: (id: string) => void;
    toggleWidget: (id: string) => void;
    handleSaveSettings: () => void;
}

export const DashboardRolesTab: React.FC<DashboardRolesTabProps> = ({
    selectedRole, setSelectedRole, roleLabels, allNavItems, allWidgets,
    currentRolePermissions, toggleNavItem, toggleWidget, handleSaveSettings
}) => (
    <div className="space-y-8">
        {/* Save Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between sticky top-4 z-20">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                    <Lock size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Roles & Permissions</h3>
                    <p className="text-xs text-gray-500">Configure access for each user role</p>
                </div>
            </div>
            <Button onClick={handleSaveSettings} className="flex items-center gap-2">
                <Save size={16} /> Save Changes
            </Button>
        </div>

        {/* Role Selector */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Role to Configure</h3>
            <div className="flex flex-wrap gap-3">
                {(Object.keys(roleLabels) as Types.UserRole[]).map(role => (
                    <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`px-5 py-3 rounded-xl font-bold transition-all ${selectedRole === role
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {roleLabels[role]}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Navigation Access */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings size={18} className="text-purple-500" />
                    Navigation Access
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    Select which menu items this role can see
                </p>
                <div className="grid grid-cols-2 gap-3">
                    {allNavItems.map(item => (
                        <label
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${currentRolePermissions.navigation?.includes(item.id)
                                ? 'bg-purple-50 border-2 border-purple-200'
                                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={currentRolePermissions.navigation?.includes(item.id) || false}
                                onChange={() => toggleNavItem(item.id)}
                                className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="font-medium text-gray-700 text-sm">{item.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Dashboard Widgets */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-purple-500" />
                    Dashboard Widgets
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    Select which widgets appear on this role&apos;s dashboard
                </p>
                <div className="grid grid-cols-1 gap-3">
                    {allWidgets.map(widget => (
                        <label
                            key={widget.id}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${currentRolePermissions.dashboardWidgets?.includes(widget.id)
                                ? 'bg-purple-50 border-2 border-purple-200'
                                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={currentRolePermissions.dashboardWidgets?.includes(widget.id) || false}
                                onChange={() => toggleWidget(widget.id)}
                                className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="font-medium text-gray-700 text-sm">{widget.name}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

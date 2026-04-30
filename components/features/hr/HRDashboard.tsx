import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Banknote, TrendingUp, Clock, CheckCircle, CreditCard, PlayCircle, ArrowRight } from 'lucide-react';
import { useHRDashboard, usePayrolls } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';

interface HRDashboardProps {
    onNavigate: (tab: string) => void;
}

const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export const HRDashboard: React.FC<HRDashboardProps> = ({ onNavigate }) => {
    const { data: dashboard, isLoading } = useHRDashboard();
    const { data: payrolls = [] } = usePayrolls();

    const recentPayrolls = payrolls.slice(0, 5);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6"><div className="h-20 bg-gray-200 rounded" /></CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const stats = [
        {
            title: 'Total Staff',
            value: dashboard?.total_staff ?? 0,
            subtitle: `${dashboard?.academic_staff ?? 0} Academic • ${dashboard?.non_academic_staff ?? 0} Non-Academic`,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            title: 'Monthly Obligation',
            value: formatNaira(dashboard?.monthly_basic_total ?? 0),
            subtitle: 'Total basic salaries',
            icon: Banknote,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
        },
        {
            title: 'YTD Expenditure',
            value: formatNaira(dashboard?.ytd_expenditure ?? 0),
            subtitle: `${new Date().getFullYear()} payroll spend`,
            icon: TrendingUp,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
        },
        {
            title: 'Last Paid Payroll',
            value: dashboard?.last_paid_payroll
                ? formatNaira(dashboard.last_paid_payroll.total)
                : 'None',
            subtitle: dashboard?.last_paid_payroll
                ? new Date(dashboard.last_paid_payroll.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : 'No payroll completed',
            icon: CreditCard,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
    ];

    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ElementType }> = {
        draft: { label: 'DRAFT', variant: 'outline', icon: Clock },
        approved: { label: 'APPROVED', variant: 'default', icon: CheckCircle },
        paid: { label: 'PAID', variant: 'secondary', icon: CreditCard },
    };

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Payroll Status Overview + Quick Actions */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Payroll Status Breakdown */}
                <Card className="md:col-span-2 border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">Recent Payroll Runs</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => onNavigate('payroll')} className="text-brand-600">
                                View All <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentPayrolls.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Banknote className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p className="text-sm">No payroll runs yet</p>
                                <Button variant="outline" size="sm" className="mt-4" onClick={() => onNavigate('payroll')}>
                                    <PlayCircle className="mr-2 h-4 w-4" /> Run First Payroll
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentPayrolls.map((payroll) => {
                                    const config = statusConfig[payroll.status] || statusConfig.draft;
                                    return (
                                        <div key={payroll.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                                                    <config.icon className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {new Date(payroll.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {payroll.total_staff} staff • {payroll.entries?.length || 0} payslips
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold text-sm">{formatNaira(payroll.total_wage_bill)}</span>
                                                <Badge variant={config.variant}>{config.label}</Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button className="w-full justify-start" variant="outline" onClick={() => onNavigate('payroll')}>
                            <PlayCircle className="mr-3 h-4 w-4 text-emerald-600" />
                            <div className="text-left">
                                <div className="font-medium text-sm">Run Payroll</div>
                                <div className="text-xs text-muted-foreground">Generate monthly payroll</div>
                            </div>
                        </Button>
                        <Button className="w-full justify-start" variant="outline" onClick={() => onNavigate('staff')}>
                            <Users className="mr-3 h-4 w-4 text-blue-600" />
                            <div className="text-left">
                                <div className="font-medium text-sm">Staff Salaries</div>
                                <div className="text-xs text-muted-foreground">Manage salary structures</div>
                            </div>
                        </Button>
                        <Button className="w-full justify-start" variant="outline" onClick={() => onNavigate('payslips')}>
                            <Banknote className="mr-3 h-4 w-4 text-purple-600" />
                            <div className="text-left">
                                <div className="font-medium text-sm">Payslips</div>
                                <div className="text-xs text-muted-foreground">View & print payslips</div>
                            </div>
                        </Button>

                        {/* Status counters */}
                        <div className="pt-4 border-t mt-4 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payroll Status</p>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 rounded-lg bg-amber-50">
                                    <p className="text-lg font-bold text-amber-700">{dashboard?.payroll_status?.draft ?? 0}</p>
                                    <p className="text-[10px] text-amber-600">Draft</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-blue-50">
                                    <p className="text-lg font-bold text-blue-700">{dashboard?.payroll_status?.approved ?? 0}</p>
                                    <p className="text-[10px] text-blue-600">Approved</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-emerald-50">
                                    <p className="text-lg font-bold text-emerald-700">{dashboard?.payroll_status?.paid ?? 0}</p>
                                    <p className="text-[10px] text-emerald-600">Paid</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

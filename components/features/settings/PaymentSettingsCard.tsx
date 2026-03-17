import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import * as Types from '@/lib/types';

interface PaymentSettingsCardProps {
    paymentSettings: Types.SchoolPaymentSettings;
    onChange: (updates: Partial<Types.SchoolPaymentSettings>) => void;
    onSave: () => void;
    isSaving: boolean;
    canManage: boolean;
}

export const PaymentSettingsCard: React.FC<PaymentSettingsCardProps> = ({
    paymentSettings,
    onChange,
    onSave,
    isSaving,
    canManage,
}) => {
    const enabledMethods: Types.SchoolPaymentMethod[] = [];
    if (paymentSettings.enable_cash) enabledMethods.push('cash');
    if (paymentSettings.enable_bank_transfer) enabledMethods.push('bank_transfer');
    if (paymentSettings.enable_paystack) enabledMethods.push('paystack');
    if (paymentSettings.enable_flutterwave) enabledMethods.push('flutterwave');

    return (
        <Card
            title="Payment Methods & Gateways"
            className="md:col-span-2"
            action={
                <Button onClick={onSave} disabled={!canManage || isSaving} size="sm">
                    {isSaving ? 'Saving...' : 'Save Payment Settings'}
                </Button>
            }
        >
            <div className="space-y-6">
                {!canManage && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        You can view payment settings, but only school admins can modify them.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={paymentSettings.enable_cash}
                            disabled={!canManage}
                            onChange={(e) => onChange({ enable_cash: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        Enable Cash
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={paymentSettings.enable_bank_transfer}
                            disabled={!canManage}
                            onChange={(e) => onChange({ enable_bank_transfer: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        Enable Bank Transfer
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={paymentSettings.enable_paystack}
                            disabled={!canManage}
                            onChange={(e) => onChange({ enable_paystack: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        Enable Paystack
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={paymentSettings.enable_flutterwave}
                            disabled={!canManage}
                            onChange={(e) => onChange({ enable_flutterwave: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        Enable Flutterwave
                    </label>
                </div>

                <Select
                    label="Default Payment Method"
                    value={paymentSettings.default_payment_method}
                    disabled={!canManage}
                    onChange={(e) => onChange({ default_payment_method: e.target.value as Types.SchoolPaymentMethod })}
                >
                    {enabledMethods.map((method) => (
                        <option key={method} value={method}>
                            {method === 'bank_transfer' ? 'Bank Transfer' : method.charAt(0).toUpperCase() + method.slice(1)}
                        </option>
                    ))}
                </Select>

                {(paymentSettings.enable_paystack || paymentSettings.enable_flutterwave) && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                        Online payment methods are enabled. Full checkout and webhook verification flow will be wired in the next phase.
                    </div>
                )}

                {paymentSettings.enable_paystack && (
                    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-800">Paystack Credentials</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                                label="Public Key"
                                value={paymentSettings.paystack_public_key || ''}
                                disabled={!canManage}
                                onChange={(e) => onChange({ paystack_public_key: e.target.value })}
                                placeholder="pk_test_..."
                            />
                            <Input
                                label="Secret Key"
                                type="password"
                                value={paymentSettings.paystack_secret_key || ''}
                                disabled={!canManage}
                                onChange={(e) => onChange({ paystack_secret_key: e.target.value })}
                                placeholder={paymentSettings.has_paystack_secret ? '********' : 'sk_test_...'}
                            />
                            <Input
                                label="Webhook Secret"
                                type="password"
                                value={paymentSettings.paystack_webhook_secret || ''}
                                disabled={!canManage}
                                onChange={(e) => onChange({ paystack_webhook_secret: e.target.value })}
                                placeholder="whsec_..."
                            />
                        </div>
                    </div>
                )}

                {paymentSettings.enable_flutterwave && (
                    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-800">Flutterwave Credentials</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                                label="Public Key"
                                value={paymentSettings.flutterwave_public_key || ''}
                                disabled={!canManage}
                                onChange={(e) => onChange({ flutterwave_public_key: e.target.value })}
                                placeholder="FLWPUBK_TEST-..."
                            />
                            <Input
                                label="Secret Key"
                                type="password"
                                value={paymentSettings.flutterwave_secret_key || ''}
                                disabled={!canManage}
                                onChange={(e) => onChange({ flutterwave_secret_key: e.target.value })}
                                placeholder={paymentSettings.has_flutterwave_secret ? '********' : 'FLWSECK_TEST-...'}
                            />
                            <Input
                                label="Webhook Secret"
                                type="password"
                                value={paymentSettings.flutterwave_webhook_secret || ''}
                                disabled={!canManage}
                                onChange={(e) => onChange({ flutterwave_webhook_secret: e.target.value })}
                                placeholder="whsec_..."
                            />
                        </div>
                    </div>
                )}

                {paymentSettings.enable_bank_transfer && (
                    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-800">Bank Transfer Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                                label="Bank Name"
                                value={paymentSettings.bank_name || ''}
                                disabled={!canManage}
                                onChange={(e) => onChange({ bank_name: e.target.value })}
                            />
                            <Input
                                label="Account Name"
                                value={paymentSettings.bank_account_name || ''}
                                disabled={!canManage}
                                onChange={(e) => onChange({ bank_account_name: e.target.value })}
                            />
                            <Input
                                label="Account Number"
                                value={paymentSettings.bank_account_number || ''}
                                disabled={!canManage}
                                onChange={(e) => onChange({ bank_account_number: e.target.value })}
                            />
                            <Input
                                label="Sort Code (Optional)"
                                value={paymentSettings.bank_sort_code || ''}
                                disabled={!canManage}
                                onChange={(e) => onChange({ bank_sort_code: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Transfer Instructions</label>
                            <textarea
                                value={paymentSettings.transfer_instructions || ''}
                                disabled={!canManage}
                                onChange={(e) => onChange({ transfer_instructions: e.target.value })}
                                rows={2}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Add instructions shown to parents/students for bank transfer."
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={!!paymentSettings.require_transfer_proof}
                                disabled={!canManage}
                                onChange={(e) => onChange({ require_transfer_proof: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            Require transfer proof upload
                        </label>
                    </div>
                )}
                {(paymentSettings.enable_paystack || paymentSettings.enable_flutterwave) && (
                    <div className="rounded-lg border border-gray-200 p-4 space-y-2">
                        <h4 className="text-sm font-semibold text-gray-800">Processing Fee</h4>
                        <p className="text-xs text-gray-500">When enabled, the ~1.5% gateway fee is added to the parent&apos;s checkout total so the school receives the full fee amount.</p>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={!!paymentSettings.pass_processing_fee_to_parents}
                                disabled={!canManage}
                                onChange={(e) => onChange({ pass_processing_fee_to_parents: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            Pass processing fee to parents
                        </label>
                    </div>
                )}
            </div>
        </Card>
    );
};

import React, { useState } from 'react';
import * as Types from '@/lib/types';
import { useToast } from '@/components/providers/toast-provider';

// Bursary sub-components
import { FeeManagement } from './bursary/FeeManagement';
import { ExpenseManagement } from './bursary/ExpenseManagement';
import { FeeStructureManagement } from './bursary/FeeStructureManagement';
import { BursaryModals } from './bursary/BursaryModals';
import { FinancialDashboard } from './bursary/FinancialDashboard';
import { DebtorReport } from './bursary/DebtorReport';
import { ScholarshipManager } from './bursary/ScholarshipManager';
import { TransferReviewQueue } from './bursary/TransferReviewQueue';
import { TermSetupPanel } from './bursary/TermSetupPanel';
import { useTransfers } from '@/lib/hooks/use-transfers';

interface BursaryViewProps {
  students: Types.Student[];
  classes: Types.Class[];
  fees: Types.FeeStructure[];
  payments: Types.Payment[];
  expenses: Types.Expense[];
  settings: Types.Settings;
  paymentOptions?: Types.SchoolPaymentSettings | null;
  onAddPayment: (p: Types.Payment, options?: any) => void;
  onAddFee: (f: Types.FeeStructure, options?: any) => void;
  onAddExpense: (e: Types.Expense, options?: any) => void;
  onDeletePayment: (id: string, options?: any) => void;
  onDeleteFee: (id: string, options?: any) => void;
  onDeleteExpense?: (id: string, options?: any) => void;
  onUpdateStudent?: (student: Types.Student, options?: any) => void;

  // Pagination
  studentPage?: number;
  studentTotalPages?: number;
  onStudentPageChange?: (p: number) => void;
  paymentPage?: number;
  paymentTotalPages?: number;
  onPaymentPageChange?: (p: number) => void;
  selectedClass?: string;
  onClassChange?: (c: string) => void;
}

type TabType =
  | 'dashboard'
  | 'fees'
  | 'debtors'
  | 'expenses'
  | 'structure'
  | 'scholarships'
  | 'transfers';

export const BursaryView: React.FC<BursaryViewProps> = ({
  students,
  classes,
  fees,
  payments,
  expenses,
  settings,
  paymentOptions,
  onAddPayment,
  onAddFee,
  onAddExpense,
  onDeletePayment,
  onDeleteFee,
  onDeleteExpense,
  onUpdateStudent,
  studentPage,
  studentTotalPages,
  onStudentPageChange,
  paymentPage,
  paymentTotalPages,
  onPaymentPageChange,
  selectedClass: selectedClassProp,
  onClassChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [localSelectedClass, setLocalSelectedClass] = useState(classes[0]?.id || '');
  const [localSelectedStudent, setLocalSelectedStudent] = useState<string | null>(null);

  const currentSelectedClass = selectedClassProp || localSelectedClass;
  const handleSelectClass = (val: string) => {
    if (onClassChange) onClassChange(val);
    else setLocalSelectedClass(val);
  };

  // Modal Visibility State
  const [showPayModal, setShowPayModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false); // New state
  const [receiptPayment, setReceiptPayment] = useState<Types.Payment | null>(null);
  const [invoiceStudent, setInvoiceStudent] = useState<Types.Student | null>(null);
  const { addToast } = useToast();

  const { data: pendingTransfers } = useTransfers({ status: 'pending' });
  const pendingCount = pendingTransfers?.count ?? 0;

  const tabs: { key: TabType; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    {
      key: 'transfers',
      label: pendingCount ? `Transfers to verify (${pendingCount})` : 'Transfers to verify',
    },
    { key: 'fees', label: 'Fee Collection' },
    { key: 'debtors', label: 'Debtors' },
    { key: 'scholarships', label: 'Scholarships' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'structure', label: 'Fee Structure' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Bursary & Finance</h1>
        <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide -mx-1 px-1">
          <div className="flex bg-gray-100 p-1 rounded-lg w-max min-w-full sm:min-w-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white shadow-sm text-brand-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'transfers' && <TransferReviewQueue />}

      {activeTab === 'dashboard' && pendingCount > 0 && (
        <button
          type="button"
          onClick={() => setActiveTab('transfers')}
          className="flex w-full items-center justify-between gap-3 rounded-card border border-warning-200 bg-warning-50 px-4 py-3 text-left text-sm text-warning-700 hover:bg-warning-100"
        >
          <span>
            <span className="font-semibold">{pendingCount}</span> bank transfer
            {pendingCount === 1 ? '' : 's'} reported by parents {pendingCount === 1 ? 'is' : 'are'}{' '}
            waiting for you to confirm.
          </span>
          <span className="font-semibold">Review →</span>
        </button>
      )}

      {activeTab === 'dashboard' && <TermSetupPanel />}

      {activeTab === 'dashboard' && (
        <FinancialDashboard
          students={students}
          classes={classes}
          fees={fees}
          payments={payments}
          expenses={expenses}
          settings={settings}
        />
      )}

      {activeTab === 'fees' && (
        <FeeManagement
          students={students}
          classes={classes}
          fees={fees}
          payments={payments}
          settings={settings}
          selectedClass={currentSelectedClass}
          setSelectedClass={handleSelectClass}
          selectedStudent={localSelectedStudent}
          setSelectedStudent={setLocalSelectedStudent}
          onRecordPayment={() => setShowPayModal(true)}
          onPrintReceipt={(p) => setReceiptPayment(p)}
          onDeletePayment={onDeletePayment}
          onPrintInvoice={(student) => setInvoiceStudent(student)}
          onUpdateStudent={onUpdateStudent}
          onOpenDiscountModal={() => setShowDiscountModal(true)}
          studentPage={studentPage}
          studentTotalPages={studentTotalPages}
          onStudentPageChange={onStudentPageChange}
          paymentPage={paymentPage}
          paymentTotalPages={paymentTotalPages}
          onPaymentPageChange={onPaymentPageChange}
        />
      )}

      {activeTab === 'debtors' && (
        <DebtorReport
          students={students}
          classes={classes}
          fees={fees}
          payments={payments}
          settings={settings}
        />
      )}

      {activeTab === 'scholarships' && <ScholarshipManager />}

      {activeTab === 'expenses' && (
        <ExpenseManagement
          expenses={expenses}
          settings={settings}
          onAddExpense={() => setShowExpenseModal(true)}
          onDeleteExpense={onDeleteExpense}
        />
      )}

      {activeTab === 'structure' && (
        <FeeStructureManagement
          fees={fees}
          classes={classes}
          settings={settings}
          onAddFeeHead={() => setShowFeeModal(true)}
          onDeleteFee={onDeleteFee}
        />
      )}

      <BursaryModals
        settings={settings}
        classes={classes}
        students={students}
        fees={fees}
        payments={payments}
        paymentOptions={paymentOptions}
        showPayModal={showPayModal}
        setShowPayModal={setShowPayModal}
        showExpenseModal={showExpenseModal}
        setShowExpenseModal={setShowExpenseModal}
        showFeeModal={showFeeModal}
        setShowFeeModal={setShowFeeModal}
        receiptPayment={receiptPayment}
        setReceiptPayment={setReceiptPayment}
        invoiceStudent={invoiceStudent}
        setInvoiceStudent={setInvoiceStudent}
        selectedStudent={localSelectedStudent}
        onAddPayment={onAddPayment}
        onAddExpense={onAddExpense}
        onAddFee={onAddFee}
        addToast={addToast}
        showDiscountModal={showDiscountModal}
        setShowDiscountModal={setShowDiscountModal}
        onAddDiscount={(discount) => {
          if (localSelectedStudent && onUpdateStudent) {
            const student = students.find((s) => s.id === localSelectedStudent);
            if (student) {
              onUpdateStudent({
                ...student,
                discounts: [...(student.discounts || []), discount],
              });
            }
          }
        }}
      />
    </div>
  );
};

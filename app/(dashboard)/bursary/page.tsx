'use client';
import { useMemo, useState } from 'react';
import { useSchoolStore } from '@/lib/store';
import { BursaryView } from '@/components/features/BursaryView';
import { StudentInvoiceView } from '@/components/features/bursary/StudentInvoiceView';
import { PayrollManagement } from '@/components/features/bursary/PayrollManagement';
import {
    useStudents, useClasses, useFees, usePayments, useExpenses, useSettings,
    useCreatePayment, useCreateFee, useCreateExpense,
    useDeletePayment, useDeleteFee, useDeleteExpense,
    useUpdateStudent, usePaginatedStudents, usePaginatedPayments
} from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';

export default function BursaryPage() {
    const { currentRole, currentUser } = useSchoolStore();

    const { data: classes = [] } = useClasses();
    const [studentPage, setStudentPage] = useState(1);
    const [selectedClassId, setSelectedClassId] = useState('');

    // Effective class: use selectedClassId if set, otherwise fall back to first class
    const effectiveClassId = selectedClassId || (classes.length > 0 ? String(classes[0].id) : '');

    const { data: studentResponse } = usePaginatedStudents(studentPage, 50, '', effectiveClassId);
    const students = studentResponse?.results || [];
    const studentTotalPages = studentResponse ? Math.ceil(studentResponse.count / 50) : 0;

    const { data: fees = [] } = useFees();

    const [paymentPage, setPaymentPage] = useState(1);
    const { data: paymentResponse } = usePaginatedPayments(paymentPage, 10, currentUser?.student_id || '');
    const payments = paymentResponse?.results || [];
    const paymentTotalPages = paymentResponse ? Math.ceil(paymentResponse.count / 10) : 0;
    const { data: expenses = [] } = useExpenses();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

    const { mutate: addPayment } = useCreatePayment();
    const { mutate: addFee } = useCreateFee();
    const { mutate: addExpense } = useCreateExpense();
    const { mutate: deletePayment } = useDeletePayment();
    const { mutate: deleteFee } = useDeleteFee();
    const { mutate: deleteExpense } = useDeleteExpense();
    const { mutate: updateStudent } = useUpdateStudent();

    // For students/parents, show simplified invoice view
    const isStudentOrParent = currentRole === 'student' || currentRole === 'parent';

    // Get the student for student/parent roles
    const student = useMemo(() => {
        if (!isStudentOrParent) return null;

        // Use profile_id (the specific Student ID) first, then fallback to student_id
        const profileId = currentUser?.profile_id || currentUser?.student_id;

        if (profileId) {
            // Check if student is in the current page results
            const foundInList = students.find((s: Types.Student) => s.id === profileId);
            if (foundInList) return foundInList;
        }

        // If not found in list, we might need to fetch it specifically or rely on mock/null
        // Since we are in the student's own view, being unauthenticated or unprofiled is the edge case
        return students[0] || null;
    }, [isStudentOrParent, currentUser, students]);

    const studentClass = useMemo(() => {
        if (!student) return undefined;
        return classes.find((c: Types.Class) => c.id === student.class_id);
    }, [student, classes]);

    if (isStudentOrParent && student) {
        return (
            <StudentInvoiceView
                student={student}
                cls={studentClass}
                fees={fees}
                payments={payments}
                settings={settings}
            />
        );
    }

    return (
        <BursaryView
            students={students} classes={classes} fees={fees} payments={payments}
            expenses={expenses} settings={settings}
            onAddPayment={(p, opt) => addPayment(p, opt)}
            onAddFee={(f, opt) => addFee(f, opt)}
            onAddExpense={(e, opt) => addExpense(e, opt)}
            onDeletePayment={(id, opt) => deletePayment(id, opt)}
            onDeleteFee={(id, opt) => deleteFee(id, opt)}
            onDeleteExpense={(id, opt) => deleteExpense(id, opt)}
            onUpdateStudent={(student, opt) => {
                // Sanitize payload to only include fields we intend to update in Bursary context
                const updates = {
                    assigned_fees: student.assigned_fees,
                    discounts: student.discounts
                };
                updateStudent({ id: student.id, updates }, opt);
            }}
            studentPage={studentPage}
            studentTotalPages={studentTotalPages}
            onStudentPageChange={setStudentPage}
            paymentPage={paymentPage}
            paymentTotalPages={paymentTotalPages}
            onPaymentPageChange={setPaymentPage}
            selectedClass={effectiveClassId}
            onClassChange={(c) => {
                setSelectedClassId(c);
                setStudentPage(1);
            }}
        />
    );
}

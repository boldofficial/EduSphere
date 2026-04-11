'use client';
import { useMemo, useState } from 'react';
import { useSchoolStore } from '@/lib/store';
import { BursaryView } from '@/components/features/BursaryView';
import { StudentInvoiceView } from '@/components/features/bursary/StudentInvoiceView';
import {
    useClasses, useFees, useExpenses, useSettings,
    usePublicPaymentOptions,
    useCreatePayment, useCreateFee, useCreateExpense,
    useDeletePayment, useDeleteFee, useDeleteExpense,
    useUpdateStudent, usePaginatedStudents, usePaginatedPayments, useStudents
} from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';

export default function BursaryPage() {
    const { currentRole, currentUser } = useSchoolStore();
    const isStudentOrParent = currentRole === 'student' || currentRole === 'parent';

    const { data: classes = [] } = useClasses();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
    const { data: linkedStudents = [] } = useStudents(isStudentOrParent);
    const [studentPage, setStudentPage] = useState(1);
    const [selectedClassId, setSelectedClassId] = useState('');

    // Effective class: use selectedClassId if set, otherwise fall back to first class
    const effectiveClassId = selectedClassId || (classes.length > 0 ? String(classes[0].id) : '');

    const { data: studentResponse } = usePaginatedStudents(studentPage, 50, '', effectiveClassId);
    const students = studentResponse?.results || [];
    const studentTotalPages = studentResponse ? Math.ceil(studentResponse.count / 50) : 0;

    const student = useMemo(() => {
        if (!isStudentOrParent) return null;

        const profileId = currentUser?.profile_id || currentUser?.student_id;
        if (profileId) {
            const byId = linkedStudents.find((s: Types.Student) => s.id === profileId);
            if (byId) return byId;
        }

        if (currentRole === 'parent' && currentUser?.email) {
            const byParentEmail = linkedStudents.find((s: Types.Student) => s.parent_email === currentUser.email);
            if (byParentEmail) return byParentEmail;
        }

        return linkedStudents[0] || null;
    }, [isStudentOrParent, currentRole, currentUser, linkedStudents]);

    const { data: fees = [] } = useFees(isStudentOrParent ? { include_all_periods: true } : undefined);

    const [paymentPage, setPaymentPage] = useState(1);
    const { data: paymentResponse } = usePaginatedPayments(
        paymentPage,
        10,
        isStudentOrParent
            ? {
                studentId: student?.id || currentUser?.student_id || '',
                include_all_periods: true,
            }
            : {
                session: settings.current_session,
                term: settings.current_term,
            },
    );
    const payments = paymentResponse?.results || [];
    const paymentTotalPages = paymentResponse ? Math.ceil(paymentResponse.count / 10) : 0;
    const { data: expenses = [] } = useExpenses();
    const { data: paymentOptions = null } = usePublicPaymentOptions();

    const { mutate: addPayment } = useCreatePayment();
    const { mutate: addFee } = useCreateFee();
    const { mutate: addExpense } = useCreateExpense();
    const { mutate: deletePayment } = useDeletePayment();
    const { mutate: deleteFee } = useDeleteFee();
    const { mutate: deleteExpense } = useDeleteExpense();
    const { mutate: updateStudent } = useUpdateStudent();

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

    if (isStudentOrParent && !student) {
        return <div className="p-8 text-center text-gray-500">No linked student profile found.</div>;
    }

    return (
        <BursaryView
            students={students} classes={classes} fees={fees} payments={payments}
            expenses={expenses} settings={settings} paymentOptions={paymentOptions}
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

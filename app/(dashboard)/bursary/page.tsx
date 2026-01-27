'use client';
import { useMemo } from 'react';
import { useSchoolStore } from '@/lib/store';
import { BursaryView } from '@/components/features/BursaryView';
import { StudentInvoiceView } from '@/components/features/bursary/StudentInvoiceView';
import {
    useStudents, useClasses, useFees, usePayments, useExpenses, useSettings,
    useCreatePayment, useCreateFee, useCreateExpense,
    useDeletePayment, useDeleteFee, useDeleteExpense,
    useUpdateStudent
} from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';

export default function BursaryPage() {
    const { currentRole, currentUser } = useSchoolStore();

    const { data: students = [] } = useStudents();
    const { data: classes = [] } = useClasses();
    const { data: fees = [] } = useFees();
    const { data: payments = [] } = usePayments();
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
        const studentId = currentUser?.student_id || students[0]?.id;
        return students.find((s: Types.Student) => s.id === studentId) || students[0];
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
        />
    );
}

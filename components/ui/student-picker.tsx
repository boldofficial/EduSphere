'use client';

import React, { useEffect, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { usePaginatedStudents } from '@/lib/hooks/use-academic';
import type { Student } from '@/lib/types';

interface BaseProps {
  label?: string;
  placeholder?: string;
  /** Limit results to one class. */
  classId?: string;
  className?: string;
}

interface SingleProps extends BaseProps {
  multiple?: false;
  value: string;
  onChange: (id: string, student?: Student) => void;
}

interface MultiProps extends BaseProps {
  multiple: true;
  value: string[];
  onChange: (ids: string[]) => void;
}

type StudentPickerProps = SingleProps | MultiProps;

const PAGE_SIZE = 20;

/** Search-as-you-type student selector. Queries the server instead of loading every student. */
export function StudentPicker(props: StudentPickerProps) {
  const { label, placeholder = 'Search by name or student number…', classId = '' } = props;
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [picked, setPicked] = useState<Record<string, Student>>({});

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = usePaginatedStudents(1, PAGE_SIZE, debounced, classId);
  const results = data?.results ?? [];
  const selectedIds = props.multiple ? props.value : props.value ? [props.value] : [];

  const toggle = (student: Student) => {
    const id = String(student.id);
    setPicked((prev) => ({ ...prev, [id]: student }));
    if (props.multiple) {
      props.onChange(
        props.value.includes(id) ? props.value.filter((v) => v !== id) : [...props.value, id]
      );
    } else {
      props.onChange(id, student);
    }
  };

  const remove = (id: string) => {
    if (props.multiple) props.onChange(props.value.filter((v) => v !== id));
    else props.onChange('');
  };

  return (
    <div className={props.className}>
      {label && <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>}

      {selectedIds.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
            >
              {picked[id]?.names || `Student #${id}`}
              <button
                type="button"
                onClick={() => remove(id)}
                className="rounded-full p-0.5 hover:bg-brand-100"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-control border border-gray-300 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <ul className="mt-2 max-h-60 divide-y divide-gray-100 overflow-y-auto rounded-control border border-gray-200">
        {results.map((s) => {
          const id = String(s.id);
          const selected = selectedIds.includes(id);
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => toggle(s)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  selected ? 'bg-brand-50/60' : ''
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-gray-900">{s.names}</span>
                  <span className="block text-xs text-gray-500">{s.student_no}</span>
                </span>
                {selected && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
              </button>
            </li>
          );
        })}
        {!isFetching && results.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-gray-500">No students found</li>
        )}
        {isFetching && results.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-gray-500">Searching…</li>
        )}
      </ul>
      {(data?.count ?? 0) > PAGE_SIZE && (
        <p className="mt-1 text-xs text-gray-500">
          Showing {PAGE_SIZE} of {data?.count}. Type to narrow the list.
        </p>
      )}
    </div>
  );
}

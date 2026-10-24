import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { queryKeys } from './use-data';

export type SectionKey = 'early_years' | 'primary' | 'junior' | 'senior';
export type NamingStyle = 'classic' | 'basic';

export interface CatalogueSubject {
  name: string;
  default: boolean;
}

export interface CatalogueSection {
  key: SectionKey;
  label: string;
  head_title: string;
  levels: Record<NamingStyle, string[]>;
  default_levels: string[];
  subjects: CatalogueSubject[];
  departments: { key: string; label: string; subjects: CatalogueSubject[] }[];
}

export interface SchoolStructure {
  sections: {
    id: number;
    key: SectionKey;
    name: string;
    head_title: string;
    head_name: string;
    class_count: number;
    assessment: Record<'ca1' | 'ca2' | 'exam', { label: string; max: number; enabled: boolean }>;
    grading_scheme: number | null;
    show_position: boolean;
  }[];
  suggested_sections: SectionKey[];
  class_count: number;
  class_names: string[];
  unassigned_classes: number;
  catalogue: CatalogueSection[];
}

export interface SectionChoice {
  key: SectionKey;
  levels: string[];
  arms: string[];
  subjects: string[];
  head_name: string;
  departments?: { key: string; subjects: string[] }[];
}

export interface SetupRequest {
  naming: NamingStyle;
  sections: SectionChoice[];
}

export interface PlannedClass {
  name: string;
  level: string;
  department: string;
  arm: string;
  subjects: string[];
  exists: boolean;
  next: string | null;
  graduation: boolean;
}

export interface SetupPlan {
  naming: NamingStyle;
  sections: { key: SectionKey; label: string; head_title: string; classes: PlannedClass[] }[];
  summary: { new_classes: number; existing_classes: number; new_subjects: string[] };
}

const KEY = ['school-structure'] as const;

export function useSchoolStructure() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await apiClient.get<SchoolStructure>('academic/school-structure/')).data,
  });
}

export function usePreviewStructure() {
  return useMutation({
    mutationFn: async (body: SetupRequest) =>
      (await apiClient.post<SetupPlan>('academic/school-structure/preview/', body)).data,
  });
}

export function useApplyStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: SetupRequest) =>
      (await apiClient.post('academic/school-structure/apply/', body)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      queryClient.invalidateQueries({ queryKey: queryKeys.classes });
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
    },
  });
}

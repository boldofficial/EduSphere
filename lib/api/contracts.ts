/**
 * Compile-time API contracts. `schema.d.ts` is generated from the backend's OpenAPI schema
 * (`npm run api:schema && npm run api:types`). Each check below lists the fields a screen sends;
 * if the backend renames or drops one, `npm run check-types` fails instead of the save silently breaking.
 */
import type { components } from './schema';

export type ApiSchemas = components['schemas'];

/** Resolves to `true` only when every key in `K` is accepted by request schema `S`. */
type Accepts<S extends keyof ApiSchemas, K extends string> = [
  Exclude<K, keyof ApiSchemas[S]>,
] extends [never]
  ? true
  : {
      error: 'Backend no longer accepts these fields';
      schema: S;
      fields: Exclude<K, keyof ApiSchemas[S]>;
    };

type Expect<T extends true> = T;

// Attendance register (AttendanceView). `records` is parsed by the serializer itself, so it is not in the schema.
export type AttendanceContract = Expect<
  Accepts<'AttendanceSessionRequest', 'class_id' | 'date' | 'session' | 'term'>
>;
// Subject teacher assignment (SubjectTeacherManager).
export type SubjectTeacherContract = Expect<
  Accepts<'SubjectTeacherRequest', 'teacher_id' | 'class_id' | 'subject' | 'session'>
>;
// Calendar events (CalendarView), including class targeting.
export type SchoolEventContract = Expect<
  Accepts<'SchoolEventRequest', 'title' | 'start_date' | 'class_id'>
>;

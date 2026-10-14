import { useSyncExternalStore } from 'react';

import { storage } from '@/utils/storage';

export type Role = 'student' | 'teacher';

export type MyTeacher = {
  id: number;
  name: string;
};

const ROLE_KEY = 'user.role';
const MY_TEACHER_KEY = 'user.myTeacher';

export function useUserRole(): [Role | null, (value: Role | null) => void] {
  const value = useSyncExternalStore(
    (cb) => storage.subscribe(ROLE_KEY, cb),
    () => storage.get<Role | null>(ROLE_KEY, null),
    () => null as Role | null, // getServerSnapshot (web SSR)
  );

  return [value, (next) => (next ? storage.set(ROLE_KEY, next) : storage.remove(ROLE_KEY))];
}

export function useMyTeacher(): [MyTeacher | null, (value: MyTeacher | null) => void] {
  const value = useSyncExternalStore(
    (cb) => storage.subscribe(MY_TEACHER_KEY, cb),
    () => storage.get<MyTeacher | null>(MY_TEACHER_KEY, null),
    () => null as MyTeacher | null, // getServerSnapshot (web SSR)
  );

  return [value, (next) => (next ? storage.set(MY_TEACHER_KEY, next) : storage.remove(MY_TEACHER_KEY))];
}

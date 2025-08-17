// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Role = 'ADMIN' | 'STUDENT' | 'TEACHER' | null;

export interface ClassItem {
  classId: number;
  className: string;
  semester: number;
  branch: string;
  subjectId?: string;
  subjectName?: string;
}

type AuthState = {
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;

  userId: string | null;
  setUserId: (id: string | null) => void;

  teacherId: string | null;
  setTeacherId: (id: string | null) => void;

  role: Role;
  setRole: (role: Role) => void;

  token: string | null;
  setToken: (token: string | null) => void;

  loading: boolean;
  setLoading: (value: boolean) => void;

  selectedClass: ClassItem | null;            // ✅ ADDED
  setSelectedClass: (cls: ClassItem | null) => void;  // ✅ ADDED

  logout: () => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      setAuthenticated: (value) => set({ isAuthenticated: value }),

      userId: null,
      setUserId: (id) => set({ userId: id }),

      teacherId: null,
      setTeacherId: (id) => set({ teacherId: id }),

      role: null,
      setRole: (role) => set({ role }),

      token: null,
      setToken: (token) => set({ token }),

      loading: false,
      setLoading: (value) => set({ loading: value }),

      selectedClass: null,                // ✅ initial state
      setSelectedClass: (cls) => set({ selectedClass: cls }), // ✅ setter

      logout: () =>
        set({
          isAuthenticated: false,
          userId: null,
          teacherId: null,
          role: null,
          token: null,
          selectedClass: null,            // ✅ clear on logout
        }),

      reset: () =>
        set({
          isAuthenticated: false,
          userId: null,
          teacherId: null,
          role: null,
          token: null,
          loading: false,
          selectedClass: null,            // ✅ clear on reset
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        teacherId: state.teacherId,
        role: state.role,
        token: state.token,
        selectedClass: state.selectedClass,  // ✅ persist it
      }),
    }
  )
);

import { format } from "date-fns";

interface CalendarStore {
  selectedDate: Date;
  dayOfWeek: string; // e.g., "MONDAY"
  setSelectedDate: (date: Date) => void;
}

export const useCalendarStore = create<CalendarStore>((set) => {
  const formatDayOfWeek = (date: Date) => format(date, "EEEE").toUpperCase();

  return {
    selectedDate: new Date(),
    dayOfWeek: formatDayOfWeek(new Date()),
    setSelectedDate: (date) =>
      set({
        selectedDate: date,
        dayOfWeek: formatDayOfWeek(date),
      }),
  };
});

import api from "@/lib/api"; // Assuming Axios instance
// ─────────── types ───────────

export interface Lecture {
  id: string;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  room: string;
  day: string;
  program: string;
  year: number;
  class: string;
}

interface LectureState {
  lectures: Lecture[];

  loadLectures: () => Promise<void>;
  setLectures: (lectures: Lecture[]) => void;

  addLecture: (
    l: Omit<Lecture, "id" | "subject" | "teacher"> & { subjectId: string; teacherId: string },
    selectedClass: {
      name: string;
      branch: { name: string };
      branchYear: { number: number };
    }
  ) => Promise<void>;

  updateLecture: (
    l: Lecture & { subjectId: string; teacherId: string },
    selectedClass: {
      name: string;
      branch: { name: string };
      branchYear: { number: number };
    }
  ) => Promise<void>;

  deleteLecture: (id: string) => Promise<void>;
}

// ─────────── store ───────────

export const useLectureStore = create<LectureState>((set, get) => ({
  lectures: [],

  loadLectures: async () => {
    const { data } = await api.get("/timetable");

    const entries = data as any[]; // Assert data is an array

    const lectures: Lecture[] = entries.map((entry: any) => ({
      id: entry.id,
      subject: entry.subject?.name || "N/A",
      teacher: entry.teacher?.name || "TBD",
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room || "Unknown",
      day: entry.day,
      program: entry.program,
      year: entry.year,
      class: entry.class,
    }));

    set({ lectures });
  },

  setLectures: (lectures) => set({ lectures }),

  addLecture: async (l, selectedClass) => {
    await api.post("/timetable", {
      ...l,
      program: selectedClass.name,
      year: selectedClass.branchYear.number,
      class: selectedClass.branch.name,
    });

    await get().loadLectures();
  },

  updateLecture: async (l, selectedClass) => {
    await api.put(`/timetable/${l.id}`, {
      ...l,
      program: selectedClass.name,
      year: selectedClass.branchYear.number,
      class: selectedClass.branch.name,
    });

    await get().loadLectures();
  },

  deleteLecture: async (id) => {
    await api.delete(`/timetable/${id}`);
    await get().loadLectures();
  },
}));
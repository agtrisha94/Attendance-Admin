// src/stores/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { format } from "date-fns";
import api from "@/lib/api"; // Assuming Axios instance

export type Role = "ADMIN" | "STUDENT" | "TEACHER" | null;

export interface ClassItem {
  classId: number;
  className: string;
  semester: number;
  branch: string;
  subjectId?: string;
  subjectName?: string;
}

/* -------------------------
   Auth store
   ------------------------- */

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

  selectedClass: ClassItem | null;
  setSelectedClass: (cls: ClassItem | null) => void;

  logout: () => void;
  reset: () => void;
};

/**
 * In-memory fallback Storage used during SSR or when localStorage is unavailable.
 * Implements minimal Storage-like API expected by createJSONStorage:
 *   - getItem(key): string | null
 *   - setItem(key, value): void
 *   - removeItem(key): void
 */
const createMemoryStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem(key: string) {
      const v = map.get(key);
      return v === undefined ? null : v;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    removeItem(key: string) {
      map.delete(key);
    },
  } as Storage; // cast for compatibility with createJSONStorage
};

/**
 * Storage factory for zustand's createJSONStorage.
 * Returns window.localStorage in browser, otherwise an in-memory fallback.
 */
const storageFactory = () => {
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    return window.localStorage;
  }
  return createMemoryStorage();
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

      selectedClass: null,
      setSelectedClass: (cls) => set({ selectedClass: cls }),

      logout: () =>
        set({
          isAuthenticated: false,
          userId: null,
          teacherId: null,
          role: null,
          token: null,
          selectedClass: null,
        }),

      reset: () =>
        set({
          isAuthenticated: false,
          userId: null,
          teacherId: null,
          role: null,
          token: null,
          loading: false,
          selectedClass: null,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(storageFactory),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        teacherId: state.teacherId,
        role: state.role,
        token: state.token,
        selectedClass: state.selectedClass,
      }),
    }
  )
);

/* -------------------------
   Calendar store
   ------------------------- */

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

/* -------------------------
   Lecture store
   ------------------------- */

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

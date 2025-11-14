// =======================
// 📦 UI Component Props
// =======================

export interface CustomInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
}

export interface CustomButtonProps {
  title: string;
  onPress: () => void;
  buttonStyle?: any;      // RN ViewStyle (kept generic, you can change later)
  textStyle?: any;        // RN TextStyle
}

export interface CustomHeaderProps {
  title: string;
  subtitle?: string;
}

export interface AnalyticsCardProps {
  title: string;
  value: number;
  total: number;
}

export interface TabBarIconProps {
  focused: boolean;
  icon: React.ReactNode;
  title: string;
}

// =======================
// 🎓 Academic Models
// =======================

export interface Program {
  id: string;
  name: string;
}

export interface Year {
  id: string;
  number: number;
  label?: string;   // unchanged
}

export interface Branch {
  id: string;
  name: string;
}

export interface Class {
  id: number;
  name: string;
}

export interface BranchWithClasses {
  branchId: string;
  classes: AcademicClass[];
}

// This stays EXACTLY as you wrote it
export type SelectionLevel = 'program' | 'year' | 'branch';

// =======================
// 👥 People Models
// =======================

export interface Student {
  id: string;
  name: string;
  enrollmentNumber: string;
}

export interface Teacher {
  id: string;
  name: string;
}

// =======================
// 📚 Subject Models
// =======================

export interface Subject {
  id: string;
  name: string;
  code: string;
  type: 'THEORY' | 'LAB';
}

export interface ElectiveGroup {
  id: string;
  name: string;
  subjects: Subject[];
}

// =======================
// 🗓 Timetable DTOs
// =======================

export interface CreateTimetableDto {
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  subject: string;
  session: string;
  semester: number;
  branch: string;
  class: string;
}

export interface UpdateTimetableDto extends Partial<CreateTimetableDto> {}

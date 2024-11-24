import create from 'zustand';

interface CourseInfo {
  courseName: string;
  courseTag: string;
  courseDescription: string;
  viewNum: number;
}

interface CourseDetailStore {
  courseInfo: CourseInfo | null;
  setCourseInfo: (courseInfo: CourseInfo) => void;
}

export const useCourseDetailStore = create<CourseDetailStore>((set) => ({
  courseInfo: null,
  setCourseInfo: (courseInfo) => set({ courseInfo }),
}));

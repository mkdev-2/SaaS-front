import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DateRange } from '../types/dashboard';
import { getDefaultDateRange, ensureDateObjects } from '../utils/dateUtils';

interface DashboardState {
  selectedDate: DateRange;
  setSelectedDate: (date: DateRange) => void;
  resetDate: () => void;
}

const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      selectedDate: getDefaultDateRange(),
      setSelectedDate: (date: DateRange) => {
        const validatedDate = ensureDateObjects(date);
        set({ selectedDate: validatedDate });
      },
      resetDate: () => set({ selectedDate: getDefaultDateRange() })
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        selectedDate: {
          start: state.selectedDate.start.toISOString(),
          end: state.selectedDate.end.toISOString(),
          compareStart: state.selectedDate.compareStart.toISOString(),
          compareEnd: state.selectedDate.compareEnd.toISOString(),
          comparison: state.selectedDate.comparison
        }
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.selectedDate) {
          state.selectedDate = ensureDateObjects(state.selectedDate);
        }
      }
    }
  )
);
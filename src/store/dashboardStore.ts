import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DateRange } from '../types/dashboard';
import { getDefaultDateRange } from '../utils/dateUtils';

interface DashboardState {
  selectedDate: DateRange;
  setSelectedDate: (date: DateRange) => void;
  resetDate: () => void;
}

const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      selectedDate: getDefaultDateRange(),
      setSelectedDate: (date: DateRange) => set({ 
        selectedDate: {
          start: new Date(date.start),
          end: new Date(date.end),
          compareStart: new Date(date.compareStart),
          compareEnd: new Date(date.compareEnd),
          comparison: date.comparison
        }
      }),
      resetDate: () => set({ selectedDate: getDefaultDateRange() })
    }),
    {
      name: 'dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        selectedDate: {
          ...state.selectedDate,
          start: state.selectedDate.start.toISOString(),
          end: state.selectedDate.end.toISOString(),
          compareStart: state.selectedDate.compareStart.toISOString(),
          compareEnd: state.selectedDate.compareEnd.toISOString()
        }
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.selectedDate) {
          state.selectedDate = {
            ...state.selectedDate,
            start: new Date(state.selectedDate.start),
            end: new Date(state.selectedDate.end),
            compareStart: new Date(state.selectedDate.compareStart),
            compareEnd: new Date(state.selectedDate.compareEnd)
          };
        }
      }
    }
  )
);

export default useDashboardStore;
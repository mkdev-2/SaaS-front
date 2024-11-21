import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DateRange } from '../types/dashboard';
import { getDefaultDateRange } from '../utils/dateUtils';

interface DashboardState {
  selectedDate: DateRange;
  setSelectedDate: (date: DateRange) => void;
}

const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      selectedDate: getDefaultDateRange(),
      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({ selectedDate: state.selectedDate }),
    }
  )
);

export default useDashboardStore;
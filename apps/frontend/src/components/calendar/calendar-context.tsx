'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { Appointment, CalendarView, CalendarFilters } from '@/types';
import { appointmentsService } from '@/services/appointments.service';
import { toDateKey, isoToDateKey } from '@/lib/utils';

interface CalendarState {
  view: CalendarView;
  currentDate: Date;
  appointments: Appointment[];
  byDay: Record<string, Appointment[]>;
  loading: boolean;
  filters: CalendarFilters;
  selectedAppointment: Appointment | null;
  showAppointmentModal: boolean;
  modalMode: 'view' | 'create' | 'edit';
  modalDefaultDate: string | null;
  specialists: { id: string; firstName: string; lastName: string }[];
}

interface CalendarContextValue extends CalendarState {
  setView: (view: CalendarView) => void;
  goNext: () => void;
  goPrev: () => void;
  goToday: () => void;
  goToDate: (date: Date) => void;
  setFilters: (filters: CalendarFilters | ((prev: CalendarFilters) => CalendarFilters)) => void;
  clearFilters: () => void;
  openAppointment: (appointment: Appointment) => void;
  openNewAppointment: (date?: string) => void;
  closeAppointmentModal: () => void;
  refreshCalendar: () => Promise<void>;
  updateAppointmentInState: (id: string, changes: Partial<Appointment>) => void;
  removeAppointmentFromState: (id: string) => void;
  addAppointmentToState: (appointment: Appointment) => void;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

const DAY_MS = 86400000;

function getDateRange(view: CalendarView, date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  if (view === 'month') {
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { start, end };
  }
  if (view === 'week') {
    const day = d.getDay();
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - day));
    return { start, end };
  }
  return { start: d, end: d };
}

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [byDay, setByDay] = useState<Record<string, Appointment[]>>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFiltersState] = useState<CalendarFilters>({});
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');
  const [modalDefaultDate, setModalDefaultDate] = useState<string | null>(null);
  const [specialists, setSpecialists] = useState<any[]>([]);

  const refreshCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(view, currentDate);
      const params: any = {
        dateFrom: toDateKey(start),
        dateTo: toDateKey(end),
        ...filters,
      };
      const groupByLocalDay = (list: Appointment[]) => {
        const grouped: Record<string, Appointment[]> = {};
        for (const a of list) {
          const key = isoToDateKey(a.scheduledAt);
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(a);
        }
        return grouped;
      };
      if (view === 'month') {
        const res = await appointmentsService.getCalendar(currentDate.getFullYear(), currentDate.getMonth() + 1, params);
        const list = res.data.data.appointments || [];
        setAppointments(list);
        setByDay(groupByLocalDay(list));
      } else {
        const res = await appointmentsService.getAll(params);
        const list = res.data.data || [];
        setAppointments(list);
        setByDay(groupByLocalDay(list));
      }
    } catch {
      setAppointments([]);
      setByDay({});
    } finally {
      setLoading(false);
    }
  }, [view, currentDate, filters]);

  useEffect(() => { refreshCalendar(); }, [refreshCalendar]);

  useEffect(() => {
    appointmentsService.getSpecialists().then((res) => setSpecialists(res.data.data || [])).catch(() => {});
  }, []);

  const goNext = useCallback(() => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  }, [view, currentDate]);

  const goPrev = useCallback(() => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  }, [view, currentDate]);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);
  const goToDate = useCallback((date: Date) => setCurrentDate(date), []);

  const clearFilters = useCallback(() => setFiltersState({}), []);

  const setFilters = useCallback((filters: CalendarFilters | ((prev: CalendarFilters) => CalendarFilters)) => {
    setFiltersState((prev) => (typeof filters === 'function' ? (filters as (p: CalendarFilters) => CalendarFilters)(prev) : filters));
  }, []);

  const openAppointment = useCallback((a: Appointment) => {
    setSelectedAppointment(a);
    setModalMode('view');
    setShowAppointmentModal(true);
  }, []);

  const openNewAppointment = useCallback((date?: string) => {
    setSelectedAppointment(null);
    setModalMode('create');
    setModalDefaultDate(date || null);
    setShowAppointmentModal(true);
  }, []);

  const closeAppointmentModal = useCallback(() => {
    setShowAppointmentModal(false);
    setSelectedAppointment(null);
    setModalDefaultDate(null);
  }, []);

  const updateAppointmentInState = useCallback((id: string, changes: Partial<Appointment>) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...changes } : a)));
  }, []);

  const removeAppointmentFromState = useCallback((id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addAppointmentToState = useCallback((appointment: Appointment) => {
    setAppointments((prev) => [...prev, appointment]);
  }, []);

  const value = useMemo(() => ({
    view, currentDate, appointments, byDay, loading, filters,
    selectedAppointment, showAppointmentModal, modalMode, modalDefaultDate, specialists,
    setView, goNext, goPrev, goToday, goToDate,
    setFilters, clearFilters,
    openAppointment, openNewAppointment, closeAppointmentModal,
    refreshCalendar, updateAppointmentInState, removeAppointmentFromState, addAppointmentToState,
  }), [view, currentDate, appointments, byDay, loading, filters, selectedAppointment, showAppointmentModal, modalMode, modalDefaultDate, specialists, setView, goNext, goPrev, goToday, goToDate, setFilters, clearFilters, openAppointment, openNewAppointment, closeAppointmentModal, refreshCalendar, updateAppointmentInState, removeAppointmentFromState, addAppointmentToState]);

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendar must be used within CalendarProvider');
  return ctx;
}

'use client';

import { useState, useMemo } from 'react';
import { CalendarProvider, useCalendar } from './calendar-context';
import { CalendarToolbar } from './calendar-toolbar';
import { FilterBar } from './filter-bar';
import { MiniCalendar } from './mini-calendar';
import { MonthView } from './month-view';
import { WeekView } from './week-view';
import { DayView } from './day-view';
import { AgendaView } from './agenda-view';
import { AppointmentModal } from './appointment-modal';
import { isoToDateKey } from '@/lib/utils';

function CalendarBody() {
  const {
    view, currentDate, appointments, byDay, loading,
    goToDate, openAppointment, openNewAppointment,
    showAppointmentModal, modalMode, selectedAppointment, modalDefaultDate,
    closeAppointmentModal,
  } = useCalendar();

  const appointmentDays = useMemo(() => {
    const s = new Set<string>();
    for (const a of appointments) {
      s.add(isoToDateKey(a.scheduledAt));
    }
    return s;
  }, [appointments]);

  const handleDayClick = (date: string) => {
    const [y, m, d] = date.split('-').map(Number);
    goToDate(new Date(y, m - 1, d));
    openNewAppointment(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid var(--border)', borderTopColor: 'var(--primary)' }} />
          <span style={{ color: 'var(--text-muted)' }}>جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div className="hidden lg:block w-56 shrink-0">
        <MiniCalendar currentDate={currentDate} onDateSelect={goToDate} appointmentDays={appointmentDays} />
      </div>
      <div className="flex-1 min-w-0">
        <CalendarToolbar />
        <FilterBar />
        {view === 'month' && (
          <MonthView currentDate={currentDate} byDay={byDay} onDayClick={handleDayClick} onAppointmentClick={openAppointment} />
        )}
        {view === 'week' && (
          <WeekView currentDate={currentDate} appointments={appointments} onAppointmentClick={openAppointment} />
        )}
        {view === 'day' && (
          <DayView currentDate={currentDate} appointments={appointments} onAppointmentClick={openAppointment} />
        )}
        {view === 'agenda' && (
          <AgendaView appointments={appointments} onAppointmentClick={openAppointment} />
        )}
      </div>

      {showAppointmentModal && (
        <AppointmentModal
          mode={modalMode}
          appointment={selectedAppointment}
          onClose={closeAppointmentModal}
          defaultDate={modalDefaultDate ?? undefined}
        />
      )}
    </div>
  );
}

export function Calendar() {
  return (
    <CalendarProvider>
      <CalendarBody />
    </CalendarProvider>
  );
}

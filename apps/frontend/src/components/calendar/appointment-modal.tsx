'use client';

import { useState, useEffect } from 'react';
import { X, Clock, MapPin, User, FileText, Trash2, Edit3, Save, AlertCircle } from 'lucide-react';
import { Appointment, CALENDAR_DEFAULT_COLORS, APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from '@/types';
import { appointmentsService } from '@/services/appointments.service';
import { beneficiariesService } from '@/services/beneficiaries.service';
import { useCalendar } from './calendar-context';

interface AppointmentModalProps {
  mode: 'view' | 'create' | 'edit';
  appointment: Appointment | null;
  onClose: () => void;
  defaultDate?: string;
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_OPTIONS: Array<{ value: Appointment['status']; label: string }> = [
  { value: 'scheduled', label: 'مجدول' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
  { value: 'no_show', label: 'لم يحضر' },
];

const TYPE_OPTIONS: Array<{ value: Appointment['type']; label: string }> = [
  { value: 'initial', label: 'استشارة أولى' },
  { value: 'follow_up', label: 'متابعة' },
  { value: 'assessment', label: 'تقييم' },
  { value: 'group', label: 'جلسة جماعية' },
];

export function AppointmentModal({ mode: initialMode, appointment, onClose, defaultDate }: AppointmentModalProps) {
  const { specialists, refreshCalendar, addAppointmentToState, updateAppointmentInState, removeAppointmentFromState } = useCalendar();
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [beneficiaries, setBeneficiaries] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [form, setForm] = useState({
    beneficiaryId: appointment?.beneficiaryId || '',
    specialistId: appointment?.specialistId || '',
    type: appointment?.type || 'initial' as Appointment['type'],
    status: appointment?.status || 'scheduled' as Appointment['status'],
    scheduledAt: appointment ? toLocalInputValue(appointment.scheduledAt) : (defaultDate ? `${defaultDate}T09:00` : ''),
    durationMinutes: appointment?.durationMinutes || 60,
    location: appointment?.location || '',
    notes: appointment?.notes || '',
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  useEffect(() => {
    beneficiariesService.getAll({ limit: 100 })
      .then((res) => setBeneficiaries(res.data.data || []))
      .catch(() => {});
  }, []);

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'create') {
        const res = await appointmentsService.create(form as any);
        addAppointmentToState(res.data.data);
      } else if (mode === 'edit' && appointment) {
        const res = await appointmentsService.update(appointment.id, form as any);
        updateAppointmentInState(appointment.id, res.data.data);
      }
      onClose();
      refreshCalendar();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;
    if (!window.confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;
    setLoading(true);
    try {
      await appointmentsService.delete(appointment.id);
      removeAppointmentFromState(appointment.id);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const renderBackdrop = () => (
    <div className="fixed inset-0 bg-overlay z-40" onClick={onClose} />
  );

  const renderModal = (children: React.ReactNode) => (
    <>
      {renderBackdrop()}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div role="dialog" aria-modal="true" aria-label="موعد"
          className="w-full max-w-md rounded-2xl p-6 shadow-modal" style={{ backgroundColor: 'var(--surface-modal)' }} onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </>
  );

  if (mode === 'view' && appointment) {
    const sColors = CALENDAR_DEFAULT_COLORS.status[appointment.status];
    const time = new Date(appointment.scheduledAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
    const date = new Date(appointment.scheduledAt).toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return renderModal(
      <>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>تفاصيل الموعد</h2>
          <button onClick={onClose} aria-label="إغلاق" className="p-1 rounded hover:bg-[var(--surface)] transition"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User size={16} style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{appointment.beneficiary?.firstName} {appointment.beneficiary?.lastName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{date} · {time}</span>
          </div>
          {appointment.durationMinutes && (
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>المدة: {appointment.durationMinutes} دقيقة</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: sColors.bg, color: sColors.text }}>
              {APPOINTMENT_STATUS_LABELS[appointment.status]}
            </span>
            {appointment.type && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: CALENDAR_DEFAULT_COLORS.type[appointment.type].bg, color: CALENDAR_DEFAULT_COLORS.type[appointment.type].text }}>
                {APPOINTMENT_TYPE_LABELS[appointment.type]}
              </span>
            )}
          </div>
          {appointment.location && (
            <div className="flex items-center gap-2">
              <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{appointment.location}</span>
            </div>
          )}
          {appointment.notes && (
            <div className="flex items-start gap-2">
              <FileText size={16} style={{ color: 'var(--text-muted)' }} className="mt-0.5 shrink-0" />
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{appointment.notes}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setMode('edit')} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
            <Edit3 size={14} /> تعديل
          </button>
          <button onClick={handleDelete} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
            <Trash2 size={14} /> حذف
          </button>
        </div>
      </>
    );
  }

  return renderModal(
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          {mode === 'create' ? 'موعد جديد' : 'تعديل الموعد'}
        </h2>
        <button onClick={onClose} aria-label="إغلاق" className="p-1 rounded hover:bg-[var(--surface)] transition"><X size={18} /></button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 text-sm rounded-lg" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger-text)' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>المستفيد</label>
          <select value={form.beneficiaryId} onChange={(e) => updateField('beneficiaryId', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
            <option value="">اختر المستفيد</option>
            {beneficiaries.map((b) => (
              <option key={b.id} value={b.id}>{b.firstName} {b.lastName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>الأخصائي</label>
          <select value={form.specialistId} onChange={(e) => updateField('specialistId', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
            <option value="">اختر الأخصائي</option>
            {specialists.map((s: any) => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>النوع</label>
            <select value={form.type} onChange={(e) => updateField('type', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
              {TYPE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>الحالة</label>
            <select value={form.status} onChange={(e) => updateField('status', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
              {STATUS_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>التاريخ والوقت</label>
          <input type="datetime-local" value={form.scheduledAt} onChange={(e) => updateField('scheduledAt', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>المدة (دقائق)</label>
            <input type="number" value={form.durationMinutes} onChange={(e) => {
              const raw = parseInt(e.target.value, 10);
              updateField('durationMinutes', Number.isNaN(raw) ? 60 : raw);
            }}
              className="w-full px-3 py-2 text-sm rounded-lg"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>الموقع</label>
            <input value={form.location} onChange={(e) => updateField('location', e.target.value)}
              placeholder="الموقع"
              className="w-full px-3 py-2 text-sm rounded-lg"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>ملاحظات</label>
          <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }} />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={handleSubmit} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg text-white font-medium"
          style={{ backgroundColor: 'var(--primary)' }}>
          {loading ? 'جاري الحفظ...' : <><Save size={14} /> حفظ</>}
        </button>
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: 'var(--text-muted)' }}>
          إلغاء
        </button>
      </div>
    </>
  );
}

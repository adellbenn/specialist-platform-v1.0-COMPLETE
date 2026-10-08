'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, User, FileText, Edit3, Trash2, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Appointment, CALENDAR_DEFAULT_COLORS, APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from '@/types';
import { appointmentsService } from '@/services/appointments.service';
import { beneficiariesService } from '@/services/beneficiaries.service';
import { useCalendar } from './calendar-context';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

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

interface AppointmentFormState {
  beneficiaryId: string;
  specialistId: string;
  type: Appointment['type'];
  status: Appointment['status'];
  scheduledAt: string;
  durationMinutes: number;
  location: string;
  notes: string;
}

export function AppointmentModal({ mode: initialMode, appointment, onClose, defaultDate }: AppointmentModalProps) {
  const { specialists, refreshCalendar, addAppointmentToState, updateAppointmentInState, removeAppointmentFromState } = useCalendar();
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [form, setForm] = useState<AppointmentFormState>({
    beneficiaryId: appointment?.beneficiaryId || '',
    specialistId: appointment?.specialistId || '',
    type: appointment?.type || 'initial',
    status: appointment?.status || 'scheduled',
    scheduledAt: appointment ? toLocalInputValue(appointment.scheduledAt) : (defaultDate ? `${defaultDate}T09:00` : ''),
    durationMinutes: appointment?.durationMinutes || 60,
    location: appointment?.location || '',
    notes: appointment?.notes || '',
  });

  useEffect(() => {
    beneficiariesService.getAll({ limit: 100 })
      .then((res) => setBeneficiaries(res.data.data || []))
      .catch(() => {});
  }, []);

  const updateField = (field: keyof AppointmentFormState, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'create') {
        const res = await appointmentsService.create(form);
        addAppointmentToState(res.data.data);
      } else if (mode === 'edit' && appointment) {
        const res = await appointmentsService.update(appointment.id, form);
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

  const performDelete = async () => {
    if (!appointment) return;
    setLoading(true);
    try {
      await appointmentsService.delete(appointment.id);
      removeAppointmentFromState(appointment.id);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'حدث خطأ أثناء حذف الموعد');
      setConfirmDelete(false);
    } finally {
      setLoading(false);
    }
  };

  const modeTitle = mode === 'view' ? 'تفاصيل الموعد' : mode === 'create' ? 'موعد جديد' : 'تعديل الموعد';

  if (mode === 'view' && appointment) {
    return (
      <>
        <Dialog
          open
          onClose={onClose}
          title="تفاصيل الموعد"
          size="md"
          footer={
            <>
              <Button variant="outline" icon={Edit3} onClick={() => setMode('edit')}>
                تعديل
              </Button>
              <Button variant="danger" icon={Trash2} onClick={() => setConfirmDelete(true)}>
                حذف
              </Button>
            </>
          }
        >
          <ViewContent appointment={appointment} />
        </Dialog>

        <Dialog
          open={confirmDelete}
          onClose={() => !loading && setConfirmDelete(false)}
          title="حذف الموعد"
          size="sm"
          footer={
            <>
              <Button variant="outline" disabled={loading} onClick={() => setConfirmDelete(false)}>إلغاء</Button>
              <Button variant="danger" loading={loading} onClick={performDelete}>حذف</Button>
            </>
          }
        >
          <p className="text-sm text-text-secondary">
            هل أنت متأكد من حذف هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
        </Dialog>
      </>
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={modeTitle}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button icon={Save} loading={loading} onClick={handleSubmit}>حفظ</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm rounded-lg bg-status-error-light text-status-error-text">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}

        <Select
          label="المستفيد"
          value={form.beneficiaryId}
          onChange={(e) => updateField('beneficiaryId', e.target.value)}
          options={beneficiaries.map((b) => ({ value: b.id, label: `${b.firstName} ${b.lastName}` }))}
          placeholder="اختر المستفيد"
        />

        <Select
          label="الأخصائي"
          value={form.specialistId}
          onChange={(e) => updateField('specialistId', e.target.value)}
          options={specialists.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))}
          placeholder="اختر الأخصائي"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="النوع"
            value={form.type}
            onChange={(e) => updateField('type', e.target.value)}
            options={TYPE_OPTIONS}
          />
          <Select
            label="الحالة"
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>

        <Input
          label="التاريخ والوقت"
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => updateField('scheduledAt', e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="المدة (دقائق)"
            type="number"
            value={form.durationMinutes}
            onChange={(e) => {
              const raw = parseInt(e.target.value, 10);
              updateField('durationMinutes', Number.isNaN(raw) ? 60 : raw);
            }}
          />
          <Input
            label="الموقع"
            value={form.location}
            placeholder="الموقع"
            onChange={(e) => updateField('location', e.target.value)}
          />
        </div>

        <Textarea
          label="ملاحظات"
          rows={3}
          value={form.notes}
          placeholder="ملاحظات إضافية..."
          onChange={(e) => updateField('notes', e.target.value)}
        />
      </div>
    </Dialog>
  );
}

function ViewContent({ appointment }: { appointment: Appointment }) {
  const sColors = CALENDAR_DEFAULT_COLORS.status[appointment.status];
  const time = new Date(appointment.scheduledAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(appointment.scheduledAt).toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-4">
      {(appointment.beneficiary) && (
        <div className="flex items-center gap-2">
          <User size={16} className="text-text-muted shrink-0" />
          <span className="text-sm text-text-primary">
            {appointment.beneficiary.firstName} {appointment.beneficiary.lastName}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-text-muted shrink-0" />
        <span className="text-sm text-text-primary">{date} · {time}</span>
      </div>
      {appointment.durationMinutes > 0 && (
        <div className="text-sm text-text-muted">المدة: {appointment.durationMinutes} دقيقة</div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge label={APPOINTMENT_STATUS_LABELS[appointment.status]}
          style={{ backgroundColor: sColors.bg, color: sColors.text }} />
        {appointment.type && (
          <Badge label={APPOINTMENT_TYPE_LABELS[appointment.type]}
            style={{
              backgroundColor: CALENDAR_DEFAULT_COLORS.type[appointment.type].bg,
              color: CALENDAR_DEFAULT_COLORS.type[appointment.type].text,
            }} />
        )}
      </div>
      {appointment.location && (
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-text-muted shrink-0" />
          <span className="text-sm text-text-primary">{appointment.location}</span>
        </div>
      )}
      {appointment.notes && (
        <div className="flex items-start gap-2">
          <FileText size={16} className="text-text-muted mt-0.5 shrink-0" />
          <p className="text-sm text-text-primary">{appointment.notes}</p>
        </div>
      )}
    </div>
  );
}
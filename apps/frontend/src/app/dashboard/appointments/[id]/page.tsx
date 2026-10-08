'use client';

import { useState, useEffect } from 'react';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight, CheckCircle, XCircle, AlertCircle,
  Clock, User, FileText, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentsService, CompleteSessionPayload } from '@/services/appointments.service';
import {
  Appointment,
  APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_TYPE_LABELS,
} from '@/types';
import { Card, SectionHeader, DetailRow } from '@/components/ui/card';
import { Badge }          from '@/components/ui/badge';
import { Button }         from '@/components/ui/button';
import { Dialog }         from '@/components/ui/dialog';
import { Textarea }       from '@/components/ui/textarea';
import { PermissionGate } from '@/components/auth/permission-gate';
import { formatDateTime } from '@/lib/utils';

const ATTENDANCE_OPTIONS = [
  { value: 'present', label: 'حاضر' },
  { value: 'absent',  label: 'غائب' },
  { value: 'late',    label: 'متأخر' },
  { value: 'excused', label: 'بعذر' },
];

export default function AppointmentDetailPage() {
  const { id }        = useParams<{ id: string }>();
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const autoComplete  = searchParams.get('action') === 'complete';

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading]         = useState(true);
  const [showCompleteForm, setShowCompleteForm] = useState(autoComplete);
  const [saving, setSaving]           = useState(false);
  const [cancelOpen, setCancelOpen]   = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [busy, setBusy]               = useState<string | null>(null);

  const [sessionForm, setSessionForm] = useState<CompleteSessionPayload>({
    attendance: 'present',
    moodAssessment: 7,
    objectivesMet: true,
    sessionNotes: '',
    homeworkAssigned: '',
    nextSessionPlan: '',
    interventionsUsed: [],
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await appointmentsService.getOne(id);
        setAppointment(res.data.data);
      } catch {
        toast.error('فشل تحميل الموعد');
        router.push('/dashboard/appointments');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const handleConfirm = async () => {
    setBusy('confirm');
    try {
      const res = await appointmentsService.confirm(id);
      setAppointment(res.data.data);
      toast.success('تم تأكيد الموعد');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل التأكيد');
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    setBusy('cancel');
    setCancelOpen(false);
    try {
      const res = await appointmentsService.cancel(id, cancelReason);
      setAppointment(res.data.data);
      setCancelReason('');
      toast.success('تم إلغاء الموعد');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل الإلغاء');
    } finally {
      setBusy(null);
    }
  };

  const handleNoShow = async () => {
    setBusy('no-show');
    try {
      const res = await appointmentsService.markNoShow(id);
      setAppointment(res.data.data);
      toast.success('تم تسجيل عدم الحضور');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل التسجيل');
    } finally {
      setBusy(null);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await appointmentsService.complete(id, sessionForm);
      toast.success('تم تسجيل الجلسة بنجاح');
      router.push('/dashboard/appointments');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل تسجيل الجلسة');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSkeleton variant="detail" />;
  if (!appointment) return null;

  const a = appointment;
  const canAct = !['completed', 'cancelled', 'no_show'].includes(a.status);

  return (
    <>
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-2xl hover:bg-surface-secondary text-text-secondary transition mt-0.5">
          <ArrowRight size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-text-primary">تفاصيل الموعد</h1>
            <Badge label={APPOINTMENT_STATUS_LABELS[a.status]} className={APPOINTMENT_STATUS_COLORS[a.status]} dot />
            <Badge label={APPOINTMENT_TYPE_LABELS[a.type]} className="bg-surface text-text-secondary" />
          </div>
          <p className="text-sm text-text-muted mt-0.5">{formatDateTime(a.scheduledAt)}</p>
        </div>
      </div>

      {/* تفاصيل الموعد */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <SectionHeader icon={Clock} title="معلومات الموعد" />
          <div className="space-y-0.5">
            <DetailRow label="التاريخ والوقت" value={formatDateTime(a.scheduledAt)} />
            <DetailRow label="المدة" value={`${a.durationMinutes} دقيقة`} />
            <DetailRow label="النوع" value={APPOINTMENT_TYPE_LABELS[a.type]} />
            {a.location && <DetailRow label="الموقع" value={a.location} />}
            {a.cancellationReason && (
              <DetailRow label="سبب الإلغاء" value={a.cancellationReason} />
            )}
          </div>
        </Card>

        <Card>
          <SectionHeader icon={User} title="المشاركون" />
          <div className="space-y-3">
            {a.beneficiary && (
              <div>
                <p className="text-xs text-text-muted mb-1">المستفيد</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {a.beneficiary.firstName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {a.beneficiary.firstName} {a.beneficiary.lastName}
                    </p>
                    <p className="text-xs text-text-muted font-mono">{a.beneficiary.fileNumber}</p>
                  </div>
                </div>
              </div>
            )}
            {a.specialist && (
              <div>
                <p className="text-xs text-text-muted mb-1">الأخصائي</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {a.specialist.firstName[0]}
                  </div>
                  <p className="text-sm font-semibold text-text-primary">
                    {a.specialist.firstName} {a.specialist.lastName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ملاحظات */}
      {a.notes && (
        <Card>
          <SectionHeader icon={FileText} title="ملاحظات" />
          <p className="text-sm text-text-secondary leading-relaxed">{a.notes}</p>
        </Card>
      )}

      {/* أزرار الإجراءات */}
      {canAct && (
        <PermissionGate permission="appointment:confirm">
          <Card>
            <SectionHeader icon={CheckCircle} title="إجراءات الموعد" iconColor="text-primary" />
            <div className="flex flex-wrap gap-2">
              {a.status === 'scheduled' && (
                <Button icon={CheckCircle} loading={busy === 'confirm'} disabled={busy !== null} onClick={handleConfirm}>تأكيد الموعد</Button>
              )}
              {['scheduled', 'confirmed'].includes(a.status) && !showCompleteForm && (
                <Button icon={FileText} disabled={busy !== null} onClick={() => setShowCompleteForm(true)}>إتمام وتسجيل الجلسة</Button>
              )}
              {['scheduled', 'confirmed'].includes(a.status) && (
                <>
                  <Button variant="danger" icon={AlertCircle} loading={busy === 'no-show'} disabled={busy !== null} onClick={handleNoShow}>لم يحضر</Button>
                  <Button variant="outline" icon={XCircle} className="border-danger/30 text-danger hover:bg-danger-light" disabled={busy !== null} onClick={() => { setCancelReason(''); setCancelOpen(true); }}>إلغاء الموعد</Button>
                </>
              )}
            </div>
          </Card>
        </PermissionGate>
      )}

      {/* ─── نموذج تسجيل الجلسة ─── */}
      {showCompleteForm && (
        <Card>
          <SectionHeader icon={FileText} title="تسجيل الجلسة" iconColor="text-success"
            subtitle="سيتم إتمام الموعد وإنشاء سجل الجلسة" />

          <div className="space-y-5">
            {/* الحضور */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">الحضور</label>
              <div className="flex flex-wrap gap-2">
                {ATTENDANCE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    size="sm"
                    variant={sessionForm.attendance === opt.value ? 'primary' : 'outline'}
                    onClick={() => setSessionForm((p) => ({ ...p, attendance: opt.value }))}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* تقييم المزاج */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                تقييم حالة المستفيد: <span className="text-primary font-bold">{sessionForm.moodAssessment}/10</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">1</span>
                <input type="range" min={1} max={10} value={sessionForm.moodAssessment}
                  onChange={(e) => setSessionForm((p) => ({ ...p, moodAssessment: +e.target.value }))}
                  className="flex-1 accent-primary" />
                <span className="text-xs text-text-muted">10</span>
              </div>
            </div>

            {/* تحقق الأهداف */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-text-primary">هل تحققت أهداف الجلسة؟</label>
              <div className="flex gap-3">
                {[true, false].map((val) => (
                  <label key={String(val)} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="objectivesMet"
                      checked={sessionForm.objectivesMet === val}
                      onChange={() => setSessionForm((p) => ({ ...p, objectivesMet: val }))}
                      className="accent-primary" />
                    <span className="text-sm text-text-primary">{val ? 'نعم' : 'لا'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ملاحظات الجلسة */}
            <Textarea label="ملاحظات الجلسة" rows={4}
              placeholder="ملخص ما تم في الجلسة..."
              value={sessionForm.sessionNotes}
              onChange={(e) => setSessionForm((p) => ({ ...p, sessionNotes: e.target.value }))} />

            {/* الواجب المنزلي */}
            <Textarea label="الواجب المنزلي" rows={2}
              placeholder="مهام للمستفيد حتى الجلسة القادمة..."
              value={sessionForm.homeworkAssigned}
              onChange={(e) => setSessionForm((p) => ({ ...p, homeworkAssigned: e.target.value }))} />

            {/* خطة الجلسة القادمة */}
            <Textarea label="خطة الجلسة القادمة" rows={2}
              placeholder="ما المخطط للجلسة التالية..."
              value={sessionForm.nextSessionPlan}
              onChange={(e) => setSessionForm((p) => ({ ...p, nextSessionPlan: e.target.value }))} />

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setShowCompleteForm(false)}>إلغاء</Button>
              <Button icon={Save} loading={saving} onClick={handleComplete}>حفظ الجلسة</Button>
            </div>
          </div>
        </Card>
      )}
    </div>

    <Dialog
      open={cancelOpen}
      onClose={() => setCancelOpen(false)}
      title="إلغاء الموعد"
      size="sm"
      footer={
        <>
          <Button variant="outline" disabled={busy !== null} onClick={() => setCancelOpen(false)}>إلغاء</Button>
          <Button variant="danger" loading={busy === 'cancel'} onClick={handleCancel}>تأكيد الإلغاء</Button>
        </>
      }
    >
      <div className="space-y-2">
        <p className="text-sm text-text-secondary">سيتم إلغاء الموعد، ويمكنك إضافة سبب (اختياري).</p>
        <Textarea
          rows={3}
          placeholder="سبب الإلغاء..."
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </div>
    </Dialog>
    </>
  );
}

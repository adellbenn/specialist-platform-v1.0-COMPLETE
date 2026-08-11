'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Save, Loader2, User, FileText, Calendar, Edit, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionsService } from '@/services/sessions.service';
import { Card, SectionHeader, DetailRow } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-permissions';
import { useRouteGuard } from '@/components/auth/route-guard';
import { ATTENDANCE_LABELS, Session } from '@/types';
import { formatDateTime } from '@/lib/utils';

const ATTENDANCE_OPTIONS = Object.entries(ATTENDANCE_LABELS).map(([v, l]) => ({ value: v, label: l }));

const ATTENDANCE_COLORS: Record<string, { bg: string; text: string }> = {
  present: { bg: 'var(--status-success-light)', text: 'var(--status-success-text)' },
  absent:  { bg: 'var(--status-error-light)',   text: 'var(--status-error-text)' },
  late:    { bg: 'var(--status-warning-light)', text: 'var(--status-warning-text)' },
  excused: { bg: 'var(--status-warning-light)', text: 'var(--status-warning-text)' },
};

export default function SessionDetailPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager', 'supervisor', 'specialist'], redirectTo: '/dashboard' });

  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = usePermissions();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    attendance: '',
    moodAssessment: '',
    objectivesMet: '',
    sessionNotes: '',
    interventionsUsed: '',
    homeworkAssigned: '',
    nextSessionPlan: '',
  });

  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sessionsService.getOne(id);
      setSession(res.data.data);
    } catch {
      toast.error('فشل تحميل الجلسة');
      router.push('/dashboard/sessions');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const startEdit = () => {
    if (!session) return;
    setForm({
      attendance: session.attendance ?? '',
      moodAssessment: session.moodAssessment != null ? String(session.moodAssessment) : '',
      objectivesMet: session.objectivesMet == null ? '' : String(session.objectivesMet),
      sessionNotes: session.sessionNotes ?? '',
      interventionsUsed: (session.interventionsUsed ?? []).join('، '),
      homeworkAssigned: session.homeworkAssigned ?? '',
      nextSessionPlan: session.nextSessionPlan ?? '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {};
      if (form.attendance) payload.attendance = form.attendance;
      if (form.moodAssessment) {
        const mood = Number(form.moodAssessment);
        if (!Number.isNaN(mood)) payload.moodAssessment = mood;
      }
      if (form.objectivesMet) payload.objectivesMet = form.objectivesMet === 'true';
      if (form.sessionNotes.trim()) payload.sessionNotes = form.sessionNotes.trim();
      if (form.interventionsUsed.trim()) {
        payload.interventionsUsed = form.interventionsUsed.split(/[،,]/).map((s) => s.trim()).filter(Boolean);
      }
      if (form.homeworkAssigned.trim()) payload.homeworkAssigned = form.homeworkAssigned.trim();
      if (form.nextSessionPlan.trim()) payload.nextSessionPlan = form.nextSessionPlan.trim();

      const res = await sessionsService.update(id, payload);
      setSession(res.data.data);
      setEditing(false);
      toast.success('تم تحديث الجلسة');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل تحديث الجلسة');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!session) return null;

  const s = session;
  const attColor = ATTENDANCE_COLORS[s.attendance] ?? { bg: 'var(--surface)', text: 'var(--text-muted)' };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg transition mt-0.5"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <ArrowRight size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                جلسة #{s.sessionNumber}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge label={ATTENDANCE_LABELS[s.attendance] ?? s.attendance} style={{ backgroundColor: attColor.bg, color: attColor.text }} dot />
                <Badge label={formatDateTime(s.startedAt)} style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }} />
              </div>
            </div>

            {can('session:update') && (
              editing ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing(false)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    <X size={14} /> إلغاء
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg transition"
                    style={{ backgroundColor: 'var(--primary)', opacity: saving ? 0.65 : 1 }}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} حفظ
                  </button>
                </div>
              ) : (
                <button onClick={startEdit}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Edit size={14} /> تعديل
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <SectionHeader icon={User} title="المشاركون" />
          <div className="space-y-0.5">
            {s.beneficiary && (
              <DetailRow label="المستفيد" value={`${s.beneficiary.firstName} ${s.beneficiary.lastName} (${s.beneficiary.fileNumber})`} />
            )}
            {s.specialist && (
              <DetailRow label="الأخصائي" value={`${s.specialist.firstName} ${s.specialist.lastName}`} />
            )}
          </div>
        </Card>

        <Card>
          <SectionHeader icon={Calendar} title="التوقيت" />
          <div className="space-y-0.5">
            <DetailRow label="تاريخ البداية" value={formatDateTime(s.startedAt)} />
            {s.endedAt && <DetailRow label="تاريخ النهاية" value={formatDateTime(s.endedAt)} />}
            {s.actualDurationMinutes != null && (
              <DetailRow label="المدة الفعلية" value={`${s.actualDurationMinutes} دقيقة`} />
            )}
            <DetailRow label="رقم الجلسة" value={String(s.sessionNumber)} />
          </div>
        </Card>

        <Card>
          <SectionHeader icon={CheckCircle} title="التقييم" iconColor="text-primary" />
          <div className="space-y-0.5">
            {s.moodAssessment != null && (
              <DetailRow label="تقييم المزاج" value={`${s.moodAssessment} / 10`} />
            )}
            {s.objectivesMet != null && (
              <DetailRow label="تحقيق الأهداف" value={s.objectivesMet ? 'نعم' : 'لا'} />
            )}
            <DetailRow label="الحضور" value={ATTENDANCE_LABELS[s.attendance] ?? s.attendance} />
          </div>
        </Card>
      </div>

      {editing ? (
        <Card>
          <SectionHeader icon={Edit} title="تعديل الجلسة" />
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="الحضور"
                options={ATTENDANCE_OPTIONS}
                value={form.attendance}
                onChange={(e) => setForm((p) => ({ ...p, attendance: e.target.value }))}
              />
              <Input
                label="تقييم المزاج (1-10)"
                type="number"
                min={1}
                max={10}
                value={form.moodAssessment}
                onChange={(e) => setForm((p) => ({ ...p, moodAssessment: e.target.value }))}
              />
            </div>
            <Select
              label="تحقيق الأهداف"
              placeholder="لم يُحدد"
              options={[
                { value: 'true', label: 'نعم' },
                { value: 'false', label: 'لا' },
              ]}
              value={form.objectivesMet}
              onChange={(e) => setForm((p) => ({ ...p, objectivesMet: e.target.value }))}
            />
            <Textarea label="ملاحظات الجلسة" rows={4} value={form.sessionNotes}
              onChange={(e) => setForm((p) => ({ ...p, sessionNotes: e.target.value }))} />
            <Textarea label="التدخلات المستخدمة" rows={2} value={form.interventionsUsed}
              onChange={(e) => setForm((p) => ({ ...p, interventionsUsed: e.target.value }))} />
            <Textarea label="الواجب المنزلي" rows={2} value={form.homeworkAssigned}
              onChange={(e) => setForm((p) => ({ ...p, homeworkAssigned: e.target.value }))} />
            <Textarea label="خطة الجلسة القادمة" rows={2} value={form.nextSessionPlan}
              onChange={(e) => setForm((p) => ({ ...p, nextSessionPlan: e.target.value }))} />
          </div>
        </Card>
      ) : (
        <>
          {s.sessionNotes && (
            <Card>
              <SectionHeader icon={FileText} title="ملاحظات الجلسة" />
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                {s.sessionNotes}
              </p>
            </Card>
          )}
          {(s.interventionsUsed?.length ?? 0) > 0 && (
            <Card>
              <SectionHeader icon={FileText} title="التدخلات المستخدمة" />
              <div className="flex flex-wrap gap-2">
                {s.interventionsUsed!.map((i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
                    {i}
                  </span>
                ))}
              </div>
            </Card>
          )}
          {s.homeworkAssigned && (
            <Card>
              <SectionHeader icon={FileText} title="الواجب المنزلي" />
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                {s.homeworkAssigned}
              </p>
            </Card>
          )}
          {s.nextSessionPlan && (
            <Card>
              <SectionHeader icon={FileText} title="خطة الجلسة القادمة" />
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                {s.nextSessionPlan}
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

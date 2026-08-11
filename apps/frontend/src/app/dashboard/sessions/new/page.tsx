'use client';

import { useState, useEffect } from 'react';
import { useRouter }            from 'next/navigation';
import { useForm }              from 'react-hook-form';
import { zodResolver }          from '@hookform/resolvers/zod';
import { z }                    from 'zod';
import { ArrowRight, Save, Loader2, FileText } from 'lucide-react';
import toast                    from 'react-hot-toast';
import { useRouteGuard }        from '@/components/auth/route-guard';
import { Card, SectionHeader }  from '@/components/ui/card';
import { Input }                from '@/components/ui/input';
import { Select }               from '@/components/ui/select';
import { Textarea }             from '@/components/ui/textarea';
import { sessionsService }      from '@/services/sessions.service';
import { beneficiariesService } from '@/services/beneficiaries.service';
import { appointmentsService }  from '@/services/appointments.service';
import { ATTENDANCE_LABELS }    from '@/types';

const schema = z.object({
  beneficiaryId: z.string().uuid('اختر المستفيد'),
  specialistId:  z.string().uuid('اختر الأخصائي'),
  startedAt:     z.string().min(1, 'تاريخ الجلسة مطلوب'),
  attendance:    z.string().optional(),
  moodAssessment: z.string().optional(),
  objectivesMet: z.string().optional(),
  sessionNotes:  z.string().optional(),
  interventionsUsed: z.string().optional(),
  homeworkAssigned: z.string().optional(),
  nextSessionPlan: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const ATTENDANCE_OPTIONS = Object.entries(ATTENDANCE_LABELS).map(([v, l]) => ({ value: v, label: l }));

export default function NewSessionPage() {
  useRouteGuard({ permission: 'session:create', redirectTo: '/dashboard/sessions' });

  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<Array<{ value: string; label: string }>>([]);
  const [specialists, setSpecialists] = useState<Array<{ value: string; label: string }>>([]);

  const { register, handleSubmit, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    beneficiariesService.getAll({ status: 'active', limit: 100 })
      .then((res) => setBeneficiaries(
        res.data.data.map((b: any) => ({
          value: b.id,
          label: `${b.firstName} ${b.lastName} (${b.fileNumber})`,
        })),
      ))
      .catch(() => toast.error('فشل تحميل المستفيدين'));

    appointmentsService.getSpecialists()
      .then((res) => setSpecialists(
        res.data.data.map((s) => ({
          value: s.id,
          label: `${s.firstName} ${s.lastName}`,
        })),
      ))
      .catch(() => toast.error('فشل تحميل الأخصائيين'));
  }, []);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload: any = {
        beneficiaryId: data.beneficiaryId,
        specialistId:  data.specialistId,
        startedAt:     data.startedAt,
      };
      if (data.attendance) payload.attendance = data.attendance;
      if (data.moodAssessment) {
        const mood = Number(data.moodAssessment);
        if (!Number.isNaN(mood)) payload.moodAssessment = mood;
      }
      if (data.objectivesMet) payload.objectivesMet = data.objectivesMet === 'true';
      if (data.sessionNotes?.trim()) payload.sessionNotes = data.sessionNotes.trim();
      if (data.interventionsUsed?.trim()) {
        payload.interventionsUsed = data.interventionsUsed.split(',').map((s) => s.trim()).filter(Boolean);
      }
      if (data.homeworkAssigned?.trim()) payload.homeworkAssigned = data.homeworkAssigned.trim();
      if (data.nextSessionPlan?.trim()) payload.nextSessionPlan = data.nextSessionPlan.trim();

      const res = await sessionsService.create(payload);
      toast.success('تم تسجيل الجلسة');
      router.push(`/dashboard/sessions/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل تسجيل الجلسة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg transition"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <ArrowRight size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>جلسة جديدة</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>تسجيل جلسة علاجية جديدة</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <SectionHeader icon={FileText} title="تفاصيل الجلسة" />
          <div className="space-y-4">
            <Select
              label="المستفيد"
              required
              placeholder="اختر المستفيد"
              options={beneficiaries}
              error={errors.beneficiaryId?.message}
              {...register('beneficiaryId')}
            />
            <Select
              label="الأخصائي"
              required
              placeholder="اختر الأخصائي"
              options={specialists}
              error={errors.specialistId?.message}
              {...register('specialistId')}
            />
            <Input
              label="تاريخ ووقت الجلسة"
              required
              type="datetime-local"
              error={errors.startedAt?.message}
              {...register('startedAt')}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="الحضور"
                placeholder="لم يُحدد"
                options={ATTENDANCE_OPTIONS}
                {...register('attendance')}
              />
              <Input
                label="تقييم المزاج (1-10)"
                type="number"
                min={1}
                max={10}
                placeholder="5"
                error={errors.moodAssessment?.message}
                {...register('moodAssessment')}
              />
            </div>
            <Select
              label="تحقيق الأهداف"
              placeholder="لم يُحدد"
              options={[
                { value: 'true', label: 'نعم' },
                { value: 'false', label: 'لا' },
              ]}
              {...register('objectivesMet')}
            />
          </div>
        </Card>

        <Card>
          <SectionHeader icon={FileText} title="تفاصيل إضافية" iconColor="text-primary" />
          <div className="space-y-4">
            <Textarea
              label="ملاحظات الجلسة"
              rows={4}
              placeholder="سير الجلسة والملاحظات..."
              {...register('sessionNotes')}
            />
            <Textarea
              label="التدخلات المستخدمة"
              rows={2}
              placeholder="افصل بين التدخلات بفاصلة (،)"
              {...register('interventionsUsed')}
            />
            <Textarea
              label="الواجب المنزلي"
              rows={2}
              placeholder="مهام يُطلب من المستفيد تنفيذها..."
              {...register('homeworkAssigned')}
            />
            <Textarea
              label="خطة الجلسة القادمة"
              rows={2}
              placeholder="ما المزمع مناقشته في الجلسة القادمة..."
              {...register('nextSessionPlan')}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3 pb-4">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2.5 text-sm border rounded-lg"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            إلغاء
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition"
            style={{ backgroundColor: 'var(--primary)', opacity: saving ? 0.65 : 1 }}>
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> جاري الحفظ...</>
              : <><Save size={15} /> حفظ الجلسة</>}
          </button>
        </div>
      </form>
    </div>
  );
}

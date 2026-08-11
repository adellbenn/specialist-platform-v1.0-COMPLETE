'use client';

import { useState, useEffect } from 'react';
import { useRouter }            from 'next/navigation';
import { useForm }              from 'react-hook-form';
import { zodResolver }          from '@hookform/resolvers/zod';
import { z }                    from 'zod';
import { ArrowRight, Save, Loader2, FileText, AlignLeft } from 'lucide-react';
import toast                    from 'react-hot-toast';
import { useRouteGuard }        from '@/components/auth/route-guard';
import { Card, SectionHeader }  from '@/components/ui/card';
import { Input }                from '@/components/ui/input';
import { Select }               from '@/components/ui/select';
import { Textarea }             from '@/components/ui/textarea';
import { reportsService }       from '@/services/reports.service';
import { beneficiariesService } from '@/services/beneficiaries.service';
import { ReportType, Beneficiary, REPORT_TYPE_LABELS } from '@/types';

const schema = z.object({
  beneficiaryId: z.string().uuid('اختر المستفيد'),
  type:          z.enum(['initial_assessment','progress','periodic','final','referral'], {
    required_error: 'نوع التقرير مطلوب',
  }),
  title:          z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل'),
  periodFrom:     z.string().optional(),
  periodTo:       z.string().optional(),
  recommendations: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const TYPE_OPTIONS = Object.entries(REPORT_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }));

/** حقول المحتوى الديناميكية حسب نوع التقرير */
const CONTENT_FIELDS: Record<ReportType, Array<{ key: string; label: string; multiline?: boolean }>> = {
  initial_assessment: [
    { key: 'currentStatus',  label: 'الوضع الراهن',         multiline: true },
    { key: 'challenges',     label: 'التحديات الملاحظة',    multiline: true },
    { key: 'familyFeedback', label: 'ملاحظات الأسرة',       multiline: true },
  ],
  progress: [
    { key: 'summary',         label: 'ملخص التقدم',          multiline: true },
    { key: 'achievements',    label: 'الإنجازات',            multiline: true },
    { key: 'challenges',      label: 'التحديات',             multiline: true },
    { key: 'behaviorChanges', label: 'التغيرات السلوكية',    multiline: true },
  ],
  periodic: [
    { key: 'summary',         label: 'ملخص الفترة',          multiline: true },
    { key: 'currentStatus',   label: 'الوضع الحالي',         multiline: true },
    { key: 'achievements',    label: 'الإنجازات',            multiline: true },
    { key: 'challenges',      label: 'التحديات',             multiline: true },
  ],
  final: [
    { key: 'summary',         label: 'الملخص الختامي',       multiline: true },
    { key: 'achievements',    label: 'الإنجازات الكلية',     multiline: true },
    { key: 'behaviorChanges', label: 'التغيرات الملحوظة',    multiline: true },
    { key: 'familyFeedback',  label: 'رأي الأسرة الختامي',   multiline: true },
  ],
  referral: [
    { key: 'referralReason',  label: 'سبب الإحالة',          multiline: true },
    { key: 'referralTo',      label: 'جهة الإحالة',          multiline: false },
    { key: 'currentStatus',   label: 'الوضع الراهن',         multiline: true },
  ],
};

export default function NewReportPage() {
  useRouteGuard({ permission: 'report:create', redirectTo: '/dashboard/reports' });

  const router  = useRouter();
  const [saving, setSaving]   = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<Array<{ value: string; label: string }>>([]);
  const [content, setContent] = useState<Record<string, string>>({});

  const { register, handleSubmit, watch, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedType = watch('type') as ReportType | undefined;

  useEffect(() => {
    beneficiariesService.getAll({ status: 'active', limit: 100 })
      .then((res) => setBeneficiaries(
        res.data.data.map((b: Beneficiary) => ({
          value: b.id,
          label: `${b.firstName} ${b.lastName} (${b.fileNumber})`,
        })),
      ))
      .catch(() => toast.error('فشل تحميل المستفيدين'));
  }, []);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const res = await reportsService.create({
        ...data,
        content,
      });
      toast.success('تم إنشاء التقرير كمسودة');
      router.push(`/dashboard/reports/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل إنشاء التقرير');
    } finally {
      setSaving(false);
    }
  };

  const contentFields = selectedType ? CONTENT_FIELDS[selectedType] : [];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg transition"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <ArrowRight size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>تقرير جديد</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>سيُحفظ كمسودة حتى تقديمه للمراجعة</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* معلومات أساسية */}
        <Card>
          <SectionHeader icon={FileText} title="معلومات التقرير" />
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
              label="نوع التقرير"
              required
              placeholder="اختر النوع"
              options={TYPE_OPTIONS}
              error={errors.type?.message}
              {...register('type')}
            />
            <Input
              label="عنوان التقرير"
              required
              placeholder="مثال: تقرير تقدم — أحمد الغامدي — يونيو 2026"
              error={errors.title?.message}
              {...register('title')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="من تاريخ" type="date" {...register('periodFrom')} />
              <Input label="إلى تاريخ" type="date" {...register('periodTo')} />
            </div>
          </div>
        </Card>

        {/* محتوى التقرير (ديناميكي حسب النوع) */}
        {contentFields.length > 0 && (
          <Card>
            <SectionHeader icon={AlignLeft} title="محتوى التقرير" iconColor="text-primary" />
            <div className="space-y-4">
              {contentFields.map((field) => (
                field.multiline ? (
                  <Textarea
                    key={field.key}
                    label={field.label}
                    rows={4}
                    value={content[field.key] ?? ''}
                    onChange={(e) => setContent((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={`اكتب ${field.label}...`}
                  />
                ) : (
                  <Input
                    key={field.key}
                    label={field.label}
                    value={content[field.key] ?? ''}
                    onChange={(e) => setContent((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.label}
                  />
                )
              ))}
            </div>
          </Card>
        )}

        {/* التوصيات */}
        <Card>
            <SectionHeader icon={AlignLeft} title="التوصيات" iconColor="text-primary" />
          <Textarea
            placeholder="التوصيات والخطوات المقترحة..."
            rows={4}
            {...register('recommendations')}
          />
        </Card>

        {/* Actions */}
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
              : <><Save size={15} /> حفظ كمسودة</>}
          </button>
        </div>
      </form>
    </div>
  );
}

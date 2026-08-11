'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight, Edit, CheckCircle, Send, Archive,
  Share2, FileText, User, Calendar, Paperclip, AlignLeft,
} from 'lucide-react';
import toast                    from 'react-hot-toast';
import { reportsService }       from '@/services/reports.service';
import { FilesList }            from '@/components/reports/files-list';
import { Card, SectionHeader, DetailRow } from '@/components/ui/card';
import { Badge }                from '@/components/ui/badge';
import { PageLoader }           from '@/components/ui/spinner';
import { PermissionGate }       from '@/components/auth/permission-gate';
import { usePermissions }       from '@/hooks/use-permissions';
import {
  Report,
  REPORT_TYPE_LABELS, REPORT_STATUS_LABELS, REPORT_STATUS_COLORS,
} from '@/types';
import { formatDate, formatDateTime, cn } from '@/lib/utils';

const TABS = [
  { id: 'content',     label: 'محتوى التقرير', icon: AlignLeft },
  { id: 'attachments', label: 'المرفقات',       icon: Paperclip },
] as const;
type TabId = typeof TABS[number]['id'];

/** عرض محتوى التقرير بشكل منظم */
const CONTENT_LABELS: Record<string, string> = {
  summary:         'الملخص',
  currentStatus:   'الوضع الراهن',
  achievements:    'الإنجازات',
  challenges:      'التحديات',
  behaviorChanges: 'التغيرات السلوكية',
  familyFeedback:  'ملاحظات الأسرة',
  referralReason:  'سبب الإحالة',
  referralTo:      'جهة الإحالة',
  goalsProgress:   'تقدم الأهداف',
  interventions:   'التدخلات المستخدمة',
};

export default function ReportDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const { can, user } = usePermissions();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('content');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsService.getOne(id);
      setReport(res.data.data);
    } catch {
      toast.error('فشل تحميل التقرير');
      router.push('/dashboard/reports');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleSubmit = async () => {
    if (!confirm('هل تريد تقديم التقرير للمراجعة؟')) return;
    setActing(true);
    try {
      const res = await reportsService.submit(id);
      setReport(res.data.data);
      toast.success('تم تقديم التقرير للمراجعة');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل التقديم');
    } finally {
      setActing(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('هل تريد الموافقة على هذا التقرير؟')) return;
    setActing(true);
    try {
      const res = await reportsService.approve(id);
      setReport(res.data.data);
      toast.success('تمت الموافقة على التقرير');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل الموافقة');
    } finally {
      setActing(false);
    }
  };

  const handleToggleShare = async () => {
    setActing(true);
    try {
      const res = await reportsService.toggleShare(id);
      setReport(res.data.data);
      toast.success(res.data.message);
    } catch {
      toast.error('فشل تعديل المشاركة');
    } finally {
      setActing(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('هل تريد أرشفة هذا التقرير؟')) return;
    setActing(true);
    try {
      await reportsService.archive(id);
      toast.success('تم أرشفة التقرير');
      router.push('/dashboard/reports');
    } catch {
      toast.error('فشل الأرشفة');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!report)  return null;

  const r = report;
  const isDraft     = r.status === 'draft';
  const isSubmitted = r.status === 'submitted';
  const isApproved  = r.status === 'approved';
  const isOwner     = user?.id === r.specialistId;

  // فلترة محتوى التقرير للعرض
  const contentEntries = Object.entries(r.content ?? {}).filter(
    ([k, v]) => v && typeof v === 'string' && v.trim() !== '',
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
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
              <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{r.title}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge label={REPORT_STATUS_LABELS[r.status]} className={REPORT_STATUS_COLORS[r.status]} dot />
                <Badge label={REPORT_TYPE_LABELS[r.type]} style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }} />
                {r.sharedWithBeneficiary && (
                  <Badge label="مشارك مع المستفيد" className="bg-primary-light text-primary" />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* تعديل — أخصائي في مرحلة مسودة */}
              {isDraft && isOwner && can('report:update') && (
                <button
                  onClick={() => router.push(`/dashboard/reports/${id}/edit`)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Edit size={14} /> تعديل
                </button>
              )}

              {/* تقديم للمراجعة */}
              {isDraft && isOwner && can('report:update') && (
                <button
                  onClick={handleSubmit}
                  disabled={acting}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-60 transition"
                >
                  <Send size={14} /> تقديم للمراجعة
                </button>
              )}

              {/* موافقة */}
              {isSubmitted && can('report:approve') && (
                <button
                  onClick={handleApprove}
                  disabled={acting}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-60 transition"
                >
                  <CheckCircle size={14} /> موافقة
                </button>
              )}

              {/* مشاركة مع المستفيد */}
              {isApproved && can('report:update') && (
                <button
                  onClick={handleToggleShare}
                  disabled={acting}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition disabled:opacity-60',
                    r.sharedWithBeneficiary && 'bg-primary-light text-primary hover:bg-primary-light',
                  )}
                  style={!r.sharedWithBeneficiary ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : undefined}
                  onMouseEnter={(e) => { if (!r.sharedWithBeneficiary) e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'; }}
                  onMouseLeave={(e) => { if (!r.sharedWithBeneficiary) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Share2 size={14} />
                  {r.sharedWithBeneficiary ? 'إلغاء المشاركة' : 'مشاركة مع المستفيد'}
                </button>
              )}

              {/* أرشفة */}
              {isApproved && can('report:update') && (
                <button
                  onClick={handleArchive}
                  disabled={acting}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border text-danger rounded-lg hover:bg-danger-light disabled:opacity-60 transition"
                  style={{ borderColor: 'var(--danger)' }}
                >
                  <Archive size={14} /> أرشفة
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <SectionHeader icon={User} title="المشاركون" />
          <div className="space-y-0.5">
            {r.beneficiary && (
              <DetailRow
                label="المستفيد"
                value={`${r.beneficiary.firstName} ${r.beneficiary.lastName} (${r.beneficiary.fileNumber})`}
              />
            )}
            {r.specialist && (
              <DetailRow
                label="الأخصائي"
                value={`${r.specialist.firstName} ${r.specialist.lastName}`}
              />
            )}
            {r.approvedBy && (
              <DetailRow
                label="تمت الموافقة بواسطة"
                value={`${r.approvedBy.firstName} ${r.approvedBy.lastName}`}
              />
            )}
          </div>
        </Card>

        <Card>
          <SectionHeader icon={Calendar} title="التواريخ" />
          <div className="space-y-0.5">
            <DetailRow label="تاريخ الإنشاء" value={formatDateTime(r.createdAt)} />
            {r.periodFrom && <DetailRow label="بداية الفترة" value={formatDate(r.periodFrom)} />}
            {r.periodTo   && <DetailRow label="نهاية الفترة" value={formatDate(r.periodTo)} />}
            {r.approvedAt && <DetailRow label="تاريخ الموافقة" value={formatDateTime(r.approvedAt)} />}
          </div>
        </Card>

        {r.recommendations && (
          <Card>
            <SectionHeader icon={AlignLeft} title="التوصيات" iconColor="text-primary" />
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
              {r.recommendations}
            </p>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-1">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button key={tabId} onClick={() => setActiveTab(tabId)}
              className={'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition'}
              style={{
                borderColor: activeTab === tabId ? 'var(--primary)' : 'transparent',
                color: activeTab === tabId ? 'var(--primary)' : 'var(--text-secondary)',
              }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* محتوى التقرير */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {contentEntries.length === 0 ? (
            <Card>
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <AlignLeft size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">لم يُضف محتوى للتقرير بعد</p>
                {isDraft && isOwner && (
                  <button
                    onClick={() => router.push(`/dashboard/reports/${id}/edit`)}
                    className="mt-3 text-sm hover:underline"
                    style={{ color: 'var(--primary)' }}
                  >
                    إضافة المحتوى
                  </button>
                )}
              </div>
            </Card>
          ) : (
            contentEntries.map(([key, value]) => (
              <Card key={key}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {CONTENT_LABELS[key] ?? key}
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                  {value as string}
                </p>
              </Card>
            ))
          )}
        </div>
      )}

      {/* المرفقات */}
      {activeTab === 'attachments' && (
        <Card>
          <SectionHeader icon={Paperclip} title="الملفات المرفقة" />
          <FilesList entityType="report" entityId={id} />
        </Card>
      )}
    </div>
  );
}

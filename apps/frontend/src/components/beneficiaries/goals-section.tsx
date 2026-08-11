'use client';

import { useState } from 'react';
import { Target, Plus, Check, Clock, X, ChevronDown, Save, Loader2 } from 'lucide-react';
import { GoalItem, GOAL_STATUS_LABELS } from '@/types';
import { Card, SectionHeader } from '@/components/ui/card';
import { PermissionGate } from '@/components/auth/permission-gate';
import { beneficiariesService } from '@/services/beneficiaries.service';
import { formatDate, toDateKey } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface GoalsSectionProps {
  beneficiaryId: string;
  goals: GoalItem[];
  onUpdate: () => void;
}

const STATUS_STYLES: Record<GoalItem['status'], string> = {
  pending:     'bg-warning-light text-warning-text',
  in_progress: 'bg-info-light text-info-text',
  achieved:    'bg-success-light text-success-text',
  cancelled:   'bg-surface-secondary text-text-muted',
};

const STATUS_ICONS: Record<GoalItem['status'], React.ElementType> = {
  pending:     Clock,
  in_progress: ChevronDown,
  achieved:    Check,
  cancelled:   X,
};

const NEW_GOAL_TEMPLATE: Omit<GoalItem, 'id'> = {
  description: '',
  targetDate: toDateKey(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  status: 'pending',
  notes: '',
};

export function GoalsSection({ beneficiaryId, goals: initialGoals, onUpdate }: GoalsSectionProps) {
  const [goals, setGoals]     = useState<GoalItem[]>(initialGoals);
  const [adding, setAdding]   = useState(false);
  const [saving, setSaving]   = useState(false);
  const [newGoal, setNewGoal] = useState({ ...NEW_GOAL_TEMPLATE });

  const handleAddGoal = async () => {
    if (!newGoal.description.trim()) {
      toast.error('وصف الهدف مطلوب');
      return;
    }
    setSaving(true);
    try {
      const updatedGoals = [...goals, { ...newGoal, id: crypto.randomUUID() }];
      await beneficiariesService.updateFile(beneficiaryId, { goals: updatedGoals });
      setGoals(updatedGoals);
      setNewGoal({ ...NEW_GOAL_TEMPLATE });
      setAdding(false);
      toast.success('تم إضافة الهدف');
      onUpdate();
    } catch {
      toast.error('فشل إضافة الهدف');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (goalId: string, status: GoalItem['status']) => {
    const updated = goals.map((g) => g.id === goalId ? { ...g, status } : g);
    setSaving(true);
    try {
      await beneficiariesService.updateFile(beneficiaryId, { goals: updated });
      setGoals(updated);
      toast.success('تم تحديث حالة الهدف');
    } catch {
      toast.error('فشل التحديث');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('هل تريد حذف هذا الهدف؟')) return;
    const updated = goals.filter((g) => g.id !== goalId);
    setSaving(true);
    try {
      await beneficiariesService.updateFile(beneficiaryId, { goals: updated });
      setGoals(updated);
      toast.success('تم حذف الهدف');
    } catch {
      toast.error('فشل الحذف');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <SectionHeader
        icon={Target}
        title="الأهداف العلاجية"
        subtitle={`${goals.length} هدف مسجّل`}
        action={
          <PermissionGate permission="file:update">
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg transition"
              style={{ backgroundColor: 'var(--success)' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Plus size={13} /> هدف جديد
            </button>
          </PermissionGate>
        }
      />

      {adding && (
        <div className="rounded-xl p-4 mb-4 space-y-3 border" style={{ backgroundColor: 'var(--success-light)', borderColor: 'var(--success)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--success-text)' }}>إضافة هدف جديد</p>
          <textarea
            value={newGoal.description}
            onChange={(e) => setNewGoal((p) => ({ ...p, description: e.target.value }))}
            placeholder="وصف الهدف..."
            rows={2}
            className="w-full px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 transition"
            style={{ backgroundColor: 'var(--background)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>تاريخ الاستهداف</label>
              <input
                type="date"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal((p) => ({ ...p, targetDate: e.target.value }))}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition"
                style={{ backgroundColor: 'var(--background)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>الحالة</label>
              <select
                value={newGoal.status}
                onChange={(e) => setNewGoal((p) => ({ ...p, status: e.target.value as GoalItem['status'] }))}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition"
                style={{ backgroundColor: 'var(--background)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              >
                {Object.entries(GOAL_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            value={newGoal.notes}
            onChange={(e) => setNewGoal((p) => ({ ...p, notes: e.target.value }))}
            placeholder="ملاحظات (اختياري)..."
            rows={2}
            className="w-full px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 transition"
            style={{ backgroundColor: 'var(--background)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)}
              className="px-4 py-1.5 text-sm border rounded-lg transition"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              إلغاء
            </button>
            <button onClick={handleAddGoal} disabled={saving}
              className="flex items-center gap-2 px-4 py-1.5 text-sm text-white rounded-lg disabled:opacity-60 transition"
              style={{ backgroundColor: 'var(--success)' }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              حفظ
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 && !adding ? (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          <Target size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">لم تُسجَّل أي أهداف بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const StatusIcon = STATUS_ICONS[goal.status];
            return (
              <div
                key={goal.id}
                className="border rounded-xl p-3.5 transition"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{goal.description}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      الاستهداف: {formatDate(goal.targetDate)}
                    </p>
                    {goal.notes && (
                      <p className="text-xs mt-1 px-2 py-1 rounded" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface)' }}>
                        {goal.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PermissionGate
                      permission="file:update"
                      fallback={
                        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', STATUS_STYLES[goal.status])}>
                          <StatusIcon size={11} />
                          {GOAL_STATUS_LABELS[goal.status]}
                        </span>
                      }
                    >
                      <select
                        value={goal.status}
                        onChange={(e) => handleStatusChange(goal.id, e.target.value as GoalItem['status'])}
                        disabled={saving}
                        className={cn('text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary', STATUS_STYLES[goal.status])}
                      >
                        {Object.entries(GOAL_STATUS_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </PermissionGate>

                    <PermissionGate permission="file:update">
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1.5 rounded-lg transition"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--danger-light)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <X size={13} />
                      </button>
                    </PermissionGate>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

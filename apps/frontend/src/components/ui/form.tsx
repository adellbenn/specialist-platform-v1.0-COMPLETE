'use client';

import { forwardRef, useId, useMemo, type FormHTMLAttributes, type ReactNode } from 'react';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
  UseFormReturn,
} from 'react-hook-form';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface FormProps<TFieldValues extends FieldValues>
  extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  /** نتيجة useForm() من رياكت-هوك-فورم */
  form: UseFormReturn<TFieldValues>;
  /** معالج الإرسال (onSubmit من RHF) */
  onSubmit: (values: TFieldValues) => void | Promise<void>;
  /** صفوف داخل النموذج كهيكل */
  rows?: ReactNode;
  /** زر الإرسال (افتراضي: «حفظ») */
  submitLabel?: string;
  /** نص زر الفراغ/الإلغاء */
  cancelLabel?: string;
  /** عند النقر على الإلغاء */
  onCancel?: () => void;
  /** إخفاء أزرار (حفظ/إلغاء) رأس النموذج — عند ما تريد تحكماً أصيلاً داخل الصفحة */
  hideActions?: boolean;
  /** تعطيل كامل للنموذج (يعطّل الحقول والأزرار) — أثناء التحرير المحظور مثلًا */
  disabled?: boolean;
  /** صفّ الأزرار يُرتَّب من جهة النهاية (RTL: يسار) */
  actionsStart?: boolean;
  /** حالة التقديم (يعطّل الأزرار ويعرض مؤشر) */
  submitting?: boolean;
  /** عرض الأزرار على جانبي النموذج أعلى/أسفل */
  footer?: ReactNode;
  /** تجميع أزرار في الجزء السفلي */
  className?: string;
}

export function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit = async () => {},
  children,
  className,
  ...props
}: FormProps<TFieldValues>) {
  const titleId = useId();
  const label = 'عنوان النموذج';
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className={cn('space-y-5', className)}
      {...props}
    >
      <fieldset disabled={props.disabled || props.submitting}>
        <legend className="sr-only">{label}</legend>
        {props.rows}
        {children}
        {!props.hideActions && (
          <div
            className={cn(
              'flex flex-wrap items-center gap-3 pt-1',
              props.actionsStart ? 'justify-start' : 'justify-end',
            )}
          >
            {props.onCancel && (
              <Button type="button" variant="outline" onClick={props.onCancel} disabled={props.submitting}>
                {props.cancelLabel ?? 'إلغاء'}
              </Button>
            )}
            <Button
              type="submit"
              loading={props.submitting}
              disabled={props.disabled}
            >
              {props.submitLabel ?? 'حفظ'}
            </Button>
          </div>
        )}
        {props.footer}
      </fieldset>
    </form>
  );
}

export interface FormFieldProps<TFieldValues extends FieldValues, TContext = unknown> {
  control: Control<TFieldValues, TContext>;
  name: Path<TFieldValues>;
  label?: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  /** دالة render تستقبل الفاد وحالة الخطأ وتعيد الحقل نفسه */
  render: (field: {
    value: any;
    onChange: (...event: any[]) => void;
    onBlur: () => void;
    name: Path<TFieldValues>;
    ref: (el: HTMLElement | null) => void;
    error?: string;
    describedBy?: string;
  }) => ReactNode;
  type?: string;
}

export function FormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  render,
  ...props
}: FormFieldProps<TFieldValues>) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const error = fieldState.error?.message;
        const describedBy =
          [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
        return (
          <div className="space-y-1.5">
            {label && (
              <label htmlFor={id} className="block text-small font-medium text-text-token-primary">
                {label}
                {required && <span className="text-text-token-danger mr-0.5" aria-hidden="true">*</span>}
              </label>
            )}
            {render({
              ...field,
              onChange: (e) => field.onChange(e?.target?.value ?? e),
              error,
              describedBy,
            })}
            {error ? (
              <p className="text-xs text-text-token-danger" id={errorId} role="alert">
                {error}
              </p>
            ) : hint ? (
              <p className="text-xs text-text-token-muted" id={hintId}>
                {hint}
              </p>
            ) : null}
          </div>
        );
      }}
    />
  );
}

interface FormErrorSummaryProps {
  title?: string;
  errors: string[];
  className?: string;
}

export function FormErrorSummary({ title = 'يوجد خطأ في إرسال النموذج', errors, className }: FormErrorSummaryProps) {
  if (!errors.length) return null;
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-status-error-border bg-status-error-light px-4 py-3 text-small text-status-error-text',
        className,
      )}
    >
      <p className="font-semibold mb-1">{title}</p>
      <ul className="list-disc list-inside space-y-0.5">
        {errors.map((err, i) => (
          <li key={i}>{err}</li>
        ))}
      </ul>
    </div>
  );
}

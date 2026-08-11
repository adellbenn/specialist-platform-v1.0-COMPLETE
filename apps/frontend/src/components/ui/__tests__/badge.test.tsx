import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('يعرض النص المُمرر', () => {
    render(<Badge label="نشط" />);
    expect(screen.getByText('نشط')).toBeInTheDocument();
  });

  it('يعرض نقطة عند تمرير dot', () => {
    render(<Badge label="نشط" dot />);
    const dot = document.querySelector('.rounded-full');
    expect(dot).toBeInTheDocument();
  });

  it('لا يعرض نقطة بدون dot', () => {
    render(<Badge label="نشط" />);
    expect(document.querySelector('.rounded-full')).not.toBeInTheDocument();
  });

  it('يطبّق className إضافي', () => {
    render(<Badge label="نشط" className="custom-class" />);
    expect(screen.getByText('نشط').className).toContain('custom-class');
  });
});

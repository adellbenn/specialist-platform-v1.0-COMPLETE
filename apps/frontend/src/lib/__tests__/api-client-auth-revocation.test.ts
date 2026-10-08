import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

/**
 * إبطال سلطة الصلاحيات عند فشل المصادقة.
 *
 * المشكلة: عند انتهاء الجلسة تفشل `/auth/refresh`، فيوجّه الكود المستخدم إلى
 * `/auth/login`. لكن الصلاحيات كانت تعيش في الذاكرة خارج مزامنة الـ redirect،
 * فتبقى صالحة لمدى عمر التبويب.
 */

const interceptors: { response: Array<(r: any) => Promise<any>> } = { response: [] };

vi.mock('axios', () => {
  /* نسخة axios القابلة للاستدعاء، كما في axios الحقيقي */
  const instance = Object.assign(vi.fn(() => Promise.resolve({ data: {} })), {
    interceptors: {
      request: { use: vi.fn() },
      response: {
        use: (_ok: unknown, fail: (e: any) => Promise<any>) => {
          interceptors.response.push(fail);
        },
      },
    },
    defaults: { headers: { common: {} } },
  });
  return {
    default: {
      create: vi.fn(() => instance),
      post: vi.fn(),
    },
  };
});

vi.mock('js-cookie', () => ({
  default: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
}));

import axios from 'axios';
import Cookies from 'js-cookie';
import { registerAuthFailureHandler } from '@/lib/api-client';

const mockedCookies = Cookies as unknown as {
  get: Mock<[string], string | undefined>;
  set: Mock;
  remove: Mock;
};
const getCookie = (v: string | undefined) => mockedCookies.get.mockReturnValue(v);
const mockedAxiosPost = vi.mocked(axios.post);
const rejectWith = (status: number): any => ({
  response: { status },
  config: { headers: {} },
});

let href: string;
beforeEach(() => {
  interceptors.response.length = 0;
  vi.resetModules();
  mockedCookies.get.mockReset();
  mockedCookies.remove.mockReset();
  mockedAxiosPost.mockReset();
  href = '/dashboard';
  Object.defineProperty(window, 'location', {
    value: { get href() { return href; }, set href(v: string) { href = v; } },
    writable: true, configurable: true,
  });
});
afterEach(() => { vi.restoreAllMocks(); });

/** يعيد تحميل الوحدة ليُسجَّل المعالج وتُلتقط المعترضات. */
async function loadWithHandler() {
  const onAuthFailure = vi.fn();
  vi.resetModules();
  await import('@/lib/api-client');
  const mod = await import('@/lib/api-client');
  mod.registerAuthFailureHandler(onAuthFailure);
  const interceptor = interceptors.response[interceptors.response.length - 1];
  return { onAuthFailure, interceptor };
}

describe('api-client: إبطال السلطة عند فشل المصادقة', () => {
  it('فشل 401 بلا refresh token يبطل السلطة قبل إعادة التوجيه', async () => {
    const { onAuthFailure, interceptor } = await loadWithHandler();
    getCookie(undefined);

    await expect(interceptor(rejectWith(401))).rejects.toBeDefined();

    expect(onAuthFailure).toHaveBeenCalledTimes(1);
    expect(href).toBe('/auth/login');
    expect(mockedCookies.remove).toHaveBeenCalledWith('accessToken', { path: '/' });
  });

  it('فشل /auth/refresh يبطل السلطة قبل إعادة التوجيه', async () => {
    const { onAuthFailure, interceptor } = await loadWithHandler();
    getCookie('refresh-token');
    mockedAxiosPost.mockRejectedValue(new Error('refresh failed'));

    await expect(interceptor(rejectWith(401))).rejects.toBeDefined();

    expect(onAuthFailure).toHaveBeenCalledTimes(1);
    expect(href).toBe('/auth/login');
  });

  it('تجديد ناجح لا يبطل السلطة', async () => {
    const { onAuthFailure, interceptor } = await loadWithHandler();
    getCookie('refresh-token');
    mockedAxiosPost.mockResolvedValue({ data: { data: { accessToken: 'new' } } } as never);

    await interceptor(rejectWith(401));

    expect(onAuthFailure).not.toHaveBeenCalled();
    expect(href).toBe('/dashboard');
  });

  it('401 أثناء الطلب المُعاد لا يعيد محاولة التجديد', async () => {
    const { onAuthFailure, interceptor } = await loadWithHandler();
    getCookie('refresh-token');
    mockedAxiosPost.mockResolvedValue({ data: { data: { accessToken: 'new' } } } as never);

    const err = { response: { status: 401 }, config: { headers: {}, _retry: true } };
    await expect(interceptor(err)).rejects.toBeDefined();

    expect(mockedAxiosPost).not.toHaveBeenCalled();
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it('خطأ غير 401 لا يبطل السلطة', async () => {
    const { onAuthFailure, interceptor } = await loadWithHandler();
    await expect(interceptor(rejectWith(500))).rejects.toBeDefined();

    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it('ترتيب مهم: الإبطال يسبق تنظيف الكوكيز', async () => {
    const { onAuthFailure, interceptor } = await loadWithHandler();
    getCookie(undefined);
    const order: string[] = [];
    onAuthFailure.mockImplementation(() => { order.push('revoke'); });
    mockedCookies.remove.mockImplementation(() => { order.push('remove'); });

    await Promise.resolve(interceptor(rejectWith(401))).catch(() => {});

    expect(order.indexOf('revoke')).toBeLessThan(order.indexOf('remove'));
  });
});

/* وجود مُسجِّل واحد يكفي: المتجر يسجّل نفسه مرة عند التحميل. */
describe('registerAuthFailureHandler', () => {
  it('يسمح بتسجيل معالج ويحلّ محل السابق', async () => {
    await loadWithHandler();
    const mod = await import('@/lib/api-client');
    const first = vi.fn();
    const second = vi.fn();
    mod.registerAuthFailureHandler(first);
    mod.registerAuthFailureHandler(second);

    const interceptor = interceptors.response[interceptors.response.length - 1];
    getCookie(undefined);
    await interceptor(rejectWith(401)).catch(() => {});

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

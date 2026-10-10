import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// إضافة Access Token لكل طلب
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* ─── إبطال السلطة عند فشل المصادقة ───
   لا يستورد هذا الملف المتجر (تفادي دورة استيراد)، بل يستقبل مُسجِّلًا
   يسجّله `permissions.store` عند التحميل. أي فشل في تجديد التوكن يُبطل
   صلاحية الوصول قبل إعادة التوجيه، فلا تبقى صلاحية صالحة بعد logout. */
type AuthFailureHandler = () => void;
let authFailureHandler: AuthFailureHandler | null = null;

export function registerAuthFailureHandler(handler: AuthFailureHandler): void {
  authFailureHandler = handler;
}

function revokePermissionAuthority(): void {
  try {
    authFailureHandler?.();
  } catch {
    /* لا نُفشل مسار إعادة التوجيه بسبب الإبطال */
  }
}

/* ─── كشف إلزام تغيير كلمة المرور ───
   يستجيب الخادم بـ 403 وبالرمز `MUST_CHANGE_PASSWORD` عندما يتعيّن على المستخدم
   تغيير كلمة مروره قبل استخدام بقية المنصة. نكتشفه من `code` أو من `message`
   (نصًّا أو مصفوفة) ثم نضبط علم المتجر ونعيد التوجيه إلى صفحة التغيير. */
const MUST_CHANGE_PASSWORD = 'MUST_CHANGE_PASSWORD';

function isMustChangePasswordError(error: AxiosError): boolean {
  const data = error.response?.data as { code?: unknown; message?: unknown } | undefined;
  if (!data || typeof data !== 'object') return false;
  if (data.code === MUST_CHANGE_PASSWORD) return true;
  const { message } = data;
  if (typeof message === 'string') return message === MUST_CHANGE_PASSWORD;
  if (Array.isArray(message)) return message.includes(MUST_CHANGE_PASSWORD);
  return false;
}

let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

// تجديد التوكن تلقائياً عند انتهاء الصلاحية
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get('refreshToken');

      if (!refreshToken) {
        processQueue(new Error('No refresh token'), null);
        revokePermissionAuthority();
        Cookies.remove('accessToken', { path: '/' });
        Cookies.remove('refreshToken', { path: '/' });
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const newAccessToken = data.data.accessToken;
        const rotatedRefreshToken = data.data.refreshToken;

        const secure = process.env.NODE_ENV === 'production';
        Cookies.set('accessToken', newAccessToken, { expires: 1, sameSite: 'lax', secure, path: '/' });
        if (rotatedRefreshToken) {
          Cookies.set('refreshToken', rotatedRefreshToken, {
            expires: 7,
            sameSite: 'lax',
            secure,
            path: '/',
          });
        }
        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        revokePermissionAuthority();
        Cookies.remove('accessToken', { path: '/' });
        Cookies.remove('refreshToken', { path: '/' });
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403 && isMustChangePasswordError(error)) {
      try {
        const { useAuthStore } = await import('@/store/auth.store');
        useAuthStore.setState({ mustChangePassword: true });
      } catch {
        /* لا نُفشل إعادة التوجيه بسبب تعذّر ضبط العلم */
      }
      if (window.location.pathname !== '/auth/change-password') {
        window.location.href = '/auth/change-password';
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default apiClient;

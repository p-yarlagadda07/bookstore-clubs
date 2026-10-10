import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let csrf;

async function getCsrfToken() {
  if (!csrf) {
    const res = await axios.get('/api/auth/csrf', {
      withCredentials: true,
    });

    csrf = res.data.data.token;
  }

  return csrf;
}

api.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase();

  if (method && method !== 'get') {
    const token = await getCsrfToken();

    config.headers = config.headers ?? {};
    config.headers['x-csrf-token'] = token;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res.data.data,
  async (err) => {
    const config = err.config;
    const errorCode = err.response?.data?.error?.code;

    if (
      config &&
      config.method?.toLowerCase() !== 'get' &&
      errorCode === 'CSRF_INVALID' &&
      !config._retried
    ) {
      config._retried = true;
      csrf = undefined;

      const token = await getCsrfToken();

      config.headers = config.headers ?? {};
      config.headers['x-csrf-token'] = token;

      return api(config);
    }

    return Promise.reject(
      err.response?.data?.error ?? {
        code: 'NETWORK',
        message: 'Network error',
      },
    );
  },
);

export function clearCsrfToken() {
  csrf = undefined;
}

export default api;

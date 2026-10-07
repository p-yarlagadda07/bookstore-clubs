import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

let csrf;

api.interceptors.request.use(async (config) => {
  if (config.method !== 'get') {
    if (!csrf) {
      const res = await axios.get('/api/auth/csrf', {
        withCredentials: true,
      });
      csrf = res.data.data.token;
    }

    config.headers['x-csrf-token'] = csrf;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res.data.data,
  (err) =>
    Promise.reject(
      err.response?.data?.error ?? {
        code: 'NETWORK',
        message: 'Network error',
      }
    )
);

export default api;
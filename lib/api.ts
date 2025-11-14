// lib/api.ts
import axios from "axios";

/**
 * Web-friendly replacement for AsyncStorage used in React Native.
 * This keeps the same async API (getItem, setItem, removeItem, multiRemove)
 * but delegates to localStorage in the browser. On server (SSR) these
 * functions behave as no-ops or return null so builds won't fail.
 */
const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const WebStorage = {
  getItem: (key: string): Promise<string | null> => {
    if (!isBrowser) return Promise.resolve(null);
    try {
      return Promise.resolve(window.localStorage.getItem(key));
    } catch (e) {
      console.warn("WebStorage.getItem error", e);
      return Promise.resolve(null);
    }
  },

  setItem: (key: string, value: string): Promise<void> => {
    if (!isBrowser) return Promise.resolve();
    try {
      window.localStorage.setItem(key, value);
      return Promise.resolve();
    } catch (e) {
      console.warn("WebStorage.setItem error", e);
      return Promise.resolve();
    }
  },

  removeItem: (key: string): Promise<void> => {
    if (!isBrowser) return Promise.resolve();
    try {
      window.localStorage.removeItem(key);
      return Promise.resolve();
    } catch (e) {
      console.warn("WebStorage.removeItem error", e);
      return Promise.resolve();
    }
  },

  // Accepts an array of keys to remove
  multiRemove: (keys: string[]): Promise<void> => {
    if (!isBrowser) return Promise.resolve();
    try {
      keys.forEach((k) => window.localStorage.removeItem(k));
      return Promise.resolve();
    } catch (e) {
      console.warn("WebStorage.multiRemove error", e);
      return Promise.resolve();
    }
  },
};

const AsyncStorage = WebStorage; // keep the same name used throughout the file

/**
 * Keys used in storage
 */
const TOKEN_KEY = "token";
const REFRESH_KEY = "refreshToken";
const ROLE_KEY = "role";
const USERID_KEY = "userId";
const TEACHERID_KEY = "teacherId";
const STUDENTID_KEY = "studentId";

const api = axios.create({
  baseURL: "https://attendance-app-o83z.onrender.com/",
  timeout: 15000,
});

let interceptorAttached = false;

export const attachInterceptor = () => {
  if (interceptorAttached) return;
  interceptorAttached = true;

  let isRefreshing = false;
  let pendingRequests: Array<(token?: string) => void> = [];

  // Request interceptor: attach token from storage
  api.interceptors.request.use(
    (config: any) => {
      return AsyncStorage.getItem(TOKEN_KEY).then((token) => {
        if (token) {
          config.headers = config.headers ?? {};
          (config.headers as any).Authorization = `Bearer ${token}`;
        }
        return config;
      });
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: handle 401 and refresh flow
  api.interceptors.response.use(
    (res) => res,
    (error: any) => {
      const originalRequest = error.config;

      // If not a 401, reject
      if (!error.response || error.response.status !== 401) {
        return Promise.reject(error);
      }

      // Avoid retry loop
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      // If a refresh is already ongoing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push(async (newToken?: string) => {
            try {
              if (newToken) {
                originalRequest.headers = originalRequest.headers ?? {};
                (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;
              }
              const res = await api(originalRequest);
              resolve(res);
            } catch (err) {
              reject(err);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return AsyncStorage.getItem(REFRESH_KEY)
        .then((refreshToken) => {
          if (!refreshToken) {
            // No refresh token -> clear storage and reject
            return AsyncStorage.multiRemove([
              TOKEN_KEY,
              REFRESH_KEY,
              ROLE_KEY,
              USERID_KEY,
              TEACHERID_KEY,
              STUDENTID_KEY,
            ]).then(() => Promise.reject(error));
          }

          // Use plain axios to call refresh endpoint to avoid interceptor recursion
          return axios
            .post(
              `${api.defaults.baseURL}auth/refresh`,
              { refreshToken },
              { timeout: 15000 }
            )
            .then(async (response) => {
              const data = (response.data ?? {}) as {
                access_token?: string;
                refresh_token?: string;
              };
              const access_token = data.access_token;
              const refresh_token = data.refresh_token;

              if (!access_token) {
                await AsyncStorage.multiRemove([
                  TOKEN_KEY,
                  REFRESH_KEY,
                  ROLE_KEY,
                  USERID_KEY,
                  TEACHERID_KEY,
                  STUDENTID_KEY,
                ]);
                return Promise.reject(error);
              }

              // Save new tokens
              await AsyncStorage.setItem(TOKEN_KEY, access_token);
              if (refresh_token) {
                await AsyncStorage.setItem(REFRESH_KEY, refresh_token);
              }

              // update default header
              api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

              // retry original request with new token
              originalRequest.headers = originalRequest.headers ?? {};
              (originalRequest.headers as any).Authorization = `Bearer ${access_token}`;

              // resolve pending requests
              pendingRequests.forEach((cb) => cb(access_token));
              pendingRequests = [];

              return api(originalRequest);
            });
        })
        .catch(async (refreshErr) => {
          // cleanup on failure
          try {
            await AsyncStorage.multiRemove([
              TOKEN_KEY,
              REFRESH_KEY,
              ROLE_KEY,
              USERID_KEY,
              TEACHERID_KEY,
              STUDENTID_KEY,
            ]);
          } catch (e) {
            console.warn("api: error clearing storage after refresh fail", e);
          }

          try {
            // Replace RN Alert.alert with a safe browser fallback
            if (isBrowser && typeof window.alert === "function") {
              window.alert("Session expired. Please log in again.");
            }
          } catch (e) {
            /* ignore */
          }

          return Promise.reject(refreshErr ?? error);
        })
        .finally(() => {
          isRefreshing = false;
        });
    }
  );
};

export default api;

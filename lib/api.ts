// lib/api.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

/**
 * Keys used in AsyncStorage
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

  // Use .then rather than async/await in interceptor to satisfy Axios TS overloads
  api.interceptors.request.use(
    (config: any) => {
      // Return a Promise using .then (avoids TS overload mismatch)
      return AsyncStorage.getItem(TOKEN_KEY).then((token) => {
        if (token) {
          // headers typing can be loose here
          config.headers = config.headers ?? {};
          (config.headers as any).Authorization = `Bearer ${token}`;
        }
        return config;
      });
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (res) => res,
    (error: any) => {
      const originalRequest = error.config;

      if (!error.response || error.response.status !== 401) {
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        return Promise.reject(error);
      }

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

          // Call refresh endpoint using plain axios to avoid interceptors recursion
          return axios
            .post(`${api.defaults.baseURL}auth/refresh`, { refreshToken }, { timeout: 15000 })
            .then(async (response) => {
              const data = (response.data ?? {}) as { access_token?: string; refresh_token?: string };
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
            Alert.alert("Session expired", "Please log in again.");
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

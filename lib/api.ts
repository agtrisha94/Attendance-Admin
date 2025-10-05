// lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "https://attendance-app-o83z.onrender.com/",
  // withCredentials: true,
});

let interceptorAttached = false;

export const attachInterceptor = () => {
  if (interceptorAttached) return;
  interceptorAttached = true;

  let isRefreshing = false;
  let pendingRequests: (() => void)[] = [];

  api.interceptors.response.use(
    (res) => res,
    async (error: any) => {
      const originalRequest = error.config as any;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            pendingRequests.push(() => resolve(api(originalRequest)));
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Refresh token request
          const { data } = await api.post("/auth/refresh", {}, { withCredentials: true });

          const { access_token } = data as { access_token: string };
          localStorage.setItem("token", access_token);
          api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

          pendingRequests.forEach((cb) => cb());
          pendingRequests = [];
          return api(originalRequest);
        } catch (err) {
          // Clear stored tokens
          localStorage.removeItem("token");
          localStorage.removeItem("role");

          // Optional: simple alert
          if (typeof window !== "undefined") {
            window.alert("Session expired. Please log in again.");
            window.location.href = "/logIn"; // redirect to login
          }

          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

export default api;

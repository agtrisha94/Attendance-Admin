// lib/api.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../store/auth.store";
import { Alert } from "react-native";
import { router } from "expo-router"; // Importing router this way avoids using useRouter inside this file

const api = axios.create({
  baseURL: "https://attendance-app-o83z.onrender.com/",
  withCredentials: true,
});

let interceptorAttached = false;

export const attachInterceptor = () => {
  if (interceptorAttached) return;
  interceptorAttached = true;``

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
          const { data } = await api.post("/auth/refresh", {}, {
            withCredentials: true,
          });

          const { access_token } = data as { access_token: string };
          await AsyncStorage.setItem("token", access_token);
          api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

          pendingRequests.forEach(cb => cb());
          pendingRequests = [];
          return api(originalRequest);
        } catch (err) {
          await AsyncStorage.multiRemove(["token", "role"]);
          useAuthStore.getState().reset();
          Alert.alert("Session expired", "Please log in again.");
          router.replace("/logIn");
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

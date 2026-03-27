import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api" || "http://localhost:8000/api",
  withCredentials: true,
});

axiosInstance.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("token");
  const sessionId = localStorage.getItem("sessionId");
  if (sessionId) config.headers.sessionId = `${sessionId}`;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    const newAuthHeader = response.headers["authorization"];


    if (newAuthHeader) {
      const newToken = newAuthHeader.split(" ")[1];
      localStorage.setItem("token", newToken);
    }

    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { axiosInstance };

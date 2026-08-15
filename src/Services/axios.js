import axios from "axios";
const API_BASE_URL= import.meta.env.VITE_API_BASE_URL


export const axiosInstance = (userType)=>{
  const instance=axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
     userType: userType,
  },
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = token;
  }
  return config;
});


return instance;
}


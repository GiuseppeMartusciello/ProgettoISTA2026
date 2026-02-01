import api from "../services/axiosInstance";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Container() {
  // const { isAuthenticated } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const authInterceptor = api.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error?.response?.status === 401) {
          navigate("/login");
        }

        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(authInterceptor);
  }, []);

  return <div></div>;
}

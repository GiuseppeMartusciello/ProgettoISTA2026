import api from "../services/axiosInstance";
import { User } from "../types/user.interface";

export const fetchUserMe = async (): Promise<User> => {
  const res = await api.get("/user/me", { withCredentials: true });
  console.log(res);
  return res.data;
};

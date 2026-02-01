import api from "../services/axiosInstance";
import { RegisterInfo } from "../types/registration-form";
import { User } from "../types/user.interface";

interface LoginData {
  email: string;
  password: string;
}

interface CheckResponse {
  message: string;
  exist: boolean;
}

export async function login({ email, password }: LoginData) {
  const res = await api.post<User>(
    "/auth/signin",
    { email, password },
    { withCredentials: true }
  );

  // console.log("Res: ", res);
  console.log("Utente: ", res.data);

  return res.data;
}

export async function logout() {
  const res = await api.post("auth/logout", {}, { withCredentials: true });

  return res.data;
}

export async function register(registerInfo: RegisterInfo) {
  const res = await api.post("auth/signup", registerInfo, {
    withCredentials: true,
  });

  return res.data;
}
export const checkEmailExists = async (
  email: string
): Promise<CheckResponse> => {
  const res = await api.get(`auth/check/email/${email}`, {
    withCredentials: true,
  });
  console.log("Check email response:", res);
  return res.data;
};

export const checkCFExists = async (cf: string): Promise<CheckResponse> => {
  const res = await api.get(`auth/check/cf/${cf}`, {
    withCredentials: true,
  });
  console.log("Check CF response:", res);
  return res.data;
};

export const checkPhoneExists = async (
  phone: string
): Promise<CheckResponse> => {
  const res = await api.get(`auth/check/phone/${phone}`, {
    withCredentials: true,
  });
  console.log("Check phone response:", res);
  return res.data;
};

import api from "../services/axiosInstance";
import { LoginResponse } from "../types/loginResponse";
import { RegisterInfo } from "../types/registration-form";
import { Setup2faResponse } from "../types/setup2fa.response";
import { User } from "../types/user.interface";

interface LoginData {
  email: string;
  password: string;
}

interface CheckResponse {
  message: string;
  exist: boolean;
}


export async function verify2FA(challengeId: string, code: string) {
  const res = await api.post<User>(
    "/auth/2fa/verify",
    { challengeId, code },
    { withCredentials: true }
  );
  console.log("2FA verification response: ", res.data);

  return res.data;
}

export async function disable2fa (code: string) {
  const res = await api.post("/auth/2fa/disable", { code }, { withCredentials: true });
  console.log("2FA disable response: ", res.data);

  return res.data;
}

export async function setup2fa() {
  const res = await api.post<Setup2faResponse>("/auth/2fa/setup", {}, { withCredentials: true });
  console.log("2FA setup response: ", res.data);

  return res.data;
}

export async function confirm2fa(code: string) {
  const res = await api.post("/auth/2fa/confirm", { code }, { withCredentials: true });
  console.log("2FA confirm response: ", res.data);

  return res.data;
}

export async function login({ email, password }: LoginData) {
  const res = await api.post<LoginResponse>(
    "/auth/signin",
    { email, password },
    { withCredentials: true }
  );
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

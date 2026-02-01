import api from "../services/axiosInstance";
import { PatientItem } from "../types/patient.interface";
// import { Patient } from "../types/patient.interface";

export interface PatientsResponse {
  data: PatientItem[];
  total: number;
  page: number;
  limit: number;
}
export async function fetchPatients(
  page: number,
  limit: number,
  search: string
) {
  console.log("Sono dentro fetchpatients: ", page, limit, search);
  const res = await api.get<PatientsResponse>(
    `doctor/patients?page=${page}&limit=${limit}&search=${search}`,
    {
      withCredentials: true,
    }
  );
  return res.data;
}

export async function fetchPatient(id: string) {
  const res = await api.get<PatientItem>(`doctor/patients/${id}`, {
    withCredentials: true,
  });

  return res.data;
}

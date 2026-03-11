import api from "../services/axiosInstance";
import { CreateAvailabilityDto } from "../types/create-availabilty.dto";
import { CreatePatientDto } from "../types/create-patient.dto";
import { MedicalDetectionType } from "../types/medical-detection-type";
import { MedicalExaminationDTO } from "../types/medical-examination.dto";
import { MedicalExaminationsResponse } from "../types/medicalExaminationResponse.interface";
import { Doctor } from "../types/patient-registration-form";
import { Range } from "../hooks/use-reservations";


export async function fetchDoctor() {
  const res = await api.get<Doctor>("doctor/me", {
    withCredentials: true,
  });
  return res.data;
}

export async function addPatient(patient: CreatePatientDto) {
  const res = await api.post<any>("doctor/invite", patient, {
    withCredentials: true,
  });

  console.log("Result: ", res.data);
  return res.data.patientId;
}

export async function fetchAvailability(range: Range | null) {
  const params = new URLSearchParams();

  if (range) {
    if (range?.start) params.append("start", range.start.toISOString());
    if (range?.end) params.append("end", range.end.toISOString());
  }

  const res = await api.get<any>(`doctor/availability?${params.toString()}`, {
    withCredentials: true,
  });

  console.log("Result: ", res);
  console.log("Result.data: ", res.data);

  return res.data;
}

export async function addAvailability(availability: CreateAvailabilityDto) {
  const a = {
    title: availability.title,
    startTime: availability.start,
    endTime: availability.end,
  };

  console.log("Availability inserita: ", a);

  const res = await api.post<any>("doctor/availability", a, {
    withCredentials: true,
  });

  console.log("Result: ", res.data);
  return res.data.id;
}

export async function deleteAvailability(idAvailability: string) {
  const res = await api.delete(`doctor/availability/${idAvailability}`, {
    withCredentials: true,
  });

  console.log("Result: ", res.data);
  return res.data.id;
}


export async function addMedicalExamination(
  medicalExamination: MedicalExaminationDTO,
  reservationId: string
) {
  const res = await api.post<any>(
    `medical-examination/${reservationId}`,
    medicalExamination,
    { withCredentials: true }
  );

  return res.data;
}

export async function getMedicalDetections(
  patientId: string,
  type: MedicalDetectionType,
  //startDate: string | undefined,
  //endDate: string | undefined
) {
  const params = new URLSearchParams();

  if (type) params.append("type", type.toString());

  // if (startDate) params.append("startDate", startDate);

  // if (endDate) params.append("endDate", endDate);

  const res = await api.get(
    `medical-detection/patient/${patientId}?${params.toString()}`,
    {
      withCredentials: true,
    }
  );

  return res.data;
}

export async function getMedicalExaminations(
  patientId: string,
  limit: number = 3,
  cursor: string | undefined
): Promise<MedicalExaminationsResponse> {
  const params = new URLSearchParams();

  if (limit) params.append("limit", limit.toString());

  if (cursor) params.append("cursor", cursor);

  const res = await api.get<MedicalExaminationsResponse>(
    `medical-examination/${patientId}/?${params.toString()}`,
    {
      withCredentials: true,
    }
  );

  const parsed: MedicalExaminationsResponse = res.data;

  console.log("🔍 Risposta API ricevuta:", parsed);
  console.log("🔍 Tipo di parsed:", typeof parsed);
  console.log("🔍 parsed.pagination esiste?", !!parsed.pagination);

  return parsed;
}

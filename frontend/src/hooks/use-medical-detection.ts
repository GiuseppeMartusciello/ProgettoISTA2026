import { useQuery } from "@tanstack/react-query";
import { MedicalDetectionType } from "../types/medical-detection-type";
import { MedicalDetectionsDTO } from "../types/medical-detections.dto";
import { getMedicalDetections } from "../api/doctor";
import e from "express";

export function useMedicalDetection(
  patientId: string,
  type: MedicalDetectionType,
  startDate?: string,
  endDate?: string
) {
  return useQuery<MedicalDetectionsDTO>({
    queryKey: ["detection", patientId, type],
    queryFn: () => getMedicalDetections(patientId, type, startDate, endDate),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

import { MedicalDetection } from "./medical-detection.interface";

export interface MedicalDetectionsDTO {
  total: number;
  detections: MedicalDetection[];
}

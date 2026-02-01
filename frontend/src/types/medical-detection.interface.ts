import { MedicalDetectionType } from "./medical-detection-type";

export interface MedicalDetection {
  value: number;
  type: MedicalDetectionType;
  date: Date;
}

import { MedicalDetection } from "./MedicalDetection";
import styles from "../styles/medicalDetections.module.css";
import { MedicalDetectionType } from "../types/medical-detection-type";

type MedicalDetectionsProp = {
  patientId: string;
};

export default function MedicalDetections({
  patientId,
}: MedicalDetectionsProp) {
  return (
    <div>
      <div className={styles.medicalDetections}>
        <MedicalDetection
          type={MedicalDetectionType.SPO2}
          patientId={patientId}
          endDate={undefined}
          startDate={undefined}
        />
        <MedicalDetection
          type={MedicalDetectionType.HR}
          patientId={patientId}
          endDate={undefined}
          startDate={undefined}
        />
        <MedicalDetection
          type={MedicalDetectionType.TEMP}
          patientId={patientId}
          endDate={undefined}
          startDate={undefined}
        />
        <MedicalDetection
          type={MedicalDetectionType.WEIGHT}
          patientId={patientId}
          endDate={undefined}
          startDate={undefined}
        />
      </div>
    </div>
  );
}

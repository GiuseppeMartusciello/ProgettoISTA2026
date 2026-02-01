export interface MedicalExaminationsResponse {
  data: MedicalExaminationResponse[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    limit: number;
  };
}

export interface MedicalExaminationResponse {
  id: string;
  date: Date;
  motivation: string;
  note: string;
}

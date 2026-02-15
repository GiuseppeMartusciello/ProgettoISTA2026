export interface PatientItem {
  id: string;
  weight: number;
  height: number;
  bloodType: string;
  level: string;
  sport: string;
  pathologies: string[];
  medications: string[];
  injuries: string[];

  user: {
    id: string;
    name: string;
    surname: string;
    email: string;
    cf: string;
    birthDate: Date;
    gender: string;
    phone: string;
    role: string;
    address: string;
    city: string;
    cap: string;
    province: string;
  };
}

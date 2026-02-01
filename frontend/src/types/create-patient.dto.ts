export interface CreatePatientDto {
  name: string;
  surname: string;
  email: string;
  cf: string;
  birthDate: Date;
  gender: string;
  phone: string;
  address: string;
  city: string;
  cap: string;
  province: string;
  weight: number;
  height: number;
  bloodType: string;
  level: string;
  sport: string;
  patologies: string[];
  medications: string[];
  injuries: string[];
}

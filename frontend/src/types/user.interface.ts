export interface User {
  name: string;
  surname: string;
  id: string;
  role: string;
  email: string;
  gender: string;
  phone: string;
  cf: string;
  birthDate: Date;
  address: string;
  city: string;
  cap: string;
  province: string;
  doctor: {
    medicalOffice: string;
    registrationNumber: string;
    orederProvince: string;
    orderDate: Date;
    orderType: string;
    specialization: string;
  };
}

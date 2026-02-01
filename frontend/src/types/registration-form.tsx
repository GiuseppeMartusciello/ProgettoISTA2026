import { UseFormReturnType } from "@mantine/form";

type FormValues = {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  cf: string;
  birthDate: string;
  phone: string;
  gender: string;
  address: string;
  city: string;
  cap: string;
  province: string;
  medicalOffice: string;
  registrationNumber: string;
  orderProvince: string;
  orderDate: string;
  orderType: string;
  specialization: string;
};

export interface RegisterInfo {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  cf: string;
  birthDate: string;
  phone: string;
  gender: string;
  address: string;
  city: string;
  cap: string;
  province: string;
  medicalOffice: string;
  registrationNumber: string;
  orderProvince: string;
  orderDate: string;
  orderType: string;
  specialization: string;
}

export type StepProps = {
  form: UseFormReturnType<FormValues>;
};

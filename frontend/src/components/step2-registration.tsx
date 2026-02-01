import { Select, TextInput } from "@mantine/core";
import { StepProps } from "../types/registration-form";
import styles from "../styles/Step.module.css";

export default function Step2({ form }: StepProps) {
  return (
    <div className={styles.container}>
      <TextInput
        className={styles.input}
        size="lg"
        label="Codice Fiscale"
        {...form.getInputProps("cf")}
        placeholder="Inserisci il tuo codice fiscale"
      />
      <TextInput
        className={styles.input}
        size="lg"
        label="Data di nascita"
        mt="sm"
        type="date"
        {...form.getInputProps("birthDate")}
        // placeholder="gg / mm / aaaa"
        //error={form.errors.orderDate}
        //valueFormat="DD/MM/YYYY"
        //placeholder="gg/mm/aaaa"
      />
      {/*          
      <DateInput
        label="Data di nascita"
        {...form.getInputProps("birthDate")}
        valueFormat="DD/MM/YYYY"
        //hideCalendar
        //allowFreeInput
        placeholder="gg/mm/aaaa"
      /> */}
      <TextInput
        size="lg"
        label="Telefono"
        {...form.getInputProps("phone")}
        placeholder="Inserisci il tuo numero di telefono"
        className={styles.input}
      />
      <Select
        size="lg"
        className={styles.input}
        label="Genere"
        placeholder="Inserisci il tuo genere"
        data={["Uomo", "Donna", "Altro"]}
        {...form.getInputProps("gender")}
      />
    </div>
  );
}

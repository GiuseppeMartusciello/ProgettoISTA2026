import { TextInput } from "@mantine/core";
import { StepProps } from "../types/patient-registration-form";
import styles from "../styles/Step.module.css";
import { Space } from "@mantine/core";

export default function Step2({ form }: StepProps) {
  return (
    <div className={styles.container}>
      <TextInput
        size="lg"
        className={styles.input}
        label="Indirizzo"
        mt="sm"
        {...form.getInputProps("address")}
        placeholder="Inserisci l'indirizzo di residenza del paziente"
      />

      <TextInput
        size="lg"
        className={styles.input}
        label="Città"
        {...form.getInputProps("city")}
        placeholder="Inserisci la città di residenza del paziente"
      />
      <TextInput
        size="lg"
        className={styles.input}
        label="CAP"
        {...form.getInputProps("cap")}
        placeholder="Inserisci il CAP di residenza del paziente"
      />
      <TextInput
        size="lg"
        className={styles.input}
        label="Provincia"
        {...form.getInputProps("province")}
        placeholder="Inserisci la provincia "
      />
      <Space h={"md"} />
    </div>
  );
}

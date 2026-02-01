import { TextInput } from "@mantine/core";
import { StepProps } from "../types/registration-form";
import styles from "../styles/Step.module.css";

export default function Step3({ form }: StepProps) {
  return (
    <div className={styles.container}>
      <TextInput
        className={styles.input}
        size="lg"
        label="Indirizzo"
        {...form.getInputProps("address")}
        placeholder="Inserisci il tuo indirizzo di residenza"
      />
      <TextInput
        size="lg"
        className={styles.input}
        label="Città"
        {...form.getInputProps("city")}
        placeholder="Inserisci la tua citta di residenza"
      />
      <TextInput
        size="lg"
        className={styles.input}
        label="CAP"
        {...form.getInputProps("cap")}
        placeholder="Inserisci il CAP"
      />
      <TextInput
        size="lg"
        className={styles.input}
        label="Provincia"
        {...form.getInputProps("province")}
        placeholder="Inserisci la provincia"
      />
    </div>
  );
}

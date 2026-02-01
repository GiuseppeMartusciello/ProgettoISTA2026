import { NumberInput, Select, Space, TextInput } from "@mantine/core";
import { StepProps } from "../types/patient-registration-form";
import styles from "../styles/Step.module.css";

export default function Step3({ form }: StepProps) {
  return (
    <div className={styles.container}>
      <NumberInput
        size="lg"
        label="Peso (kg)"
        className={styles.input}
        {...form.getInputProps("weight")}
        placeholder="Inserisci il peso corporeo del paziente"
      />
      <NumberInput
        size="lg"
        label="Altezza (cm)"
        className={styles.input}
        {...form.getInputProps("height")}
        placeholder="Inserisci l'altezza del paziente"
      />

      <TextInput
        size="lg"
        label="Sport"
        className={styles.input}
        mt="sm"
        {...form.getInputProps("sport")}
        placeholder="Inserisci lo sport praticato del paziente"
      />
      <Select
        size="lg"
        label="Livello"
        mt="sm"
        className={styles.input}
        data={["BEGINNER", "INTERMEDIATE", "ADVANCED"]}
        {...form.getInputProps("level")}
        placeholder="Seleziona il livello atletico del paziente nella sua disciplina"
      />
      <Space h={"md"} />
    </div>
  );
}

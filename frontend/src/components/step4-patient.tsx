import { Select, Space, TagsInput } from "@mantine/core";
import { StepProps } from "../types/patient-registration-form";
import styles from "../styles/Step.module.css";

export default function Step4({ form }: StepProps) {
  return (
    <div className={styles.container}>
      <Select
        className={styles.input}
        size="lg"
        label="Gruppo sanguigno"
        mt="sm"
        data={["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"]}
        {...form.getInputProps("bloodType")}
        placeholder="Inserisci il gruppo sanguigno del paziente"
      />

      <TagsInput
        size="lg"
        className={styles.input}
        label="Patologie"
        mt="sm"
        data={[]}
        placeholder="Inserisci le patologie del paziente"
        {...form.getInputProps("patologies")}
        error={form.errors.patologies}
      />

      <TagsInput
        size="lg"
        className={styles.input}
        label="Farmaci"
        mt="sm"
        data={[]}
        placeholder="Inserisci i farmaci attuali del paziente"
        {...form.getInputProps("medications")}
        error={form.errors.medications}
      />

      <TagsInput
        size="lg"
        className={styles.input}
        label="Infortuni"
        mt="sm"
        data={[]}
        placeholder="Inserisci gli infortuni pregressi del paziente"
        {...form.getInputProps("injuries")}
        error={form.errors.injuries}
      />
      <Space h={"lg"} />
    </div>
  );
}

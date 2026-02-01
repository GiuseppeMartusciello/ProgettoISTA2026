import { Select, Space, TextInput, Title } from "@mantine/core";
import { StepProps } from "../types/patient-registration-form";
// import { useState } from "react";
import styles from "../styles/Step.module.css";
// import { z } from "zod";
// import { DatePickerInput } from "@mantine/dates";

export default function Step1({ form }: StepProps) {
  // const [popoverOpened, setPopoverOpened] = useState(false);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* <div className={styles.row}> */}
          <TextInput
            size="lg"
            className={styles.input}
            label="Nome"
            {...form.getInputProps("name")}
            placeholder="Inserisci il nome del paziente"
          />
          <TextInput
            size="lg"
            className={styles.input}
            label="Cognome"
            {...form.getInputProps("surname")}
            placeholder="Inserisci il cognome del paziente"
          />
          {/* </div> */}

          {/* <div className={styles.row}> */}
          <TextInput
            size="lg"
            className={styles.input}
            label="Email"
            mt="sm"
            {...form.getInputProps("email")}
            placeholder="Inserisci l'indirizzo mail del paziente"
          />

          <TextInput
            size="lg"
            className={styles.input}
            label="Telefono"
            mt="sm"
            {...form.getInputProps("phone")}
            placeholder="Inserisci il numero di telefono del paziente"
          />
          {/* </div> */}

          {/* <div className={styles.row}>
            {" "} */}
          <TextInput
            size="lg"
            className={styles.input}
            label="Codice fiscale"
            mt="sm"
            {...form.getInputProps("cf")}
            placeholder="Inserisci il codice fiscale del paziente"
          />
          <TextInput
            size="lg"
            className={styles.input}
            label="Data di nascita"
            mt="sm"
            type="date"
            {...form.getInputProps("birthDate")}
            placeholder="Inserisci la data di nascita del paziente"
          />
          {/* </div> */}

          <Select
            size="lg"
            className={styles.input}
            label="Genere"
            mt="sm"
            data={["Uomo", "Donna", "Altro"]}
            {...form.getInputProps("gender")}
            placeholder="Inserisci il genere del paziente"
          />
        </div>
        <Space h={"md"} />
      </div>
    </>
  );
}

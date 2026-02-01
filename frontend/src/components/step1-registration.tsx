import { PasswordInput, Popover, TextInput } from "@mantine/core";
import { StepProps } from "../types/registration-form";
import styles from "../styles/Step.module.css";

export default function Step1({ form }: StepProps) {
  // const [popoverOpened, setPopoverOpened] = useState(false);

  return (
    <>
      <div className={styles.container}>
        <TextInput
          className={styles.input}
          size="lg"
          label="Nome"
          {...form.getInputProps("name")}
          placeholder="Inserisci il tuo nome"
        />
        <TextInput
          className={styles.input}
          size="lg"
          label="Cognome"
          {...form.getInputProps("surname")}
          placeholder="Inserisci il tuo cognome"
        />
        <TextInput
          className={styles.input}
          size="lg"
          label="Email"
          {...form.getInputProps("email")}
          placeholder="Inserisci la tua mail"
        />

        <PasswordInput
          label="Password"
          size="lg"
          placeholder="Crea una password sicura"
          {...form.getInputProps("password")}
          className={styles.input}
        />

        <PasswordInput
          className={styles.input}
          size="lg"
          label="Conferma Password"
          {...form.getInputProps("confirmPassword")}
          placeholder="Conferma password"
          mt="sm"
        />
      </div>
    </>
  );
}

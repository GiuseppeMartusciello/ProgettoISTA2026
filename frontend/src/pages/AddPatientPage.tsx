import { Button, Group, Stepper, Paper } from "@mantine/core";
import styles from "../styles/addPatient.module.css";
import { useForm } from "@mantine/form";
import { useAddPatientMutation } from "../hooks/use-add-patient.mutation";
import { useState } from "react";
import { step1Schema } from "../types/validation/add-patient/step1.schema";
import Step1 from "../components/step1-patient";
import Step2 from "../components/step2-patient";
import Step3 from "../components/step3-patient";
import Step4 from "../components/step4-patient";
import { step2Schema } from "../types/validation/add-patient/step2.schema";
import { step3Schema } from "../types/validation/add-patient/step3.schema";
import { FormValues } from "../types/patient-registration-form";
import { step4Schema } from "../types/validation/add-patient/step4.schema";

export default function AddPatientPage() {
  const mutation = useAddPatientMutation();
  const [active, setActive] = useState(0);
  const [highestStepVisited, setHighestStepVisited] = useState(active);

  const stepSchemas = [step1Schema, step2Schema, step3Schema, step4Schema];

  const getStepData = (step: number) => {
    switch (step) {
      case 0:
        return {
          name: form.values.name,
          surname: form.values.surname,
          email: form.values.email,
          cf: form.values.cf,
          birthDate: form.values.birthDate,
          phone: form.values.phone,
          gender: form.values.gender,
        };
      case 1:
        return {
          address: form.values.address,
          city: form.values.city,
          cap: form.values.cap,
          province: form.values.province,
        };
      case 2:
        return {
          weight: form.values.weight,
          height: form.values.height,
          sport: form.values.sport,
          level: form.values.level,
        };
      case 3:
        return {
          bloodType: form.values.bloodType,
          patologies: form.values.patologies,
          medications: form.values.medications,
          injuries: form.values.injuries,
        };
    }
  };

  const handleValidation = (): boolean => {
    console.log("Active: ", active);

    const schema = stepSchemas[active];
    const stepData = getStepData(active);
    const result = schema.safeParse(stepData);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;

      console.log("Result: ", result);

      // Imposta gli errori nel form
      Object.entries(errors).forEach(([field, messages]) => {
        if (messages && messages.length > 0) {
          form.setFieldError(field, messages[0]); // solo il primo messaggio
        }
      });

      return false;
    }

    return true;
  };

  function handleSubmit(values: typeof form.values) {
    console.log("Submitted values:", values);

    console.log("Prima dell'if");
    if (!handleValidation()) return;

    console.log("Sto chiamando l'api.");
    mutation.mutate({
      ...values,
      birthDate: new Date(values.birthDate),
    });
  }

  const handleStepChange = async (nextStep: number) => {
    // chiamare e verificare lo schema dell'attuale step prima di andare avanti:

    const isOutOfBounds = nextStep > 4 || nextStep < 0;

    if (isOutOfBounds) {
      return;
    }

    if (nextStep > active) {
      if (!handleValidation()) return;
    } else setActive(active - 1);

    setActive(nextStep);
    setHighestStepVisited((hSC) => Math.max(hSC, nextStep));
  };

  const shouldAllowSelectStep = (step: number) =>
    highestStepVisited >= step && active !== step;

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      surname: "",
      email: "",
      cf: "",
      birthDate: new Date(),
      gender: "Uomo",
      phone: "",
      address: "",
      city: "",
      cap: "",
      province: "",
      weight: 0,
      height: 0,
      bloodType: "",
      level: "INTERMEDIATE",
      sport: "",
      patologies: [],
      medications: [],
      injuries: [],
    },
  });

  // const form = useForm<FormValues>({
  //   initialValues: {
  //     name: "Luca",
  //     surname: "Rossi",
  //     email: "luca.rossi@example.com",
  //     cf: "RSSLCU85T10H501Z",
  //     birthDate: new Date("1990-04-15"),
  //     gender: "Uomo",
  //     phone: "3451234567",
  //     address: "Via Garibaldi 10",
  //     city: "Milano",
  //     cap: "20100",
  //     province: "MI",
  //     weight: 75,
  //     height: 180,
  //     bloodType: "A+",
  //     level: "INTERMEDIATE",
  //     sport: "Corsa",
  //     patologies: ["Asma"],
  //     medications: ["Ventolin"],
  //     injuries: ["Distorsione caviglia - 2023"],
  //   },
  // });

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <Paper
          withBorder
          shadow="md"
          p="lg"
          radius="md"
          className={styles.paper}
        >
          <Stepper
            className={styles.header}
            size="lg"
            active={active}
            onStepClick={setActive}
          >
            <Stepper.Step
              label="Primo step"
              description="Informazioni personali"
              allowStepSelect={shouldAllowSelectStep(0)}
              color="var(--accent-primary)"
            ></Stepper.Step>
            <Stepper.Step
              label="Secondo step"
              description="Informazioni di residenza"
              allowStepSelect={shouldAllowSelectStep(1)}
              color="var(--accent-primary)"
            ></Stepper.Step>
            <Stepper.Step
              label="Terzo Step"
              description="Informazioni fisiche"
              allowStepSelect={shouldAllowSelectStep(2)}
              color="var(--accent-primary)"
            ></Stepper.Step>
            <Stepper.Step
              label="Quarto Step"
              description="Informazioni mediche"
              allowStepSelect={shouldAllowSelectStep(3)}
              color="var(--accent-primary)"
            ></Stepper.Step>
          </Stepper>

          <form onSubmit={form.onSubmit(handleSubmit)} className={styles.form}>
            {active === 0 && <Step1 form={form} />}
            {active === 1 && <Step2 form={form} />}
            {active === 2 && <Step3 form={form} />}
            {active === 3 && <Step4 form={form} />}

            <Group justify="space-between" mt="xl" className={styles.footer}>
              {active > 0 && (
                <Button
                  onClick={() => handleStepChange(active - 1)}
                  className="button"
                >
                  Indietro
                </Button>
              )}
              {active < 3 && (
                <Button
                  onClick={() => handleStepChange(active + 1)}
                  className="button"
                >
                  Avanti
                </Button>
              )}
              {active === 3 && (
                <Button
                  type="submit"
                  loading={mutation.isPending}
                  className="button"
                >
                  Salva Paziente
                </Button>
              )}
            </Group>
          </form>
        </Paper>
      </div>
    </div>
  );
}

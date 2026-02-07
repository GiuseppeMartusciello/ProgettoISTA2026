import styles from "../styles/Register.module.css";
import { useForm } from "@mantine/form";
import { Paper, Button, Stepper } from "@mantine/core";

import { useState } from "react";
import Step1 from "../components/step1-registration";
import Step2 from "../components/step2-registration";
import Step3 from "../components/step3-registration";
import Step4 from "../components/step4-registration";
import { useRegisterMutation } from "../hooks/use-register-mutation";
import { step1Schema } from "../types/validation/registration/step1.schema";
import { step2Schema } from "../types/validation/registration/step2.schema";
import { step3Schema } from "../types/validation/registration/step3.schema";
import { step4Schema } from "../types/validation/registration/step4.schema";
import { ThemeToggle } from "../components/themeToggle";
import BackButton from "../components/BackButton";
import z from "zod";

export default function RegisterPage() {
  const [active, setActive] = useState(0);
  const mutation = useRegisterMutation();
  const [highestStepVisited, setHighestStepVisited] = useState(active);

  const stepSchemas = [step1Schema, step2Schema, step3Schema, step4Schema];

  const getStepData = (step: number) => {
    switch (step) {
      case 0:
        return {
          name: form.values.name,
          surname: form.values.surname,
          email: form.values.email,
          password: form.values.password,
          confirmPassword: form.values.confirmPassword,
        };
      case 1:
        return {
          cf: form.values.cf,
          birthDate: form.values.birthDate,
          phone: form.values.phone,
          gender: form.values.gender,
        };
      case 2:
        return {
          address: form.values.address,
          city: form.values.city,
          cap: form.values.cap,
          province: form.values.province,
        };
      case 3:
        return {
          medicalOffice: form.values.medicalOffice,
          registrationNumber: form.values.registrationNumber,
          orderProvince: form.values.orderProvince,
          orderDate: form.values.orderDate,
          orderType: form.values.orderType,
          specialization: form.values.specialization,
        };
    }
  };

  function handleSubmit(values: typeof form.values) {
    console.log("ciao");
    if (!handleValidation()) return;

    console.log("Dati registrazione:", values);
    // Fai la POST o la mutation qui
    mutation.mutate(values);
  }

  const handleValidation = async (): Promise<boolean> => {
    console.log("Active: ", active);

    const schema = stepSchemas[active];
    const stepData = getStepData(active);

    try {
      await schema.parseAsync(stepData);

      return true;
    } catch (error) {
      console.log("Validazione fallita");

      if (error instanceof z.ZodError) {
        // Gestisci gli errori di validazione
        const errors = error.flatten().fieldErrors;

        console.log("Sono dentro l'if degli errori");

        // Imposta gli errori nel form
        Object.entries(errors).forEach(([field, messages]) => {
          if (messages && messages.length > 0) {
            form.setFieldError(field, messages[0]); // solo il primo messaggio
          }
        });
      }

      return false; // La validazione non è passata, restituiamo false
    }
  };

  const handleStepChange = async (nextStep: number) => {
    // chiamare e verificare lo schema dell'attuale step prima di andare avanti:

    console.log("Step attuale: " + active);
    console.log("NextStep: ", nextStep);

    const isOutOfBounds = nextStep > 4 || nextStep < 0;

    if (isOutOfBounds) {
      return;
    }

    if (nextStep > active) {
      if (!handleValidation()) {
        console.log("Validazione fallita");
        return;
      }
    } else setActive(active - 1);

    setActive(nextStep);
    setHighestStepVisited((hSC) => Math.max(hSC, nextStep));
  };

  const shouldAllowSelectStep = (step: number) =>
    highestStepVisited >= step && active !== step;

  const form = useForm({
    initialValues: {
      name: "",
      surname: "",
      email: "",
      password: "",
      confirmPassword: "",
      cf: "",
      birthDate: "",
      phone: "",
      gender: "",
      address: "",
      city: "",
      cap: "",
      province: "",
      medicalOffice: "",
      registrationNumber: "",
      orderProvince: "",
      orderDate: "",
      orderType: "",
      specialization: "",
    },
  });

  return (
    <>
      <BackButton position="absolute" path={undefined} />
      <ThemeToggle />

      <div className={styles.container}>
        <div className={styles.main}>
          <Paper
            withBorder
            shadow="md"
            p="lg"
            radius="md"
            className={styles.paper}
            // style={{ border: "1px solid red" }}
          >
            <Stepper
              active={active}
              onStepClick={setActive}
              className={styles.header}
              size="lg"

              // style={{ border: "1px solid red" }}
            >
              <Stepper.Step
                color="var(--accent-primary)"
                className={styles.step}
                label="Primo step"
                description="Infomazioni generali"
                allowStepSelect={shouldAllowSelectStep(0)}
              ></Stepper.Step>
              <Stepper.Step
                color="var(--accent-primary)"
                label="Secondo step"
                description="Infomazioni personali"
                allowStepSelect={shouldAllowSelectStep(1)}
              ></Stepper.Step>
              <Stepper.Step
                color="var(--accent-primary)"
                label="Terzo Step"
                description="Informazioni di residenza"
                allowStepSelect={shouldAllowSelectStep(2)}
              ></Stepper.Step>
              <Stepper.Step
                color="var(--accent-primary)"
                label="Quarto Step"
                description="Infomazioni mediche"
                allowStepSelect={shouldAllowSelectStep(3)}
              ></Stepper.Step>
            </Stepper>

            <form
              // style={{ border: "1px solid red" }}
              className={styles.form}
              onSubmit={form.onSubmit(handleSubmit)}
            >
              <div className={styles.fields}>
                {active === 0 && <Step1 form={form} />}
                {active === 1 && <Step2 form={form} />}
                {active === 2 && <Step3 form={form} />}
                {active === 3 && <Step4 form={form} />}
              </div>

              <div className={styles.buttonGroup}>
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
                    Registrati
                  </Button>
                )}
              </div>
            </form>
          </Paper>
        </div>
      </div>
    </>
  );
}

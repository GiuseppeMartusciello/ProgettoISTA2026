import { useLoginMutation } from "../hooks/use-login-mutation";
import { useUser } from "../context/UserContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { PasswordInput, Space, TextInput } from "@mantine/core";

import styles from "../styles/Login.module.css";

import Logo from "../components/Logo";
import { useForm } from "@mantine/form";
import { ThemeToggle } from "../components/themeToggle";
import { useCallback } from "react";
import { loginSchema } from "../types/validation/login/login.schema";

export default function LoginPage() {
  const mutation = useLoginMutation();
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = useCallback(
    async (values: typeof form.values) => {
      const result = loginSchema.safeParse(values);

      if (!result.success) {
        // Aggiorna gli errori nel form
        const zodErrors = result.error.flatten().fieldErrors;
        form.setErrors({
          email: zodErrors.email?.[0],
          password: zodErrors.password?.[0],
        });
        return;
      }

      // Se è tutto valido, invia i dati
      mutation.mutate(values);
    },
    [form, mutation]
  );

  if (isAuthenticated) return <Navigate to="/patients" />;

  return (
    <>
      <ThemeToggle />

      <div className={styles.pageContainer}>
        {/* <Box className={styles.container}> */}

        <div className={styles.formContainer}>
          <div className={styles.glassCard}>
            <div style={{ marginBottom: "2rem" }}>
              <Logo dimension={"big"} />

              <Space h="lg" />
              <h1 className={styles.pageTitle}>SymbioCare</h1>
              <p className={styles.pageSubTitle}>
                Accedi al tuo account per continuare
              </p>
            </div>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <div className={styles.formStack}>
                <div className={styles.inputGroup}>
                  {/* <div className={styles.inputWrapper}> */}
                  <label className={styles.inputLabel} htmlFor="password">
                    Email
                  </label>

                  <TextInput
                    size="md"
                    placeholder="la-tua@email.com"
                    type="text"
                    leftSection={<Mail size={16} />}
                    withAsterisk
                    {...form.getInputProps("email")}
                    className={styles.formInput}
                    styles={{
                      input: {
                        height: 50,
                        "&:focus": {
                          borderColor: "var(--text-muted) !important",
                          background: "var(--bg-tertiary) !important",
                        },
                      },
                    }}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel} htmlFor="password">
                    Password
                  </label>

                  <PasswordInput
                    size="md"
                    placeholder="La tua Password"
                    type="password"
                    leftSection={<Lock size={16} />}
                    {...form.getInputProps("password")}
                    styles={{
                      input: {
                        height: 50,
                        "&:focus": {
                          borderColor: "var(--text-muted) !important",
                          background: "var(--bg-tertiary) !important",
                        },
                      },
                    }}
                    className={styles.formInput}
                  />
                </div>

                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  // disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "48px",
                    marginTop: "0.5rem",
                  }}
                >
                  Accedi
                </button>
              </div>
            </form>
            {/* <Divider label="o" p/> */}
            <div className={styles.navSection}>
              <p className={styles.navText}>Non hai un account? </p>
              <Space w={"md"} />
              <button
                className={styles.btnLink}
                onClick={() => navigate("/register")}
              >
                Registrati
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

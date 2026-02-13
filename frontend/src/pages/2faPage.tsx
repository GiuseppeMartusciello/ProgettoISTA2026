import  { useEffect } from "react";
import {
  Paper,
  Text,
  Center,
  Stack,
  Title,
} from "@mantine/core";
import { TabletSmartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

// import styles from "../styles/2faPage.module.css";
import { useVerify2FAMutation } from "../hooks/use-verify-2fa.mutation";
import BackButton from "../components/BackButton";
import { OtpInputForm } from "../components/OtpInputForm";

export const TwoFAPage = () => {
  const navigate = useNavigate();
  const { mutate: verify2FA, isError, reset } = useVerify2FAMutation();
  const queryParams = new URLSearchParams(window.location.search);
  const challengeId = queryParams.get("challengeId") || "";

  // Timer gestito dal componente OtpInputForm
  const handleTimerEnd = () => {
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (isError) {
      // Il reset del form viene gestito internamente da OtpInputForm tramite onError
      reset();
    }
  }, [isError, reset]);

  return (
    <>
      <BackButton position="absolute" path={undefined} />
      <Center style={{ minHeight: "100vh", background: "var(--background)" }}>
        <Paper shadow="md" p={32} radius={16} className="">
          <Stack align="center">
            <TabletSmartphone size={200} color="var(--accent-primary)" />
            <Title
              order={2}
              style={{ fontWeight: 700, color: "var(--accent-primary)" }}
            >
              Autenticazione a Due Fattori
            </Title>
            <Text c="dimmed" size="md">
              Inserisci il codice OTP ricevuto. Il codice scadrà tra:
            </Text>
            <OtpInputForm
              onSubmit={(otp) => verify2FA({ challengeId, code: otp })}
              onCancel={() => navigate("/login", { replace: true })}
              timerSeconds={300}
              onTimerEnd={handleTimerEnd}
              submitLabel="Invia"
              cancelLabel="Annulla"
              loading={false}
            />
          </Stack>
        </Paper>
      </Center>
    </>
  );
};

import { Text, Title } from "@mantine/core";
import { OtpInputForm } from "./OtpInputForm";
import { useDisable2FAMutation } from "../hooks/use-disable2fa.mutation";

type Disable2FAProps = {
  onClose: () => void;
};

export function Disable2FA({ onClose }: Disable2FAProps) {
  const {
    mutate: disable2FA,
    isError,
  } = useDisable2FAMutation();

  return (
    <div>
      <Title order={3} mb="md">
        Disabilitazione autenticazione a due fattori
      </Title>

      <Text mb="md">
        Inserisci il codice OTP generato dalla tua app di autenticazione per
        confermare la disabilitazione della 2FA.
      </Text>

      {isError && (
        <p style={{ color: "red", fontWeight: 500 }}>
          Codice OTP inserito non valido. <br /> Riprova.
        </p>
      )}

      <OtpInputForm
        onSubmit={(otp) => disable2FA(otp, { onSuccess: onClose })}
        onCancel={onClose}
        timerSeconds={300}
        onTimerEnd={onClose}
        submitLabel="Invia"
        cancelLabel="Annulla"
      />
    </div>
  );
}

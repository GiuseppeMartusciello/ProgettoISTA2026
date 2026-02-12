import { Loader, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { useSetup2FAMutation } from "../hooks/use-setup2fa.mutation";
import { Setup2faResponse } from "../types/setup2fa.response";
import { OtpInputForm } from "./OtpInputForm";
import { useConfirm2FAMutation } from "../hooks/use-confirm2fa.mutation";
import styles from "../styles/setup2fa.module.css";

type Setup2FAProps = {
  onClose: () => void;
};

export function Setup2FA({ onClose }: Setup2FAProps) {
  const { mutate: setup2FA} = useSetup2FAMutation();
  const { mutate: confirm2FA, isError } = useConfirm2FAMutation();

  const [qrCode, setQrCode] = useState("");
  // const [secret, setSecret] = useState("");

  useEffect(() => {
    setup2FA(undefined, {
      onSuccess: (response: Setup2faResponse) => {
        console.log({ response });
        setQrCode(response.qrPngBase64 || "");
        // setSecret(response.otpauthUrl || "");
      },
    });
  }, []);

  return (
    <div className={styles.container}>
      <Title order={3} mb="md">
        Abilitazione autenticazione a due fattori
      </Title>
      <div>
        <Text mb="md">
          Scannerizza il codice QR con la tua app di autenticazione (es. Google
          Authenticator) e inserisci il codice OTP generato per abilitare 2FA.
        </Text>
      </div>

      <div className={styles.qrCodeContainer}>
        {qrCode ? (
          <img
            style={{ width: "100%", height: "auto" }}
            src={qrCode}
            alt="QR Code"
          />
        ) : (
          <Loader size={"xl"} />
        )}
      </div>

      {/* <Divider my="lg" fw={700} /> */}

      {isError && (
        <p style={{ color: "red", fontWeight: 500 }}>
          Codice OTP inserito non valido. <br /> Riprova.
        </p>
      )}

      <OtpInputForm
        onSubmit={(otp) => confirm2FA({ otp }, { onSuccess: onClose })}
        onCancel={onClose}
        timerSeconds={300}
        onTimerEnd={onClose}
        submitLabel="Invia"
        cancelLabel="Annulla"
      />

      {/* <div style={{ marginTop: "2rem" }}>
        <button onClick={onClose} className="button">
          Chiudi
        </button>
      </div> */}
    </div>
  );
}

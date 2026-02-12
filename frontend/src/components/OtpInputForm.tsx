import { useState, useEffect } from "react";
import { Group, TextInput } from "@mantine/core";
import styles from "../styles/otpInputForm.module.css";

interface OtpInputFormProps {
  onSubmit: (otp: string) => void;
  onCancel?: () => void;
  loading?: boolean;
  timerSeconds?: number;
  onTimerEnd?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

export function OtpInputForm({
  onSubmit,
  onCancel,
  loading = false,
  timerSeconds = 300,
  onTimerEnd,
  submitLabel = "Invia",
  cancelLabel = "Annulla",
}: OtpInputFormProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(timerSeconds);

  useEffect(() => {
    if (timer === 0) {
      onTimerEnd && onTimerEnd();
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, onTimerEnd]);

  const handleChange = (index: number, value: string, event?: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/\d/.test(value) && value !== "") return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // solo l'ultima cifra
    setOtp(newOtp);
    // Focus automatico sul prossimo input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
    // Gestione delete/backspace
    if (event && event.key === "Backspace" && !value && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) (prevInput as HTMLInputElement).focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(otp.join(""));
  };

  const handleCancel = () => {
    setOtp(["", "", "", "", "", ""]);
    onCancel && onCancel();
  };

  const minutes = String(Math.floor(timer / 60)).padStart(2, "0");
  const seconds = String(timer % 60).padStart(2, "0");

  return (
    <form onSubmit={handleSubmit} className={styles.otpContainer}>
      <Group mb={16}>
        {otp.map((digit, idx) => (
          <TextInput
            key={idx}
            id={`otp-input-${idx}`}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleChange(idx, otp[idx], e)}
            maxLength={1}
            inputMode="numeric"
            size="lg"
            radius="md"
            style={{
              width: 48,
              textAlign: "center",
              fontSize: 28,
              letterSpacing: 2,
            }}
            autoFocus={idx === 0}
          />
        ))}
      </Group>
      <div style={{ fontSize: 18, color: timer < 60 ? "red" : "var(--primary-text-color)", marginBottom: 16 }}>
        Tempo rimasto: {minutes}:{seconds}
      </div>
      <Group grow>
        <button
          type="submit"
          className="button"
          disabled={otp.some((d) => d === "") || loading}
        >
          {submitLabel}
        </button>
        <button
          type="button"
          className="button btnSecondary"
          onClick={handleCancel}
          disabled={loading}
        >
          {cancelLabel}
        </button>
      </Group>
    </form>
  );
}

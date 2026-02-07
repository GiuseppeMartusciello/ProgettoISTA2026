import React, { useCallback } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Space,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import styles from "../styles/addMedicalExaminationModal.module.css";
import { toast } from "react-toastify";
import { useAddMedicalExamination } from "../hooks/use-add-medical-examination.mutation";

type AddVisitModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reservationId: string | undefined;
};

const AddVisitModal: React.FC<AddVisitModalProps> = ({
  opened,
  onClose,
  onSuccess,
  reservationId,
}) => {
  // Post della visita
  const mutation = useAddMedicalExamination(() => {
    onClose();
    onSuccess();
  });

  const form = useForm({
    initialValues: {
      note: "",
      motivation: "",
    },
  });

  const handleSubmit = useCallback(() => {
    if (!reservationId) {
      toast.error("Nessuna prenotazione selezionata");

      return;
    }

    mutation.mutate({
      medicalExamination: form.values,
      reservationId: reservationId,
    });
  }, [mutation, reservationId]);

  const handleClose = useCallback(() => {
    onClose();
    form.reset();
  }, []);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<ModalTitle />}
      size="auto"
      radius="md"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      centered
    >
      <div className={styles.container}>
        <form
          onSubmit={form.onSubmit(() => {
            console.log("Ciao");
          })}
        >
          <TextInput
            size="lg"
            {...form.getInputProps("motivation")}
            placeholder="Inserisci la motivazione della visita"
            w={"400px"}
            style={{ marginBottom: "1rem" }}
            required
          />

          <Space h={"md"} />

          <Textarea
            size="lg"
            {...form.getInputProps("note")}
            placeholder="Inserisci le note della visita"
            w={"400px"}
            style={{ marginBottom: "1rem" }}
            required
          />

          <Space h={"md"} />

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "center",
            }}
          >
            <Button
              loading={mutation.isPending}
              className="button"
              onClick={() => {
                handleSubmit();
              }}
            >
              Aggiungi
            </Button>
            <Button
              onClick={onClose}
              disabled={mutation.isPending}
              className="button"
            >
              Annulla
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddVisitModal;

function ModalTitle() {
  return (
    <div className={styles.title}>
      <Title order={1}>Aggiungi visita medica</Title>
    </div>
  );
}

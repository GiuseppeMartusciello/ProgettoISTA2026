import {
  Button,
  Radio,
  Group,
  Stack,
  Text,
  Alert,
  Loader,
  TextInput,
  SimpleGrid,
} from "@mantine/core";
import { useEffect, useState } from "react";
import PatientSelect from "./PatientSelect";
import { PatientItem } from "../types/patient.interface";
import {
  useIsFirstVisit,
  useSlots,
  useCreateReservationForPatient,
} from "../hooks/use-reservation-mutations";
import { VisitTypeEnum } from "../api/reservations";
import { notifications } from "@mantine/notifications";

export default function AddMedicalReservationForm({handleClose}: {handleClose: () => void}) {
  const [patient, setPatient] = useState<PatientItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visitType, setVisitType] = useState<VisitTypeEnum | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  

  // Query to check if it's the first visit
  const { data: firstVisitData, isLoading: isLoadingFirstVisit } =
    useIsFirstVisit(patient?.id);

  // Query to fetch available slots
  const {
    data: slots,
    isLoading: isLoadingSlots,
    error: slotsError,
  } = useSlots(
    selectedDate ? selectedDate.toISOString().split("T")[0] : null,
    visitType
  );

  // Mutation to create reservation
  const createReservation = useCreateReservationForPatient();

  // Reset visit type when first visit data changes
  useEffect(() => {
    if (firstVisitData?.isFirstVisit) {
      setVisitType(VisitTypeEnum.FIRST);
    } else {
      setVisitType(VisitTypeEnum.CONTROL);
    }
  }, [firstVisitData]);

  // Reset selected slot when date or visit type changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate, visitType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patient || !selectedDate || !visitType || !selectedSlot) {
      notifications.show({
        title: "Errore",
        message: "Compila tutti i campi richiesti",
        color: "red",
      });
      return;
    }

    const selectedSlotData = slots?.find(
      (slot) => slot.startTime === selectedSlot
    );

    if (!selectedSlotData) {
      notifications.show({
        title: "Errore",
        message: "Slot selezionato non valido",
        color: "red",
      });
      return;
    }

    try {
      await createReservation.mutateAsync({
        patientId: patient.id,
        startTime: selectedSlotData.startTime,
        endTime: selectedSlotData.endTime,
        visitType: visitType,
      });

      notifications.show({
        title: "Successo",
        message: "Prenotazione creata con successo",
        color: "green",
      });

      // Reset form
      setPatient(null);
      setSelectedDate(null);
      setVisitType(null);
      setSelectedSlot(null);

      handleClose();
    } catch (error) {

      notifications.show({
        title: "Errore",
        message: "Errore nella creazione della prenotazione",
        color: "red",
      });
    }
    
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: "0 auto" }}>
      <Stack gap="md">
        <PatientSelect
          value={patient}
          onChange={(patient) => {
            console.log("Selected patient:", patient);
            setPatient(patient);
          }}
        />

        <TextInput
          label="Data della visita"
          placeholder="Seleziona una data"
          type="date"
          value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
          onChange={(event) => {
            const dateString = event.currentTarget.value;
            setSelectedDate(dateString ? new Date(dateString) : null);
          }}
        //   min={new Date().toISOString().split('T')[0]}
          required
        />

        {isLoadingFirstVisit ? (
          <Group>
            <Loader size="sm" />
            <Text size="sm">Caricamento tipologie di visita...</Text>
          </Group>
        ) : (
          <Radio.Group
            label="Tipologia di visita"
            value={visitType || ""}
            onChange={(value) => setVisitType(value as VisitTypeEnum)}
            required
          >
            <Stack mt="xs" gap="xs">
              <Radio
                value={VisitTypeEnum.FIRST}
                label="Prima visita"
                disabled={!firstVisitData?.isFirstVisit}
                color="var(--accent-primary)"
              />
              <Radio
                value={VisitTypeEnum.CONTROL}
                label="Visita di controllo"
                disabled={firstVisitData?.isFirstVisit}
                color="var(--accent-primary)"
              />
            </Stack>
          </Radio.Group>
        )}

        {firstVisitData?.isFirstVisit && (
          <Alert color="blue" title="Informazione">
            Questo paziente non ha ancora effettuato la prima visita. È
            possibile prenotare solo una prima visita.
          </Alert>
        )}

        {selectedDate && visitType && (
          <>
            {isLoadingSlots ? (
              <Group>
                <Loader size="sm" />
                <Text size="sm">Caricamento slot disponibili...</Text>
              </Group>
            ) : slotsError ? (
              <Alert color="red" title="Errore">
                Errore nel caricamento degli slot disponibili
              </Alert>
            ) : slots && slots.length > 0 ? (
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Slot disponibili
                </Text>
                <SimpleGrid cols={3} spacing="sm">
                  {slots.map((slot) => {
                    const timeLabel = `${new Date(slot.startTime).toLocaleTimeString(
                      "it-IT",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )} - ${new Date(slot.endTime).toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`;
                    
                    const isSelected = selectedSlot === slot.startTime;
                    
                    return (
                      <Button
                        key={slot.startTime}
                        variant={isSelected ? "filled" : "light"}
                        color={isSelected ? "var(--accent-primary)" : "gray"}
                        onClick={() => setSelectedSlot(slot.startTime)}
                        style={{
                          transition: "all 0.2s ease",
                        }}
                        styles={{
                          root: {
                            height: "auto",
                            padding: "12px",
                          },
                          label: {
                            whiteSpace: "normal",
                            textAlign: "center",
                          },
                        }}
                      >
                        {timeLabel}
                      </Button>
                    );
                  })}
                </SimpleGrid>
              </Stack>
            ) : (
              <Alert color="yellow" title="Nessuno slot disponibile">
                Non ci sono slot disponibili per la data e la tipologia
                selezionate
              </Alert>
            )}
          </>
        )}

        <Button
          type="submit"
          loading={createReservation.isPending}
          disabled={!patient || !selectedDate || !visitType || !selectedSlot}
          mt="md"
          color="var(--accent-primary)"
        >
          Crea prenotazione
        </Button>
      </Stack>
    </form>
  );
}
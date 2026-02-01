import React, { useEffect, useRef } from "react";
import { EventWrapperProps } from "react-big-calendar";
import {
  Box,
  Button,
  Divider,
  Popover,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  Calendar1Icon,
  ClipboardPlus,
  Info,
  Mars,
  Venus,
  NonBinary,
  UserIcon,
  Icon,
  CirclePlus,
} from "lucide-react";

import { ReservationCalendarEvent } from "../types/reservation-calendar-events";
import styles from "../styles/calendar.module.css";
import { useNavigate } from "react-router-dom";
import { usePatchReservationMutation } from "../hooks/use-patch-reservation.mutation";
import { useClickOutside, useDisclosure } from "@mantine/hooks";
import { useAddMedicalExamination } from "../hooks/use-add-medical-examination.mutation";
import AddVisitModal from "./AddMedicalExaminationModal";

interface Props extends EventWrapperProps<ReservationCalendarEvent> {
  selectedEvent: ReservationCalendarEvent | undefined;
  setSelectedEvent: (event: ReservationCalendarEvent | undefined) => void;
  children?: React.ReactNode;
}

export const EventWrapperWithPopover: React.FC<Props> = ({
  event,
  children,
  selectedEvent,
  setSelectedEvent,
}) => {
  const [opened, handler] = useDisclosure(false);

  const mutation = usePatchReservationMutation();
  const isOpen = selectedEvent === event && !opened;
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedEvent(isOpen ? undefined : event);
  };

  const handlePopoverClick = (e: React.MouseEvent) => {
    // Impedisci che i click all'interno del popover si propaghino al calendario
    e.stopPropagation();
    e.preventDefault();
  };

  if (!React.isValidElement(children)) return <>{children}</>;

  const cloned = React.cloneElement(children as React.ReactElement<any>, {
    onClick: handleClick,
    style: {
      ...(children as React.ReactElement<any>).props.style,
      cursor: "pointer",
      position: "relative",
    },
  });

  const popoverRef = useClickOutside(() => {
    console.log("Ciao bello ");
    setSelectedEvent(undefined);
  });

  useEffect(() => {
    console.log("Booleani: ", "IsOpen", isOpen, " OpenedModal", opened);
  }, [opened, isOpen]);

  return (
    <div>
      <Popover
        opened={isOpen}
        onClose={
          () => {}
          // setSelectedEvent(undefined)
        }
        withArrow
        trapFocus={false}
        position="bottom"
        withinPortal={true}
        offset={5}
        width={300}
      >
        <Popover.Target>{cloned}</Popover.Target>
        <Popover.Dropdown onClick={handlePopoverClick}>
          <div ref={popoverRef}>
            <div className={styles.headerPopover}>
              <Title order={4} className={styles.title}>
                Info prenotazione
              </Title>

              <Tooltip label="Inserisci report visita medica">
                <Button
                  onClick={() => {
                    console.log("Button clicked, opening modal");
                    // handler.open();
                    setTimeout(() => handler.open(), 0);
                  }}
                  variant="subtle"
                  size="xs"
                >
                  <CirclePlus size={16} />
                </Button>
              </Tooltip>
            </div>

            <div className={styles.infoPopover}>
              <div>
                <Text fw={900}>
                  Tipo di visita <ClipboardPlus size={15} />
                </Text>
                {selectedEvent?.visitType === "CONTROL"
                  ? "Controllo"
                  : "Prima visita"}
              </div>
              <Text>
                Data creazione <Calendar1Icon size={15} />
                {selectedEvent?.createdAt
                  ? new Date(selectedEvent.createdAt).toLocaleDateString(
                      "it-IT",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  : "—"}
              </Text>
              {/* <Text fw={900}>
              Stato <Calendar1Icon size={15} />
            </Text>
            {selectedEvent?.status} {selectedEvent?.id} */}
              <Divider my={"sm"} />
              <div className={styles.infoPatient}>
                <div className={styles.headerPopover}>
                  <Title order={5}>
                    Paziente <UserIcon size={15} />
                  </Title>
                  <Tooltip label="Vedi dettagli paziente">
                    <Button
                      onClick={() =>
                        navigate(`/patients/${selectedEvent?.patient.id}`)
                      }
                      variant="subtle"
                      size="xs"
                    >
                      <Info size={14} />
                    </Button>
                  </Tooltip>
                </div>
                {selectedEvent?.patient.name} {selectedEvent?.patient.surname}{" "}
                {selectedEvent?.patient.gender === "Uomo" && <Mars size={14} />}
                {selectedEvent?.patient.gender === "Donna" && (
                  <Venus size={14} />
                )}
                {selectedEvent?.patient.gender !== "Uomo" &&
                  selectedEvent?.patient.gender !== "Donna" && (
                    <NonBinary size={14} />
                  )}
                <Text>{selectedEvent?.patient.cf}</Text>
                {selectedEvent && selectedEvent?.status === "PENDING" && (
                  <>
                    <Divider my={"sm"} />
                    <div className={styles.choose}>
                      <Button
                        className={styles.confirm}
                        onClick={() =>
                          mutation.mutate({
                            reservationId: selectedEvent!!.id,
                            status: "confirm",
                          })
                        }
                      >
                        Conferma
                      </Button>
                      <Button
                        className={styles.decline}
                        onClick={() =>
                          mutation.mutate({
                            reservationId: selectedEvent!!.id,
                            status: "decline",
                          })
                        }
                      >
                        Rifiuta
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Popover.Dropdown>
      </Popover>

      <AddVisitModal
        onClose={() => {
          handler.close();
          // setSelectedEvent(undefined);
        }}
        onSuccess={() => {
          handler.close();
          // setSelectedEvent(undefined);
        }}
        opened={opened}
        reservationId={selectedEvent?.id}
      />
    </div>
  );
};

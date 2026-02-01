import { Avatar, Button, Group, Loader, Space, Text } from "@mantine/core";
import styles from "../styles/reservationRequestCard.module.css";
import { ReservationsDTO } from "../types/reservation";
import { Calendar1, Check, Clock, Stethoscope, X } from "lucide-react";
import { formatDate, formatTime } from "../utils/calendar";

interface RequestCardType {
  reservation: ReservationsDTO;
  onAccept: (params: {
    reservationId: string;
    status: "confirm" | "decline";
  }) => void;
  onDecline: (params: {
    reservationId: string;
    status: "confirm" | "decline";
  }) => void;
  isLoading: boolean;
}

const ReservationRequestCard = ({
  reservation,
  onAccept,
  onDecline,
  isLoading,
}: RequestCardType) => {
  if (isLoading) return <Loader size="lg" />;

  return (
    <div className={styles.container} key={reservation.id}>
      <div className={styles.header}>
        <div className={styles.left}>
          <Avatar
            color={`${
              reservation.patient.gender === "Uomo"
                ? "cyan"
                : reservation.patient.gender === "Donna"
                ? "pink"
                : "gray"
            }`}
          >
            {`${reservation.patient.name[0].toUpperCase()}${reservation.patient.surname[0].toUpperCase()} `}
          </Avatar>
          <Space w={"md"} />
          <div>
            <Text
              fw={800}
            >{`${reservation.patient.name} ${reservation.patient.surname}`}</Text>
            <Text size={"sm"}>{reservation.patient.cf}</Text>
          </div>
        </div>
        <div className={styles.right}>
          <Text
            size="xs"
            style={{
              color: "#B45309", // Testo marrone scuro
              backgroundColor: "#FEF3C7", // Sfondo giallo chiaro
              border: "1px solid #F59E0B", // Bordo arancione
              borderRadius: "8px",
              padding: "4px 8px 4px 30px",
              fontWeight: 500,
              width: "120px",
            }}
          >
            IN ATTESA
          </Text>
        </div>
      </div>
      <div
        style={{
          paddingTop: "16px",
          paddingLeft: "12px",
          display: "flex",
          justifyContent: "flex-start",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <Text component="div" style={{ display: "flex", alignItems: "center" }}>
          <>
            <Stethoscope size={15} color="var(--accent-primary)" />
            <Space w={"md"} />
            <Text>
              {reservation.visitType === "FIRST_VISIT"
                ? "Prima visita"
                : "Visita di controllo"}
            </Text>
          </>
        </Text>
        <Text component="div" style={{ display: "flex", alignItems: "center" }}>
          <>
            <Clock color="green" size={15} />
            <Space w={"md"} />
            <Text>{`${formatTime(reservation.startTime)} - ${formatTime(
              reservation.endTime
            )}
            `}</Text>
          </>
        </Text>
        <Text component="div" style={{ display: "flex", alignItems: "center" }}>
          <>
            <Calendar1 color="var(--text-primary)" size={15} />
            <Space w={"md"} />
            <Text>{`Richiesta il ${formatDate(reservation.createdAt)}
            `}</Text>
          </>
        </Text>
      </div>
      <Group justify="flex-end">
        <Button
          color="green"
          w={50}
          onClick={() =>
            onAccept({ reservationId: reservation.id, status: "confirm" })
          }
        >
          {<Check size={18} />}
        </Button>
        <Button
          // variant="light"
          w={50}
          color="red"
          onClick={() =>
            onDecline({ reservationId: reservation.id, status: "decline" })
          }
        >
          {<X size={18} />}
        </Button>
      </Group>
    </div>
  );
};

export default ReservationRequestCard;

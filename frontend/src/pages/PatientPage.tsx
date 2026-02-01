import { useNavigate, useParams } from "react-router-dom";
import { usePatient } from "../hooks/use-patients";
import {
  Accordion,
  Avatar,
  Box,
  Button,
  Divider,
  Loader,
  Modal,
  Paper,
  Space,
  Title,
} from "@mantine/core";
import { IconPhone, IconQrcode, IconUser } from "@tabler/icons-react";
import styles from "../styles/PatientPage.module.css";

import InfoCard from "../components/InfoCard";
import {
  Accessibility,
  Activity,
  Building2,
  CirclePlus,
  Droplet,
  FileText,
  HeartPulse,
  Hospital,
  House,
  Icon,
  IdCard,
  Mail,
  MapPin,
  Medal,
  Pill,
  Ruler,
  Scale,
  Stethoscope,
  VenusAndMars,
} from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import QRCode from "react-qr-code";
import BackButton from "../components/BackButton";
import MedicalDetections from "../components/MedicalDetections";
import MedicalExaminations from "../components/MedicalExaminations";

export default function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  console.log("Id pazient: ", id);
  if (!id) {
    return <div>Errore nel Caricamento...</div>;
  }

  const [opened, handler] = useDisclosure(false);

  const { data: patient, isLoading, isError } = usePatient(id);

  if (isLoading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh", // occupa tutto lo schermo
        }}
      >
        <Loader size="xl" />
      </div>
    );

  if (isError || !patient) return <div>Errore nel Caricamento.. </div>;

  console.log("Paziente: ", patient);

  // const items = [
  //   <Accordion.Item key={patient.id} value="Rilevazioni mediche">
  //     <Accordion.Control icon={<Activity size={24} />}>
  //       <Title order={4} mt="xl" mb="sm">
  //         Rilevazioni parametri{" "}
  //       </Title>{" "}
  //     </Accordion.Control>
  //     <Accordion.Panel>
  //       <MedicalDetections patientId={patient?.id} />
  //     </Accordion.Panel>
  //   </Accordion.Item>,
  //   // <Accordion.Item key={2} value="Visite mediche">
  //   //   <Accordion.Control icon={<Hospital size={24} />}>
  //   //     <Title order={4} mt="xl" mb="sm">
  //   //       Visite mediche{" "}
  //   //     </Title>{" "}
  //   //   </Accordion.Control>
  //   //   <Accordion.Panel>
  //   //     <LazyMedicalExaminations patientId={patient.id} />
  //   //   </Accordion.Panel>
  //   // </Accordion.Item>,
  // ];

  return (
    <div className={styles.container}>
      <Paper radius="md" p="md" className={styles.header}>
        <BackButton position="static" path="/patients" />
        <div className={styles.profileHeader}>
          <Avatar
            size={120}
            radius="xl"
            color="var(--accent-primary)"
            className={styles.avatar}
          >
            <IconUser size={80} />
          </Avatar>
          <div className={styles.nameSection}>
            <Title order={2} fw={700}>
              {patient.user.name} {patient.user.surname}
            </Title>

            <div className={styles.buttonSection}>
              {patient.user.inviteId ? (
                <>
                  <Button
                    leftSection={<IconQrcode size={16} />}
                    onClick={handler.open}
                    mt="xs"
                    className="button"
                  >
                    QR di invito
                  </Button>

                  <Space w={"sm"} />
                </>
              ) : (
                <Button
                  leftSection={<CirclePlus size={16} />}
                  onClick={() => navigate(`/add-examination/${patient.id}`)}
                  mt="xs"
                  className="button"
                >
                  Aggiungi visita
                </Button>
              )}
            </div>
          </div>
        </div>
        <Title order={3} mt="xl" mb="sm">
          Informazioni personali{" "}
        </Title>
        <Divider mb="md" />
        <div className={styles.userInfoGrid}>
          <InfoCard
            value={patient.user.cf}
            icon={<IdCard />}
            label="Codice Fiscale"
          />
          <InfoCard value={patient.user.email} icon={<Mail />} label="Email" />
          <InfoCard
            value={patient.user.phone}
            icon={<IconPhone />}
            label="Telefono"
          />
          <InfoCard
            value={patient.user.gender}
            icon={<VenusAndMars />}
            label="Genere"
          />
          <InfoCard
            value={patient.user.address}
            icon={<House />}
            label="Indirizzo"
          />
          <InfoCard
            value={patient.user.city}
            icon={<Building2 />}
            label="Città"
          />
          <InfoCard value={patient.user.cap} icon={<MapPin />} label="CAP" />
        </div>
        <Title order={3} mt="xl" mb="sm">
          Informazioni mediche{" "}
        </Title>
        <Divider mb="md" />
        <div className={styles.medicalInfo}>
          <InfoCard
            value={String(patient.weight)}
            icon={<Scale />}
            label="Peso kg"
          />
          <InfoCard
            value={String(patient.height)}
            icon={<Ruler />}
            label="Altezza cm"
          />
          <InfoCard
            value={patient.bloodType}
            icon={<Droplet />}
            label="Gruppo sanguigno"
          />
          <InfoCard value={patient.sport} icon={<HeartPulse />} label="Sport" />
          <InfoCard
            value={patient.level}
            icon={<Medal />}
            label="Livello sportivo"
          />

          {patient.medications.length > 0 && (
            <InfoCard
              value={patient.medications}
              icon={<Pill />}
              label="Farmaci"
            />
          )}

          {patient.injuries.length > 0 && (
            <InfoCard
              value={patient.injuries}
              icon={<Accessibility />}
              label="Infortuni"
            />
          )}

          {patient.pathologies.length > 0 && (
            <InfoCard
              value={patient.pathologies}
              icon={<Stethoscope />}
              label="Patologie"
            />
          )}
        </div>
        <Modal
          opened={opened}
          onClose={handler.close}
          title={null} // titolo custom dentro il body
          size="auto"
          radius="md"
          overlayProps={{
            backgroundOpacity: 0.55,
            blur: 3,
          }}
          centered
        >
          <div style={{ textAlign: "center", padding: "1.5rem" }}>
            <h2
              style={{
                marginBottom: "0.5rem",
                fontSize: "1.5rem",
                color: "var(--text-primary)",
              }}
            >
              QR Code per la registrazione
            </h2>
            <p
              style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}
            >
              Scansiona questo codice per completare la registrazione del
              paziente.
            </p>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                display: "inline-block",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              <QRCode
                value={String(patient.user.inviteId)}
                level="L"
                size={300}
              />
            </div>

            <div style={{ marginTop: "2rem" }}>
              <button onClick={handler.close} className="button">
                Chiudi
              </button>
            </div>
          </div>
        </Modal>
        <Title order={3} mt="xl" mb="sm">
          Altro{" "}
        </Title>
        <Divider mb="md" />
        <Title order={4} mt="xl" mb="sm">
          Visite mediche{" "}
        </Title>{" "}
        <MedicalExaminations patientId={patient.id} />
        {/* <Accordion variant="separated" radius={"md"} multiple>
          {items}
        </Accordion> */}
      </Paper>
    </div>
  );
}

// const LazyMedicalExaminations = ({ patientId }: { patientId: string }) => {
//   console.log("LazyMedicalExaminations rendered with patientId:", patientId);
//   return <MedicalExaminations patientId={patientId} />;
// };

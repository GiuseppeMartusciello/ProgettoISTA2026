import { Avatar, Divider, Loader, Paper, Text, Title } from "@mantine/core";
import { useDoctor } from "../hooks/useDoctor";
import styles from "../styles/doctorPage.module.css";
import InfoCard from "../components/InfoCard";
import {
  BookUser,
  Building2,
  House,
  IdCard,
  Mail,
  MapPin,
  MapPinHouse,
  VenusAndMars,
} from "lucide-react";
import { IconPhone } from "@tabler/icons-react";
import BackButton from "../components/BackButton";
export default function DoctorInfo() {
  const { data: doctor, isLoading, isError } = useDoctor();

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

  if (isError || !doctor)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh", // occupa tutto lo schermo
        }}
      >
        <Text size="xl">Errore nel recupero dei dati</Text>
      </div>
    );

  return (
    <div className={styles.container}>
      <Paper radius="md" p="md">
        <BackButton position="static" />

        {/* Intestazione profilo */}
        <div className={styles.profileHeader}>
          <Avatar
            size={150}
            color={`${
              doctor.user.gender === "Uomo"
                ? "cyan"
                : doctor.user.gender === "Donna"
                ? "pink"
                : "gray"
            }`}
            className={styles.avatar}
          >
            {`${doctor.user?.name[0].toUpperCase()}${doctor.user?.surname[0].toUpperCase()} `}
          </Avatar>

          <div className={styles.nameSection}>
            <Title order={2} fw={700}>
              Dr. {doctor.user.name} {doctor.user.surname}
            </Title>
            <Text size="md" c="dimmed" fw={500}>
              {doctor.specialization}
            </Text>
            <Text size="sm" c="gray">
              {doctor.medicalOffice}
            </Text>
          </div>
        </div>

        <Title order={4} className={styles.sectionTitle}>
          Informazioni personali
        </Title>
        <Divider mb="sm" />
        <div className={styles.grid}>
          <InfoCard
            value={doctor.user.cf}
            icon={<IdCard />}
            label="Codice Fiscale"
          />
          <InfoCard value={doctor.user.email} icon={<Mail />} label="Email" />
          <InfoCard
            value={doctor.user.phone}
            icon={<IconPhone />}
            label="Telefono"
          />
          <InfoCard
            value={doctor.user.gender}
            icon={<VenusAndMars />}
            label="Genere"
          />
          <InfoCard
            value={doctor.user.address}
            icon={<House />}
            label="Indirizzo"
          />
          <InfoCard
            value={doctor.user.city}
            icon={<Building2 />}
            label="Città"
          />
          <InfoCard value={doctor.user.cap} icon={<MapPin />} label="CAP" />
        </div>

        {/* Sezione info professionali */}
        <Title order={4} mt="xl" className={styles.sectionTitle}>
          Informazioni professionali
        </Title>
        <Divider mb="sm" />
        <div className={styles.grid}>
          <InfoCard
            value={doctor.medicalOffice}
            icon={<MapPinHouse />}
            label="Ufficio medico"
          />
          <InfoCard
            value={doctor.registrationNumber}
            icon={<BookUser />}
            label="Numero di registrazione"
          />
          <InfoCard
            value={doctor.orderType}
            icon={<BookUser />}
            label="Tipo di ordine"
          />
          <InfoCard
            value={doctor.orderProvince}
            icon={<BookUser />}
            label="Provincia ordine"
          />
          <InfoCard
            value={doctor.orderDate}
            icon={<BookUser />}
            label="Data registrazione ordine"
          />
        </div>
      </Paper>
    </div>
  );
}

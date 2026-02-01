import PatientsTable from "../components/patients-table";
import styles from "../styles/PatientPage.module.css";

export default function PatientsPage() {
  return (
    <div className={styles.container}>
      <PatientsTable />
    </div>
  );
}

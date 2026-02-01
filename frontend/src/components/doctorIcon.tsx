import { useNavigate } from "react-router-dom";
import styles from "../styles/doctorIcon.module.css";

export default function DoctorIcon() {
  const navigate = useNavigate();

  const onClick = () => navigate("/doctorPage");

  return (
    <div onClick={onClick}>
      <img src="logo2.svg" className={styles.icon} alt="Doctor logo" />
    </div>
  );
}

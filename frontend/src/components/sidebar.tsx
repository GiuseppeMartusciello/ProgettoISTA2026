import { CalendarPlus2, NotebookPen, UserPlus } from "lucide-react";
import { usePatients } from "../hooks/use-patients";
import styles from "../styles/sidebar.module.css";

import { IconUsers, IconClipboardList } from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useReservationCounts } from "../hooks/use-reservations";
import { NavItem } from "../utils/navbar.utils";




const SideBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = usePatients();
  const { data: counts } = useReservationCounts();

  const navItems = [
    {
      icon: <IconUsers size={25} />,
      label: "Pazienti",
      path: "/patients",
      badge: `${data?.total ? data.total : ""} `,
    },
    {
      icon: <UserPlus size={25} />,
      label: "Aggiungi paziente",
      path: "/add-patient",
    },
    {
      icon: <CalendarPlus2 size={25} />,
      label: "Calendario disponibiltà",
      path: "/availability",
    },
    {
      icon: <IconClipboardList size={25} />,
      label: "Calendario prenotazioni",
      path: "/reservations",
    },
    {
      icon: <NotebookPen size={25} />,
      label: "Richieste prenotazioni",
      path: "/reservartions/requests",
      badge: `${counts?.total ? counts.total : ""} `,
    },

    // {
    //   icon: <IconSettings size={25} />,
    //   label: "Impostazioni",
    //   path: "/settings",
    // },
  ];

  return (
    <div className={styles.sidebar}>
      <nav className={styles.navbar}>
        <div className={styles.navTop}>
          <h3 className={styles.navTitle}>Navigazione</h3>
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              {...item}
              active={location.pathname === item.path}
              onClick={() => navigate({ pathname: item.path, search: "", }, { replace: true })}
            />
          ))}
        </div>
      </nav>
    </div>
  );
};

export default SideBar;

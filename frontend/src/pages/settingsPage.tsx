import {  Divider } from "@mantine/core";
import styles from "../styles/settingsPage.module.css";
import { Fingerprint } from "lucide-react";
import { NavItem } from "../utils/navbar.utils";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { Settings } from 'lucide-react';


export function SettingsPage() {

  const navigate = useNavigate(); 
  const location = useLocation();


  
  const navItems = [
    {
      icon: <Fingerprint size={25} />,
      label: "Autenticazione a due fattori",
      path: "/settings/two-factor-auth",
      badge: undefined
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Settings size={40} color="var(--text-primary)"  />
        
        <h1
          style={{
            color: "var(--text-primary)",
            fontWeight: 700,
            fontSize: 32,
            paddingLeft: 6
          }}
        >
          Impostazioni
        </h1>
      </div>

      <div className={styles.mainContent}>
        <nav className={styles.sidebar}>
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              {...item}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>

        <Divider orientation="vertical" style={{ height: "auto" }} />

        <Outlet />
      </div>
    </div>
  );
}
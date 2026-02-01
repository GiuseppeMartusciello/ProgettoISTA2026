import { Outlet } from "react-router-dom";
import { NavBar } from "./navbar";
import SideBar from "./sidebar";

import styles from "../styles/layout.module.css";

const Layout = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <NavBar />
      </div>

      <div className={styles.main}>
        <div className={styles.sideBar}>
          <SideBar />
        </div>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

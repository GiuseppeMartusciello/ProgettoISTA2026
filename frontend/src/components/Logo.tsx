import styles from "../styles/Logo.module.css";

export default function Logo({ dimension = "small" }) {
  const sizeClass = dimension === "big" ? styles.logoBig : styles.logoSmall;
  const containerSizeClass =
    dimension === "big" ? styles.containerBig : styles.containerSmall;

  return (
    <div className={`${styles.container} ${containerSizeClass}`}>
      <img
        className={`${styles.logo} ${sizeClass}`}
        src="/logov2.svg"
        alt="Logo di SymbioCare"
      />

      {/* <h1 className={styles.title}>SymbioCare</h1> */}
    </div>
  );
}

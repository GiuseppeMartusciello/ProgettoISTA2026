import { useDisclosure } from "@mantine/hooks";
import { useUser } from "../context/UserContext";
import styles from "../styles/auth2fasettings.module.css";
import { useCallback } from "react";
import { Modal, Text, Space } from "@mantine/core";

import { Setup2FA } from "./setup2fa";
import { Disable2FA } from "./disable2fa";

export function TwoFactorAuthSettings() {
    const { user } = useUser();

    const isEnabled2fa = user?.twoFactorEnabled;

    const [openedSetup, handlerSetup] = useDisclosure(false);

    const [openedDisable, handlerDisable] = useDisclosure(false);


    // const handleTimerEnd = () => {
    //   navigate("/login", { replace: true });
    // };

    const toggle = useCallback(() => {
      if (isEnabled2fa) {
        handlerDisable.toggle();
      } else {
        handlerSetup.toggle();
      }
    }, [isEnabled2fa, handlerDisable, handlerSetup]);




  return (
    <div className={styles.container}>
      <h2>Autenticazione a Due Fattori</h2>
      <Text>
        L'autenticazione a due fattori (2FA) aggiunge un ulteriore livello di
        sicurezza al tuo account.
      </Text>

      <div>
        <Text fw={700} span>
          Status:
          <span
            style={{ fontWeight: 600, marginLeft: 8 }}
            className={isEnabled2fa ? styles.enabled : styles.disabled}
          >
            {isEnabled2fa ? "Abilitata" : "Disabilitata"}
          </span>
        </Text>
      </div>

      <Space h={16} />
      <button
        className="button"
        onClick={() => {
          toggle();
          console.log({ openedSetup, openedDisable });
        }}
      >
        {isEnabled2fa ? "Disabilita 2FA" : "Abilita 2FA"}
      </button>

      {openedSetup && (
        <Modal
        
          closeOnClickOutside={false}
          opened={openedSetup}
          onClose={handlerSetup.close}
          centered
          size="lg"
          radius="lg"
          overlayProps={{
            backgroundOpacity: 0.55,
            blur: 3,
          }}
          withCloseButton={false}
        >
          <Setup2FA
            onClose={() => {
              handlerSetup.close();
            }}
          ></Setup2FA>
        </Modal>
      )}

      {openedDisable && (
        <Modal
          closeOnClickOutside={false}
          opened={openedDisable}
          onClose={handlerDisable.close}
          centered
          size="md"
          radius="lg"
          overlayProps={{
            backgroundOpacity: 0.55,
            blur: 3,
          }}
          withCloseButton={false}
        >
          <Disable2FA
            onClose={() => {
              handlerDisable.close();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
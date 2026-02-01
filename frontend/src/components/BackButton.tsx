import { FC, useCallback } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

type BackButtonProps = {
  position?: "absolute" | "static";
  path: string | undefined;
};

const BackButton: FC<BackButtonProps> = ({
  position = "absolute",
  path = undefined,
}) => {
  const navigate = useNavigate();

  const sharedStyle: React.CSSProperties = {
    color: "var(--text-muted)",
    background: "transparent",
    cursor: "pointer",
    transition: "transform 0.2s ease",
  };

  const absoluteStyle: React.CSSProperties = {
    position: "absolute",
    top: "20px",
    left: "20px",
    zIndex: 100,
  };

  const handleNavigate = useCallback(() => {
    if (path) navigate(path);
    else navigate(-1);
  }, [path]);

  return (
    <Tooltip label="Torna indietro" position="bottom" withArrow>
      <ActionIcon
        variant="light"
        color="indigo"
        radius="xl"
        size="lg"
        onClick={handleNavigate}
        style={{
          ...sharedStyle,

          ...(position === "absolute" ? absoluteStyle : {}),
        }}
        className="backButton"
      >
        <IconArrowLeft size={24} />
      </ActionIcon>
    </Tooltip>
  );
};

export default BackButton;

// src/components/DarkModeToggle.js
import { useColorMode, Button, Icon } from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

const DarkModeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  
  return (
    <Button
      onClick={toggleColorMode}
      size="sm"
      position="fixed"
      bottom="20px"
      right="20px"
      zIndex="docked"
      leftIcon={<Icon as={() => <FontAwesomeIcon icon={colorMode === "light" ? faMoon : faSun} />} />}
    >
      {colorMode === "light" ? "Dark" : "Light"} Mode
    </Button>
  );
};

export default DarkModeToggle;
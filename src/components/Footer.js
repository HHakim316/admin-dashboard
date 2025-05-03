import { 
  Flex, IconButton, Tooltip, Avatar, 
  Text, useColorMode, Badge 
} from "@chakra-ui/react";
import { FaTrash, FaSignOutAlt, FaSun, FaMoon } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // 👈 We'll create this next!

export const Footer = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, logout } = useAuth(); // 👈 Gets user + logout function

  // Hide footer on login page
  if (location.pathname === "/login") return null;

  return (
    <Flex
    as="footer"
    position="fixed"
    bottom="0"
    left="0"
    right="0"
    height="40px"
    bg={colorMode === "light" ? "gray.300" : "gray.700"} // Darker gray
    borderTopWidth="1px"
    borderTopColor={colorMode === "light" ? "gray.400" : "gray.600"}
    boxShadow="sm" // Subtle shadow for sharpness
    borderRadius="0" // Removes rounded corners
    align="center"
    justify="space-between"
    px={4}
    zIndex="20"
    >
      {/* 👈 LEFT: User & Logoff */}
      <Flex align="center" gap={2}>
        <Avatar 
          size="sm" 
          name={auth?.user?.name || 'User'} 
          src={auth?.user?.avatar} 
        />
        <Text fontSize="sm">{auth?.user?.name || 'Guest'}</Text>
        <Tooltip label="Logout">
          <IconButton
            icon={<FaSignOutAlt />}
            aria-label="Logout"
            onClick={logout} // 👈 Uses AuthContext's logout
            variant="ghost"
            size="sm"
          />
        </Tooltip>
      </Flex>

      {/* Right: Icons */}
      <Flex align="center" gap={3}>
        <Tooltip label="Recycle Bin">
          <IconButton
            icon={<FaTrash />}
            onClick={() => navigate('/recycle')}
            variant="ghost"
            size="sm"
          />
        </Tooltip>
        <Tooltip label={colorMode === "light" ? "Dark mode" : "Light mode"}>
          <IconButton
            icon={colorMode === "light" ? <FaMoon /> : <FaSun />}
            onClick={toggleColorMode}
            variant="ghost"
            size="sm"
          />
        </Tooltip>
      </Flex>
    </Flex>
    
  );
};
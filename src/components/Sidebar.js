// src/components/Sidebar.js
import {
  Box,
  VStack,
  Text,
  Button,
  useColorModeValue,
  Badge,
  Flex,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { ROLES, INVENTORY_ACCESS, REPORTS_ACCESS } from "../constants/roles";

const Sidebar = ({ userRole = "", products = [] }) => {
  const textColor = useColorModeValue("gray.800", "white");
  const bgColor = useColorModeValue("gray.200", "gray.800");
  const navigate = useNavigate();

  // 🚨 Removed recycleCount (now handled in footer)
  // 🚨 Removed handleLogout (moved to AuthContext)

  return (
    <Box
      w="250px"
      h="100vh"
      bg={bgColor}
      color={textColor}
      p={5}
      position="fixed"
      left={0}
      top={0}
    >
      <Text fontSize="2xl" mb={8} fontWeight="bold">
        🛍️ DS Admin
      </Text>

      <VStack spacing={4} align="stretch">
        {/* Dashboard (All roles) */}
        <Button 
          variant="ghost" 
          justifyContent="start" 
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </Button>

        {/* Products (Admin/Manager) */}
        {INVENTORY_ACCESS.includes(userRole) && (
          <Button 
            variant="ghost" 
            justifyContent="start" 
            onClick={() => navigate("/products")}
          >
            Products
          </Button>
        )}

        {/* Reports (Admin/Manager) */}
        {REPORTS_ACCESS.includes(userRole) && (
          <Button 
            variant="ghost" 
            justifyContent="start" 
            onClick={() => navigate("/reports")}
          >
            Reports
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default Sidebar;
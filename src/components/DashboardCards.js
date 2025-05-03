// src/components/DashboardCards.js
import { SimpleGrid, Box, Stat, StatLabel, StatNumber, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

const DashboardCards = () => {
  const [role, setRole] = useState(localStorage.getItem("userRole"));
  const [data, setData] = useState([]);

  // Debugging: Log the role and data
  console.log("Current role:", role);
  console.log("Current data:", data);

  useEffect(() => {
    const handleStorageChange = () => {
      const newRole = localStorage.getItem("userRole");
      console.log("Role changed to:", newRole); // Debug
      setRole(newRole);
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (!role) {
      console.log("No role detected"); // Debug
      return;
    }

    // Normalize role to lowercase for comparison
    const normalizedRole = role.toLowerCase().trim();
    console.log("Normalized role:", normalizedRole); // Debug

    if (normalizedRole === "admin") {
      setData([
        { label: "Total Revenue", value: "$25,400", color: "green.400" },
        { label: "Total Orders", value: "1,283", color: "blue.400" },
        { label: "Low Stock Items", value: "8", color: "red.400" },
        { label: "Top Product", value: "Slim Fit Blazer", color: "purple.400" },
      ]);
    } else if (normalizedRole === "store_manager") {
      setData([
        { label: "Total Revenue", value: "$15,000", color: "green.400" },
        { label: "Total Orders", value: "500", color: "blue.400" },
        { label: "Low Stock Items", value: "5", color: "red.400" },
        { label: "Top Product", value: "Formal Shirt", color: "purple.400" },
      ]);
    } else if (normalizedRole === "sales") {
      setData([
        { label: "Total Revenue", value: "$10,000", color: "green.400" },
        { label: "Total Orders", value: "400", color: "blue.400" },
        { label: "Top Product", value: "Slim Fit Jeans", color: "purple.400" },
      ]);
    } else {
      console.log("Unknown role:", normalizedRole); // Debug
    }
  }, [role]);

  return (
    <Box p={5} ml="250px">
      {data.length === 0 ? (
        <Text fontSize="xl">Loading dashboard data...</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
          {data.map((item, i) => (
            <Box
              key={i}
              p={5}
              borderRadius="md"
              bg={item.color}
              color="white"
              shadow="md"
            >
              <Stat>
                <StatLabel fontSize="sm">{item.label}</StatLabel>
                <StatNumber fontSize="2xl">{item.value}</StatNumber>
              </Stat>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default DashboardCards;
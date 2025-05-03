import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Text,
  Flex,
  useToast,
  Checkbox,
  Spinner,
  Alert,
  AlertIcon,
  Stack
} from "@chakra-ui/react";
import api from "../../api/axios";
import { useAuth } from '../../context/AuthContext'; // 👈 Adjust path as needed

const RecycleBin = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { auth } = useAuth(); // 👈 Import from your AuthContext
  const userRole = auth?.role || localStorage.getItem('userRole'); // Direct from context
  const canManage = ['admin', 'store_manager'].includes(userRole?.toLowerCase().trim());

  console.log("FINAL ROLE RESOLUTION:", {
    contextRole: auth?.role,
    localStorageRole: localStorage.getItem('userRole'),
    finalRole: userRole
  });

  console.log("RECYCLE BIN FORENSICS:", {
    authContext: auth,
    rawLocalStorage: {
      user: localStorage.getItem('user'),
      role: localStorage.getItem('userRole')
    },
    timestamp: new Date().toISOString()
  });

  const fetchDeletedItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get("/products/deleted"),
        api.get("/categories/deleted")
      ]);

      const allItems = [
        ...(productsRes.data || []),
        ...(categoriesRes.data || [])
      ];

      setItems(allItems);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
      toast({
        title: "Failed to load deleted items",
        status: "error",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async (ids) => {
    if (!canManage) return;
    if (!window.confirm(`Permanently delete ${ids.length} item(s)?`)) return;

    try {
      const isCategory = items.some(item => ids.includes(item.id) && item.hasOwnProperty('parent'));
      const endpoint = isCategory 
        ? `/categories/permanent`
        : `/products/permanent`;

      await api.delete(endpoint, { data: { ids } });
      
      toast({
        title: `${ids.length} item(s) deleted permanently`,
        status: "success",
        duration: 3000
      });
      fetchDeletedItems();
      setSelected([]);
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000
      });
    }
  };

  const handleRestore = async (ids) => {
    try {
      const isCategory = items.some(item => ids.includes(item.id) && item.hasOwnProperty('parent'));
      const endpoint = isCategory 
        ? `/categories/restore`
        : `/products/restore`;

      await api.patch(endpoint, { ids });
      
      toast({
        title: `${ids.length} item(s) restored`,
        status: "success",
        duration: 3000
      });
      fetchDeletedItems();
      setSelected([]);
    } catch (error) {
      toast({
        title: "Restoration failed",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000
      });
    }
  };

  useEffect(() => {
    fetchDeletedItems();
  }, []);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner 
          size="xl" 
          thickness="4px"
          emptyColor="gray.200"
          color="blue.500"
        />
        <Text ml={4}>Loading deleted items...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" variant="subtle" flexDirection="column">
        <AlertIcon boxSize="40px" mr={0} />
        <Text mt={4} mb={1} fontSize="lg">
          Loading Failed
        </Text>
        <Text mb={4}>{error}</Text>
        <Button colorScheme="red" onClick={fetchDeletedItems}>
          Retry
        </Button>
      </Alert>
    );
  }

  console.log("Recycle Bin Items:", {
    items: items.map(i => ({ id: i.id, type: i.parent !== undefined ? 'category' : 'product' })),
    duplicateIds: items.filter((item, idx) => 
      items.findIndex(i => i.id === item.id) !== idx
    )
  });

  return (
    <Box p={5}>
      <Flex justify="space-between" mb={4}>
        <Text fontSize="2xl" fontWeight="bold">🗑️ Recycle Bin</Text>
        {selected.length > 0 && (
          <Stack direction="row" spacing={4}>
            <Button onClick={() => handleRestore(selected)}>
              Restore Selected ({selected.length})
            </Button>
            {console.log('Debug - Permissions:', { userRole, canManage })} {/* 👈 Add this */}
            {canManage && (
              <Button 
                colorScheme="red" 
                onClick={() => handlePermanentDelete(selected)}
              >
                Delete Selected Permanently
              </Button>
            )}
          </Stack>
        )}
      </Flex>

      {items.length === 0 ? (
        <Text>No deleted items found</Text>
      ) : (
        <Table variant="striped">
          <Thead>
            <Tr>
              <Th>
                <Checkbox 
                  isChecked={selected.length === items.length}
                  onChange={() => 
                    setSelected(selected.length === items.length 
                      ? [] 
                      : items.map(i => i.id)
                    )
                  }
                />
              </Th>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Deleted At</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.map((item, index) => (
              <Tr key={`${item.id}-${index}`}>{/* 👈 Unique composite key */}
                <Td>
                  <Checkbox 
                    isChecked={selected.includes(item.id)}
                    onChange={() => 
                      setSelected(prev => 
                        prev.includes(item.id)
                          ? prev.filter(i => i !== item.id)
                          : [...prev, item.id]
                      )
                    }
                  />
                </Td>
                <Td>{item.name || item.title}</Td>{/* 👈 Compact lines */}
                <Td>{item.parent !== undefined ? 'Category' : 'Product'}</Td>
                <Td>{new Date(item.deletedAt).toLocaleString()}</Td>
                <Td>
                  <Stack direction="row" spacing={2}>
                    <Button 
                      size="sm" 
                      colorScheme="green" 
                      onClick={() => handleRestore([item.id])}
                    >
                      Restore
                    </Button>
                    {canManage && (
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => handlePermanentDelete([item.id])}
                        visibility={canManage ? 'visible' : 'hidden'} //
                      >
                        {canManage ? 'Delete' : 'No Permissions'}
                      </Button>
                    )}
                  </Stack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default RecycleBin;
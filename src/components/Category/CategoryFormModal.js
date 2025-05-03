// src/components/Category/CategoryFormModal.js
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Button,
    FormControl,
    FormLabel,
    Input,
    useToast
  } from "@chakra-ui/react";
  import { useState } from "react";
  import api from "../../api/axios";
  
  const CategoryFormModal = ({ isOpen, onClose, refreshCategories }) => {
    const [name, setName] = useState("");
    const [parentId, setParentId] = useState(null);
    const toast = useToast();
  
    const handleSubmit = async () => {
      try {
        await api.post('/categories', { name, parentId });
        toast({ title: "Category created!", status: "success" });
        refreshCategories();
        onClose();
      } catch (error) {
        toast({
          title: "Error creating category",
          description: error.response?.data?.message || error.message,
          status: "error"
        });
      }
    };
  
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Category</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Category Name</FormLabel>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Electronics"
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Parent ID (optional)</FormLabel>
              <Input
                type="number"
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                placeholder="Leave empty for main category"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };
  
  export default CategoryFormModal;
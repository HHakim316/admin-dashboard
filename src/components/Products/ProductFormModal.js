// src/components/Products/ProductFormModal.js
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  NumberInput,
  NumberInputField,
  useToast,
  Textarea,
  Switch,
  Alert,
  AlertIcon,
  Select,
  Spinner
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import CategorySelector from '../Category/CategorySelector';
import PropTypes from 'prop-types';

const ProductFormModal = ({ 
  isOpen, 
  onClose, 
  product, 
  fetchProducts,
  categories = [],
  categoriesLoading = false,
  categoriesError = null
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    stock: 0,
    isActive: true,
    category: "",
    categoryId: null
  });
  const toast = useToast();
  const [parentCategories, setParentCategories] = useState([]);
  const [childCategories, setChildCategories] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);

  // Load parents on mount
useEffect(() => {
  api.get('/categories/parents').then(res => {
    setParentCategories(res.data);
  });
}, []);

// Load children when parent is selected
useEffect(() => {
  if (selectedParentId) {
    api.get(`/categories/children/${selectedParentId}`).then(res => {
      setChildCategories(res.data);
    });
  } else {
    setChildCategories([]); // Reset if no parent selected
  }
}, [selectedParentId]);

// Handle parent selection
const handleParentChange = (e) => {
  const parentId = Number(e.target.value);
  setSelectedParentId(parentId);
  setFormData({
    ...formData,
    categoryId: null, // Reset child selection
    category: parentCategories.find(c => c.id === parentId)?.name,
  });
};

// Handle child selection
const handleChildChange = (e) => {
  const childId = Number(e.target.value);
  setFormData({
    ...formData,
    categoryId: childId,
    category: childCategories.find(c => c.id === childId)?.name,
  });
};

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        imageUrl: product.imageUrl || "",
        stock: product.stock,
        isActive: product.isActive !== false,
        category: product.category || "",
        categoryId: product.categoryId || null
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        imageUrl: "",
        stock: 0,
        isActive: true,
        category: "",
        categoryId: null
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.categoryId) {
        toast({ title: "Category is required", status: "error" });
        return;
      }

      const payload = {
        name: String(formData.name),
        description: String(formData.description || ""),
        price: Number(formData.price) || 0,
        imageUrl: String(formData.imageUrl || ""),
        stock: Number(formData.stock) || 0,
        isActive: Boolean(formData.isActive),
        categoryId: Number(formData.categoryId)
      };

      if (product?.id) {
        await api.put(`/products/${product.id}`, payload);
        toast({ title: "Product updated!", status: "success" });
      } else {
        await api.post("/products", payload);
        toast({ title: "Product created!", status: "success" });
      }

      if (typeof fetchProducts === 'function') {
        await fetchProducts();
      }
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      toast({
        title: "Error saving product",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      scrollBehavior="outside"
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{product ? "Edit Product" : "Add New Product"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            {/* Name */}
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input name="name" value={formData.name} onChange={handleChange} />
            </FormControl>

            {/* Description */}
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange}
                rows={3}
              />
            </FormControl>

            {/* Price */}
            <FormControl isRequired>
              <FormLabel>Price</FormLabel>
              <NumberInput
                value={formData.price}
                onChange={(value) => handleNumberChange("price", value)}
                min={0}
                precision={2}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
            
            {/* Stock */}
            <FormControl isRequired>
              <FormLabel>Stock Quantity</FormLabel>
              <NumberInput
                value={formData.stock}
                onChange={(value) => handleNumberChange("stock", value)}
                min={0}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>

            {/* Image URL */}
            <FormControl>
              <FormLabel>Image URL</FormLabel>
              <Input 
                name="imageUrl" 
                value={formData.imageUrl} 
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </FormControl>

            {/* Parent Category Dropdown */}
            {/* Parent Category Dropdown */}
<FormControl isRequired mb={4}>
  <FormLabel>Parent Category</FormLabel>
  <Select
    placeholder="Select parent category"
    onChange={handleParentChange}
    value={selectedParentId || ''}
  >
    {parentCategories.map((cat) => (
      <option key={cat.id} value={cat.id}>
        {cat.name}
      </option>
    ))}
  </Select> {/* 👈 Closing tag added */}
</FormControl>

{/* Child Category Dropdown - Only shows when parent is selected */}
{selectedParentId && (
  <FormControl mb={4}>
    <FormLabel>Subcategory (Optional)</FormLabel>
    <Select
      placeholder="Select subcategory"
      onChange={handleChildChange}
      value={formData.categoryId || ''}
    >
      {childCategories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </Select> {/* 👈 Closing tag added */}
  </FormControl>
)}

            {/* Active Status */}
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Active Product?</FormLabel>
              <Switch
                isChecked={formData.isActive}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, isActive: e.target.checked }))
                }
                colorScheme="teal"
              />
            </FormControl>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            Save
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

ProductFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.object,
  fetchProducts: PropTypes.func.isRequired,
  categories: PropTypes.array,
  categoriesLoading: PropTypes.bool,
  categoriesError: PropTypes.string
};

export default ProductFormModal;
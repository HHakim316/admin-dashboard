// src/components/Products/ProductTable.js
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Box,
  Flex,
  Text,
  useDisclosure,
  useToast,
  Spinner,
  Checkbox,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Wrap,
  WrapItem,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  SimpleGrid,
  Badge
} from "@chakra-ui/react";
import React, { useContext } from 'react'; // Add useContext
import { ChevronDownIcon } from "@chakra-ui/icons";
import ProductFormModal from "./ProductFormModal";
import CategoryTreeView from '../Category/CategoryTreeView';
import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";


// Icon library
const CATEGORY_ICONS = {
  electronics: '📱',
  groceries: '🍎',
  clothing: '👕',
  furniture: '🛋️',
  technology: '💻',
  home: '🏠',
  gaming: '🎮',
  default: '🏷️'
};


const ProductTable = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const toast = useToast();
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  

  // State for categories
  const { 
    isOpen: isCategoryModalOpen, 
    onOpen: onCategoryModalOpen, 
    onClose: onCategoryModalClose 
  } = useDisclosure(); // 👈 New modal control
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState(null);
  const [ParentCategories, setParentCategories] = useState([]);
  useEffect(() => {
  if (isCategoryModalOpen) {
    api.get('/categories/parents').then(res => {
      setParentCategories(res.data);
    });
  }
}, [isCategoryModalOpen]);
  // Create category tab
  const [activeTab, setActiveTab] = useState();
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS.default);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParent, setSelectedParent] = useState(null);
  
  
  // Delete category tab
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [newParent, setNewParent] = useState(null);
  const [productsNewHome, setProductsNewHome] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryStatus, setCategoryStatus] = useState({ 
    isEmpty: true,
    requiresMoveTo: false,
    productCount: 0,
    subcategoryCount: 0
  });

  const checkCategoryStatus = async (categoryId) => {
    try {
      const res = await api.get(`/categories/${categoryId}/status`);
      const category = getCategoryById(categoryId);
      return {
        isEmpty: res.data.isEmpty,
        requiresMoveTo: res.data.requiresMoveTo,
        productCount: res.data.productCount || 0,
        subcategoryCount: res.data.subcategoryCount || 0,
        isParentCategory: !category?.parentId // Add this flag
      };
    } catch (error) {
      console.error("Status check failed:", error);
      return {
        isEmpty: true,
        requiresMoveTo: false,
        productCount: 0,
        subcategoryCount: 0,
        isParentCategory: false
      };
    }
  };

  // Replace your current useEffect with this:
useEffect(() => {
  if (categories.length > 0 && !categoriesLoading) {
    fetchProducts(); // Auto-refresh when categories change
  }
  
  if (!categoryToDelete) return;

  let isMounted = true; // Track if component is mounted
  const controller = new AbortController();

  const fetchStatus = async () => {
    try {
      const status = await checkCategoryStatus(categoryToDelete);
      if (isMounted) {
        setCategoryStatus(status);
      }
    } catch (err) {
      if (err.name !== 'AbortError' && isMounted) {
        console.error("Status check failed:", err);
      }
    }
  };

  fetchStatus();

  return () => {
    isMounted = false;
    controller.abort();
  };
}, [categoryToDelete]); // Only depends on categoryToDelete
  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      toast({
        title: "Error fetching products",
        description: err.message,
        status: "error",
      }); 
    } finally {
      setLoading(false);
    }
  }, [toast]); 

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null); // Reset any previous errors
      
      // 1. First fetch the tree structure and flat list in parallel
      const [treeResponse, flatResponse] = await Promise.all([
        api.get("/categories/tree"),
        api.get("/categories/flat")
      ]);
  
      // 2. Safely add product counts with individual error handling
      const countedCategories = await Promise.all(
        treeResponse.data.map(async cat => {
          try {
            const countResponse = await api.get(
              `/categories/${cat.id}/product-count-recursive`
            );
            return {
              ...cat,
              productCount: countResponse.data?.count || 0 // Null check with ?. and fallback
            };
          } catch (error) {
            console.error(`Failed to get count for category ${cat.id}:`, error);
            // Fail safely - category will still work without count
            return {
              ...cat,
              productCount: 0,
              _countError: true // Optional flag for debugging
            };
          }
        })
      );
  
      // 3. EXTRA SAFETY VALIDATION (recommended)
      const countsSuccessful = countedCategories.some(cat => cat.productCount > 0);
      if (!countsSuccessful) {
        console.warn("Product counts not loaded - falling back to basic data");
        // Fallback 1: Use tree data without counts
        setCategories(treeResponse.data);
      } else {
        // Success case - use data with counts
        setCategories(countedCategories);
      }
  
      // 4. Always set flat categories (required for delete operations)
      setAllCategories(flatResponse.data);
  
      // 5. Optional debug logs
      console.log("Categories loaded:", {
        tree: treeResponse.data,
        flat: flatResponse.data,
        withCounts: countedCategories
      });
  
    } catch (err) {
      console.error("CRITICAL: Failed to load categories:", err);
      // Preserve existing error handling you worked hard on
      setCategoriesError("Failed to load categories. Please refresh to try again.");
      toast({
        title: "Error loading categories",
        description: err.message,
        status: "error",
      });
      
      // Critical fallback - try to at least load flat categories
      try {
        const flatRes = await api.get("/categories/flat");
        setAllCategories(flatRes.data);
      } catch (innerErr) {
        console.error("Failed to load flat categories:", innerErr);
      }
    } finally {
      setCategoriesLoading(false);
    }
  }, [toast]);
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    const fetchDeleted = async () => {
      if (isCategoryModalOpen) {
        try {
          await api.get('/categories/deleted');
        } catch (error) {
          console.error("Failed to fetch deleted categories:", error);
        }
      }
    };
    
    const timer = setInterval(fetchDeleted, 30000); // Check every 30 seconds
    return () => clearInterval(timer);
  }, [isCategoryModalOpen]);

  // Helper functions for delete operations
  const getCategoryById = (id) => allCategories.find(cat => cat.id === id);
  
  const hasSubcategories = (categoryId) => {
    const category = getCategoryById(categoryId);
    return category?.children?.length > 0;
  };

  
  const handleDeleteCategory = async () => {
    try {
      setIsDeleting(true);
      const category = getCategoryById(categoryToDelete);
      const currentStatus = await checkCategoryStatus(categoryToDelete);
  
      // 1️⃣ SUB-CATEGORY WITH PRODUCTS
      if (category.parentId && currentStatus.productCount > 0) {
        if (!productsNewHome) {
          throw new Error(`Select target subcategory for ${currentStatus.productCount} products`);
        }
        // Validate target is under same parent
        const targetCategory = getCategoryById(productsNewHome);
        if (targetCategory?.parentId !== category.parentId) {
          throw new Error("Products must stay within same parent category");
        }
      }
  
      // 2️⃣ PARENT CATEGORY RULES (from previous fix)
      if (!category.parentId) {
        if (currentStatus.subcategoryCount > 0 && !newParent) {
          throw new Error(`Select new parent for ${currentStatus.subcategoryCount} subcategories`);
        }
        // Parent with products requires product destination
        if (currentStatus.productCount > 0 && !productsNewHome) {
          throw new Error(`Select target for ${currentStatus.productCount} products`);
        }
      }
  
      // 🚀 Execute deletion
      await api.delete(`/categories/${categoryToDelete}`, {
        params: {
          ...(productsNewHome && { moveTo: productsNewHome }),
          ...(newParent && { newParent: newParent })
        }
      });
  
      toast({
        title: "Deleted successfully!",
        description: "Updating product listings...",
        status: "success",
        duration: 3000
      });
      // Double-barrel refresh
      await Promise.all([
        fetchCategories(),
        fetchProducts() // This is KEY for product updates
      ]);

      // Force UI update
        setProducts(prev => [...prev]); // Reactivity nuke
  
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        status: "error"
      });
    } finally {
      setIsDeleting(false);
    }
  };


  // Handle product selection
  const toggleSelect = (productId) => {
    setSelected(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Select all visible products
  const selectAll = () => {
    const visible = products.filter(p => !p.deletedAt);
    setSelected(visible.map(p => p.id));
  };

  // Add new product
  const handleAdd = () => {
    setSelectedProduct(null);
    onOpen();
  };

  // Edit product
  const handleEdit = (product) => {
    setSelectedProduct(product);
    onOpen();
  };

  

  // Delete single product
  const handleDelete = async (product) => {
    const productId = String(product.id); // Convert ID to string

    // Check if product ID exists
    if (isNaN(productId) || productId.trim() === '') {
      toast({
        title: "Error",
        description: "Product ID is missing or invalid. Unable to delete.",
        status: "error",
      });
      return; // Exit if the product ID is invalid
    }
    try {
      await api.delete(`/products/${product.id}`, {
        deletedAt: new Date().toISOString()
      });
      toast({
        title: "Product moved to recycle bin",
        status: "success",
      });
      fetchProducts();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err.message,
        status: "error",
      });
    }
  };

  // Bulk delete selected products
  const bulkDelete = async () => {
    try {
      await Promise.all(
        selected.map(id =>
          api.delete(`/products/${id}`, {
            deletedAt: new Date().toISOString()
          })
        )
      );
      toast({
        title: `${selected.length} products moved to bin`,
        status: "success",
      });
      setSelected([]);
      fetchProducts();
    } catch (err) {
      toast({
        title: "Bulk delete failed",
        description: err.message,
        status: "error",
      });
    }
  };

  const visibleProducts = products.filter(p => !p.deletedAt);

  return (
    <Box p={5} >
      <Flex justify="space-between" mb={4} align="center">
        <Text fontSize="2xl" fontWeight="bold">
          📦 Products
        </Text>
        <Flex gap={2}>
          {selected.length > 0 && (
            <>
              <Button onClick={selectAll}>Select All</Button>
              <Button colorScheme="red" onClick={bulkDelete}>
                Delete Selected ({selected.length})
              </Button>
            </>
          )}
          <Button 
            colorScheme="orange" 
            onClick={onCategoryModalOpen}
          >
            + Manage Categories
          </Button>
          <Button colorScheme="teal" onClick={handleAdd}>
            + Add Product
          </Button>
        </Flex>
      </Flex>
  
      {categoriesError && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {categoriesError}
        </Alert>
      )}
  
      {loading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <Table variant="simple">
          <Thead bg="gray.100">
            <Tr>
              <Th>Select</Th>
              <Th>Name</Th>
              <Th>Price</Th>
              <Th>Stock</Th>
              <Th>Category</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {visibleProducts.map(product => (
              <Tr key={product.id}>
                <Td>
                  <Checkbox
                    isChecked={selected.includes(product.id)}
                    onChange={() => toggleSelect(product.id)}
                  />
                </Td>
                <Td>{product.name}</Td>
                <Td>${product.price}</Td>
                <Td>{product.stock}</Td>
                <Td>
                  {product.category?.icon && (
                    <span style={{ marginRight: '5px' }}>{product.category.icon}</span>
                  )}</Td>
                <Td>{product.category?.name || "N/A"}</Td>
                <Td>
                  <Flex gap={2}>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => handleDelete(product)}
                     
                    >
                      Delete
                    </Button>
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
  
      {/* Product Modal */}
      <ProductFormModal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          fetchProducts();
        }}
        product={selectedProduct}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        fetchProducts={fetchProducts}
      />
  
      {/* Category Management Modal */}
      <Modal isOpen={isCategoryModalOpen} onClose={onCategoryModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <Tabs isFitted variant="enclosed">
            <TabList mb="1em">
              <Tab 
                _selected={{ color: 'white', bg: 'green.500' }} 
                onClick={() => setActiveTab('create')}
              >
                View & Edit
              </Tab>
              <Tab 
              _selected={{ color: 'white', bg: 'blue.500' }} 
              onClick={() => setActiveTab('view')}
              >
                Create Category
              </Tab>
              <Tab 
                _selected={{ color: 'white', bg: 'red.500' }} 
                onClick={() => setActiveTab('delete')}
              >
                Delete Category
              </Tab>

            </TabList>
            <TabPanels>
              {/* VIEWB&BEDIT TAB */}
              <TabPanel>
              <CategoryTreeView
              categories={categories}
              allCategories={allCategories}
              fetchCategories={fetchCategories}
              />
              </TabPanel>
              {/* CREATE CATEGORY TAB */}
              <TabPanel>
                <SimpleGrid columns={1} spacing={4}>
                  {/* 1️⃣ CATEGORY ICONS */}
                  <FormControl>
                    <FormLabel>Select Icon</FormLabel>
                    <Wrap spacing={2}>
                      {Object.entries(CATEGORY_ICONS).map(([key, icon]) => (
                        <WrapItem key={key}>
                          <Button 
                            size="lg" 
                            onClick={() => setSelectedIcon(icon)}
                            bg={selectedIcon === icon ? 'blue.200' : 'gray.100'}
                            fontSize="xl"
                          >
                            {icon}
                          </Button>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </FormControl>

                  {/* Category Name */}
                  <FormControl>
                    <FormLabel>Category Name</FormLabel>
                    <Input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Electronics"
                    />
                  </FormControl>

                  {/* 2️⃣ SEARCHABLE DROPDOWN */}
                  <FormControl>
                    <FormLabel>Parent Category (Top Level)</FormLabel>
                    <Menu>
                      <MenuButton 
                        as={Button} 
                        rightIcon={<ChevronDownIcon />} 
                        w="100%"
                        textAlign="left"
                      >
                        {selectedParent ? 
                          `${selectedParent.icon || ''} ${selectedParent.name}` : 
                          'Top Level Category'}
                      </MenuButton>
                      <MenuList maxH="300px" overflowY="auto">
                        <Box p={2}>
                          <Input 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </Box>
                        <MenuItem onClick={() => setSelectedParent(null)}>
                          None (Main Category)
                        </MenuItem>
                        {ParentCategories
                          .filter(cat => 
                            cat.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                            (!cat.parentId || cat.parentId === null)
                          )
                          .map(cat => (
                            <MenuItem 
                              key={cat.id} 
                              onClick={() => setSelectedParent(cat)}
                            >
                              {cat.icon || CATEGORY_ICONS.default} {cat.name}
                            </MenuItem>
                          ))}
                      </MenuList>
                    </Menu>
                  </FormControl>

                  {/* 3️⃣ BREADCRUMBS VISUALIZATION */}
                  {selectedParent && (
                    <Box>
                      <Text fontSize="sm" color="gray.500">Category Path:</Text>
                      <Breadcrumb>
                        {selectedParent.path?.map((cat, index) => (
                          <BreadcrumbItem key={index}>
                            <BreadcrumbLink>
                              {cat.icon || CATEGORY_ICONS.default} {cat.name}
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                        ))}
                        <BreadcrumbItem isCurrentPage>
                          <BreadcrumbLink>
                            {selectedParent.icon || CATEGORY_ICONS.default} {selectedParent.name}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      </Breadcrumb>
                    </Box>
                  )}
                </SimpleGrid>

                <ModalFooter>
                  <Button 
                    colorScheme="green" 
                    mr={3}
                    onClick={async () => {
                      try {
                        await api.post('/categories', { 
                          name, 
                          parentId: selectedParent?.id || null,
                          icon: selectedIcon
                        });
                        toast({ 
                          title: "Category created!", 
                          status: "success",
                          description: selectedParent ? 
                            `Added under ${selectedParent.name}` : 
                            'Created as top-level category'
                        });
                        fetchCategories();
                        setName('');
                        setSelectedIcon(CATEGORY_ICONS.default);
                        setSelectedParent(null);
                      } catch (error) {
                        toast({
                          title: "Error creating category",
                          description: error.response?.data?.message || error.message,
                          status: "error"
                        });
                      }
                    }}
                    isDisabled={!name.trim()}
                  >
                    Create Category
                  </Button>
                  <Button onClick={onCategoryModalClose}>Cancel</Button>
                </ModalFooter>
              </TabPanel>

              {/* DELETE CATEGORY TAB */}
              <TabPanel>
                <FormControl mb={4}>
                  <FormLabel>Select Category to Delete</FormLabel>
                  <Select 
                    onChange={(e) => setCategoryToDelete(e.target.value ? Number(e.target.value) : null)}
                    placeholder="Select category"
                  >
                    {allCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon || CATEGORY_ICONS.default} {cat.name}
                        {cat.children?.length > 0 && (
                          <Badge ml={2} colorScheme="purple">
                            {cat.children.length} subcategories
                          </Badge>
                        )}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {categoryToDelete && (
  <Box>
    {/* Category Info Box */}
    <Box mb={4} p={3} borderWidth="1px" borderRadius="lg">
      <Text fontWeight="bold">
        {getCategoryById(categoryToDelete)?.icon || CATEGORY_ICONS.default} 
        {getCategoryById(categoryToDelete)?.name}
      </Text>
      {getCategoryById(categoryToDelete)?.parentId && (
        <Text fontSize="sm" color="gray.500">
          Parent: {getCategoryById(getCategoryById(categoryToDelete)?.parentId)?.name || 'None'}
        </Text>
      )}
    </Box>

    {/* Dynamic Warnings and Selections */}
    {(() => {
      const category = getCategoryById(categoryToDelete);
      const status = checkCategoryStatus(categoryToDelete);
      const hasSubcats = hasSubcategories(categoryToDelete);
      
      return (
        <>
          {/* Empty Category Warning */}
          {!status?.requiresMoveTo && !hasSubcats && (
            <Alert status="warning" mb={4}>
              <AlertIcon />
              This will permanently delete the category
            </Alert>
          )}

          {/* Products Warning */}
          {/* Product Destination (for subcategories) */}
{categoryToDelete && getCategoryById(categoryToDelete)?.parentId && (
  <FormControl isRequired={categoryStatus?.productCount > 0} mb={4}>
    <FormLabel>Move products to:</FormLabel>
    <Select
      value={productsNewHome || ''}
      onChange={(e) => setProductsNewHome(Number(e.target.value))}
      placeholder="Select subcategory"
    >
      <option value="">-- Select --</option>
      {allCategories
        .filter(cat => 
          cat.parentId === getCategoryById(categoryToDelete)?.parentId &&
          cat.id !== categoryToDelete
        )
        .map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.name} (Subcategory)
          </option>
        ))}
    </Select>
  </FormControl>
)}

{/* Parent Category Destination */}
{categoryToDelete && !getCategoryById(categoryToDelete)?.parentId && (
  <FormControl isRequired={categoryStatus?.subcategoryCount > 0} mb={4}>
    <FormLabel>Move subcategories to:</FormLabel>
    <Select
      value={newParent || ''}
      onChange={(e) => setNewParent(Number(e.target.value))}
      placeholder="Select parent category"
    >
      <option value="">-- Select --</option>
      {allCategories
        .filter(cat => 
          !cat.parentId && 
          cat.id !== categoryToDelete
        )
        .map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.name} (Parent)
          </option>
        ))}
    </Select>
  </FormControl>
)}

          {/* Parent/Child Deletion Handler */}
{hasSubcats && (
  <Box mb={4}>
    {/* Parent Category Case */}
    {!getCategoryById(categoryToDelete)?.parentId && (
  <Select 
    value={newParent || ''}
    onChange={(e) => setNewParent(Number(e.target.value))}
    placeholder="Select new parent category"
  >
    <option value="">-- Select Parent --</option>
    {allCategories
      .filter(cat => 
        cat.parentId === null && // Only top-level parents
        cat.id !== categoryToDelete // Exclude current category
      )
      .map(cat => (
        <option key={cat.id} value={cat.id}>
          {cat.icon} {cat.name}
        </option>
      ))}
  </Select>
)}

{/* Child Category Deletion - Show all except current */}
{getCategoryById(categoryToDelete)?.parentId && (
  <Select 
    value={productsNewHome || ''}
    onChange={(e) => setProductsNewHome(Number(e.target.value))}
    placeholder="Select target category for products"
  >
    <option value="">-- Select Target --</option>
    {allCategories
      .filter(cat => 
        cat.id !== categoryToDelete // Exclude current category
      )
      .map(cat => (
        <option key={cat.id} value={cat.id}>
          {cat.icon} {cat.name} {cat.parentId === null ? "(Parent)" : ""}
        </option>
      ))}
  </Select>
)}
  </Box>
)}
        </>
      );
    })()}

    {/* Delete Button */}
    <Button 
  colorScheme="red"
  mt={4}
  onClick={async () => {
    try {
      // 1. Get fresh status (don't rely on stale state)
      const currentStatus = await checkCategoryStatus(categoryToDelete);
      
      // 2. Validate
      if (currentStatus.requiresMoveTo && !productsNewHome) {
        throw new Error("Please select a target category for products");
      }
      if (hasSubcategories(categoryToDelete) && !newParent) {
        throw new Error("Please select a new parent for subcategories");
      }

      // 3. Prepare API call
      setIsDeleting(true);
      await api.delete(`/categories/${categoryToDelete}`, {
        params: {
          ...(productsNewHome && { moveTo: productsNewHome }),
          ...(newParent && { newParent: newParent })
        }
      });

      // 4. Success handling
      toast({
        title: "Successfully deleted",
        status: "success",
        description: currentStatus.requiresMoveTo 
          ? `Contents moved to ${getCategoryById(productsNewHome)?.name}`
          : "Empty category removed"
      });

      // 5. Cleanup
      setCategoryToDelete(null);
      setProductsNewHome(null);
      setNewParent(null);
      fetchCategories();
      fetchProducts();
      
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error.response?.data?.message || error.message,
        status: "error"
      });
    } finally {
      setIsDeleting(false);
    }
  }}
  isDisabled={
    (checkCategoryStatus(categoryToDelete)?.requiresMoveTo && !productsNewHome) ||
    (hasSubcategories(categoryToDelete) && !newParent)
  }
  isLoading={isDeleting}
>
  {isDeleting ? (
    <>
      <Spinner size="sm" mr={2} />
      Deleting...
    </>
  ) : "Confirm Delete"}
</Button>
</Box>
)}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProductTable;
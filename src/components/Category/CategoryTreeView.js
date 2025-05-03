import {
    Box,
    Button,
    Flex,
    Input,
    Text,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Select,
    useToast,
    Badge
  } from "@chakra-ui/react";
  import { ChevronDownIcon, ChevronRightIcon, EditIcon } from "@chakra-ui/icons";
  import { useState } from "react";
  import api from "../../api/axios";
  
  const CategoryNode = ({ 
    category, 
    depth = 0, 
    onEdit,
    allCategories,
    fetchCategories
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(category.name);
    const [editedIcon, setEditedIcon] = useState(category.icon);
    const [editedParentId, setEditedParentId] = useState(category.parentId);
    const toast = useToast();
    const hasChildren = category.children && category.children.length > 0;
    const ProductCountBadge = ({ count }) => {
        // Show badge even if count is 0, but with different styling
        if (count === undefined) return null; // Only hide if count is undefined
        
        return (
          <Box 
            as="span"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            w="20px"
            h="20px"
            borderRadius="full"
            bg={count > 0 ? "blue.500" : "gray.200"}
            color={count > 0 ? "white" : "gray.600"}
            fontSize="xs"
            ml={2}
            title={`${count} products`}
          >
            {count}
          </Box>
        );
      };
  
    const handleSave = async () => {
      try {
        await api.patch(`/categories/${category.id}`, {
          name: editedName,
          icon: editedIcon,
          parentId: editedParentId
        });
        toast({
          title: "Category updated!",
          status: "success"
        });
        setIsEditing(false);
        fetchCategories();
      } catch (error) {
        toast({
          title: "Error updating category",
          description: error.response?.data?.message || error.message,
          status: "error"
        });
      }
    };
  
    return (
      <Box pl={`${depth * 20}px`} mb={2}>
        <Flex align="center">
          {hasChildren && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              mr={1}
            >
              {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </Button>
          )}
          
          {!hasChildren && <Box w="30px" />} {/* Spacer for alignment */}
  
          {isEditing ? (
            <>
              <Input
                value={editedIcon}
                onChange={(e) => setEditedIcon(e.target.value)}
                size="sm"
                w="50px"
                mr={2}
                placeholder="Icon"
              />
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                size="sm"
                flex="1"
                mr={2}
              />
              <Select
                value={editedParentId || ''}
                onChange={(e) => setEditedParentId(e.target.value ? Number(e.target.value) : null)}
                size="sm"
                w="150px"
                mr={2}
              >
                <option value="">No parent</option>
                {allCategories
                  .filter(c => c.id !== category.id && !isChild(category, c))
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </Select>
              <Button size="sm" colorScheme="blue" onClick={handleSave}>
                Save
              </Button>
              <Button size="sm" ml={2} onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Text>
                {category.icon && <span style={{ marginRight: '5px' }}>{category.icon}</span>}
                {category.name}
                {typeof category.productCount !== 'undefined' && (
                  <>
                    <Badge ml={2} colorScheme="green">
                      {category.productCount} products
                    </Badge>
                    <ProductCountBadge count={category.productCount} />
                  </>
                )}
              </Text>
              <Button 
               size="xs" 
               ml={2} 
               onClick={() => setIsEditing(true)} 
               leftIcon={<EditIcon />}
             >
               Edit
             </Button>
            </>
          )}
        </Flex>
  
        {isExpanded && hasChildren && (
          <Box mt={2}>
            {category.children.map(child => (
              <CategoryNode
                key={child.id}
                category={child}
                depth={depth + 1}
                onEdit={onEdit}
                allCategories={allCategories}
                fetchCategories={fetchCategories}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  };
  
  // Helper to prevent circular references
  const isChild = (parent, potentialChild) => {
    if (!parent.children) return false;
    if (parent.children.some(c => c.id === potentialChild.id)) return true;
    return parent.children.some(c => isChild(c, potentialChild));
  };
  
  const CategoryTreeView = ({ categories, allCategories, fetchCategories }) => {
    const [searchTerm, setSearchTerm] = useState('');
  
    return (
      <Box>
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          mb={4}
        />
        
        <Box maxH="60vh" overflowY="auto">
          {categories
            .filter(c => !c.parentId)
            .filter(c => 
              c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (c.children && c.children.some(child => 
                child.name.toLowerCase().includes(searchTerm.toLowerCase())
              ))
            )
            .map(category => (
              <CategoryNode
                key={category.id}
                category={category}
                allCategories={allCategories}
                fetchCategories={fetchCategories}
              />
            ))}
        </Box>
      </Box>
    );
  };
  
  export default CategoryTreeView;
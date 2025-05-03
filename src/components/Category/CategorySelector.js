import React, { useState, useEffect } from 'react';
import DropdownTreeSelect from 'react-dropdown-tree-select';
import 'react-dropdown-tree-select/dist/styles.css';
import PropTypes from 'prop-types';
import './categoryStyles.css';
import api from '../../api/axios';

  const CategorySelector = ({ categories = [], refreshCategories }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', parentId: null });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [moveToId, setMoveToId] = useState(null);
  const [categoryStatus, setCategoryStatus] = useState({ 
    isEmpty: true, 
    requiresMoveTo: false, 
    productCount: 0 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check status when category is selected
  useEffect(() => {
    console.log("[DEBUG] Selected category ID:", selectedCategory?.value);
    if (!selectedCategory?.value) return;
  
    const fetchStatus = async () => {
      try {
        setError(null);
        const { data } = await api.get(
          `/categories/${selectedCategory.value}/status`
        );
        setCategoryStatus(data);
      } catch (err) {
        console.error('Status check failed:', err);
        setError('Failed to check category status');
        setCategoryStatus({
          isEmpty: true,
          requiresMoveTo: false,
          productCount: 0,
          subcategoryCount: 0
        });
      }
    };
  
    fetchStatus();
  }, [selectedCategory]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', newCategory);
      refreshCategories();
      setIsModalOpen(false);
      setNewCategory({ name: '', parentId: null });
      alert('Category created successfully!');
    } catch (error) {
      alert(`Error creating category: ${error.response?.data?.message || error.message}`);
    }
  };


  const handleDelete = async () => {
    if (!selectedCategory?.value) return; // value = ID (number)
  
    try {
      await api.delete(`/categories/${selectedCategory.value}`, { 
        params: { 
          moveToId: categoryStatus.requiresMoveTo ? moveToId : undefined 
        }
      });
      alert("Deleted successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Deletion failed");
    }
  };

  const formatTree = (categories) => {
    return categories.map(cat => ({
      label: cat.name, // Display name ("Cat-Child402")
      value: cat.id, // Use name as value since we'll lookup by name
      id: cat.id,      // Keep real ID accessible
      children: cat.children ? formatTree(cat.children) : []
    }));
  };

  return (
    <div className="category-selector">
      <button onClick={() => setIsModalOpen(true)}>
        + New Category
      </button>

      
      <DropdownTreeSelect
        data={formatTree(categories)}
        onChange={(node) => {
          console.log("[DEBUG] OnChange:", node.value);
          const categoryId = Number(node.value);  // Force numeric
          if (isNaN(categoryId)) {
            console.error("Invalid category ID:", node.value);
            return;
          }
          console.log("[DEBUG] Selected ID (numeric):", categoryId);
          setSelectedCategory({
            id: categoryId,    // Store as number
            name: node.label   // Optional: Keep name for display
          });
          setMoveToId(null); // Reset move selection when changing category
      }}
        placeholderText="Select category to delete"
      />

      {selectedCategory && (
        <div className="delete-section">
          {categoryStatus?.requiresMoveTo && (
          <select
            placeholder="Select category"
            value={moveToId || ''}
            onChange={(e) => {
              const id = Number(e.target.value);  // Convert to number
              const selected = categories.find(c => c.id === id);
              setSelectedCategory(selected);  // 👈 Store the FULL category object
              
            }}
          >
            <option value="">Select target category</option>
            {categories
              .filter(c => c.id !== selectedCategory.value)
              .map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
        )}

          <button 
            onClick={handleDelete}
            disabled={loading || (categoryStatus.requiresMoveTo && !moveToId)}
          >
            {loading ? 'Processing...' : 'Delete Category'}
          </button>
          {error && <div className="error-message">{error}</div>}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Category</h3>
            <button 
              className="close-btn" 
              onClick={() => setIsModalOpen(false)}
            >
              ×
            </button>
            <form onSubmit={handleCreateCategory}>
              <input
                type="text"
                placeholder="Category Name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ 
                  ...newCategory, 
                  name: e.target.value 
                })}
                required
              />
              <input
                type="number"
                placeholder="Parent ID (optional)"
                value={newCategory.parentId || ''}
                onChange={(e) => setNewCategory({ 
                  ...newCategory, 
                  parentId: e.target.value ? Number(e.target.value) : null 
                })}
              />
              <button type="submit">Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

CategorySelector.propTypes = {
  categories: PropTypes.array,
  refreshCategories: PropTypes.func.isRequired
};

export default CategorySelector;
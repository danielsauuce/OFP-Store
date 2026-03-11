import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Eye, Loader, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './components/Modal';
import Pagination from './components/Pagination';
import {
  getAllProductsAdminService,
  createProductService,
  updateProductService,
  deleteProductService,
} from '../../services/adminService';
import { getAllCategoriesService } from '../../services/categoryService';
import { uploadImageService } from '../../services/uploadService';

const PRODUCTS_PER_PAGE = 8;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    shortDescription: '',
    material: '',
    inStock: true,
    stockQuantity: 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  // Categories rarely change — fetch only on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = async (page) => {
    setLoading(true);
    try {
      const data = await getAllProductsAdminService({ page, limit: PRODUCTS_PER_PAGE });
      if (data?.success) {
        setProducts(data.data?.products || data.products || []);
        const pag = data.data?.pagination || data.pagination;
        setTotalPages(pag?.pages || 1);
        setTotalProducts(pag?.total || 0);
      }
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getAllCategoriesService();
      if (data?.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form handlers
  const resetForm = () => {
    // Revoke previous blob URL to prevent memory leak
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setFormData({
      name: '',
      price: '',
      category: '',
      description: '',
      shortDescription: '',
      material: '',
      inStock: true,
      stockQuantity: 0,
    });
    setImageFile(null);
    setImagePreview('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stockQuantity' ? Number(value) || 0 : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setImageFile(file);
    // Revoke previous blob URL to prevent memory leak
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(URL.createObjectURL(file));
  };

  // Only allow safe protocols in image preview src to prevent XSS
  const safeImagePreview =
    imagePreview &&
    (imagePreview.startsWith('blob:') ||
      imagePreview.startsWith('https://') ||
      imagePreview.startsWith('http://'))
      ? imagePreview
      : '';

  // Open modals
  const openAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const openEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      price: product.price || '',
      category:
        typeof product.category === 'object' ? product.category._id : product.category || '',
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      material: product.material || '',
      inStock: product.inStock ?? true,
      stockQuantity: product.stockQuantity || 0,
    });
    setImageFile(null);
    setImagePreview(product.primaryImage?.secureUrl || product.primaryImage?.url || '');
    setIsEditOpen(true);
  };

  const openDelete = (product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const openView = (product) => {
    setSelectedProduct(product);
    setIsViewOpen(true);
  };

  // Upload image helper
  const uploadImage = async () => {
    if (!imageFile) return null;
    try {
      const data = await uploadImageService(imageFile, 'products');
      if (data?.success && data.media) {
        // Controller returns media.id (not _id)
        return data.media.id || data.media._id;
      }
      return null;
    } catch (error) {
      toast.error('Image upload failed');
      return null;
    }
  };

  // CRUD actions
  const handleAdd = async () => {
    if (!formData.name || !formData.category || !formData.price) {
      toast.error('Please fill in name, category, and price');
      return;
    }

    if (!imageFile) {
      toast.error('Please select a product image');
      return;
    }

    setSubmitting(true);
    try {
      const primaryImage = await uploadImage();
      if (!primaryImage) {
        toast.error('Image upload failed — cannot create product without an image');
        setSubmitting(false);
        return;
      }

      // Build payload — exclude inStock (auto-calculated from stockQuantity in pre-save hook)
      const { inStock, ...rest } = formData;
      const payload = {
        ...rest,
        primaryImage,
        price: Number(rest.price),
        stockQuantity: Number(rest.stockQuantity) || 0,
      };

      const data = await createProductService(payload);
      if (data?.success) {
        toast.success(`Product "${formData.name}" created successfully`);
        setIsAddOpen(false);
        resetForm();
        fetchProducts(currentPage);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;
    if (!formData.name || !formData.category || !formData.price) {
      toast.error('Please fill in name, category, and price');
      return;
    }

    setSubmitting(true);
    try {
      let primaryImage = undefined;
      if (imageFile) {
        primaryImage = await uploadImage();
      }

      // Build payload — exclude inStock (auto-calculated from stockQuantity in pre-save hook)
      const { inStock, ...rest } = formData;
      const payload = {
        ...rest,
        price: Number(rest.price),
        stockQuantity: Number(rest.stockQuantity) || 0,
      };
      if (primaryImage) payload.primaryImage = primaryImage;

      const data = await updateProductService(selectedProduct._id, payload);
      if (data?.success) {
        toast.success(`Product "${formData.name}" updated successfully`);
        setIsEditOpen(false);
        resetForm();
        fetchProducts(currentPage);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      const data = await deleteProductService(selectedProduct._id);
      if (data?.success) {
        toast.success(`Product "${selectedProduct.name}" deleted`);
        setIsDeleteOpen(false);
        setSelectedProduct(null);
        fetchProducts(currentPage);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  // Helpers
  const getProductImage = (product) =>
    product.primaryImage?.secureUrl || product.primaryImage?.url || '/placeholder.jpg';

  const getCategoryName = (product) =>
    typeof product.category === 'object' ? product.category?.name : product.category || '';

  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Shared form fields component
  const renderFormFields = () => (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">Product Name *</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter product name"
          className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">Price (£) *</label>
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="0.00"
            className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">Product Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary-dark"
        />
        {safeImagePreview && (
          <img
            src={safeImagePreview}
            alt="Preview"
            className="w-24 h-24 object-cover rounded-lg mt-2"
          />
        )}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">Material</label>
        <input
          name="material"
          value={formData.material}
          onChange={handleInputChange}
          placeholder="e.g., Oak Wood, Leather"
          className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">Stock Quantity</label>
          <input
            name="stockQuantity"
            type="number"
            min="0"
            value={formData.stockQuantity}
            onChange={handleInputChange}
            className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>

        <div className="flex items-end pb-1">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                Number(formData.stockQuantity) > 0 ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                  Number(formData.stockQuantity) > 0 ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </span>
            <span className="text-sm font-medium text-foreground">
              {Number(formData.stockQuantity) > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground ml-2">(derived from quantity)</span>
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">Short Description</label>
        <input
          name="shortDescription"
          value={formData.shortDescription}
          onChange={handleInputChange}
          placeholder="Brief summary..."
          className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Detailed product description..."
          rows={3}
          className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Products Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your furniture inventory ({totalProducts} products)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchProducts(currentPage)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Pagination Info */}
      <p className="text-sm text-muted-foreground">
        {totalProducts > 0
          ? `Showing ${Math.min(startIndex + 1, totalProducts)}–${Math.min(startIndex + PRODUCTS_PER_PAGE, totalProducts)} of ${totalProducts} products`
          : 'No products to display'}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No products found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-card p-6 rounded-lg shadow-card border border-border hover:scale-[1.01] transition-transform"
            >
              <div className="flex gap-6">
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{getCategoryName(product)}</p>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.inStock
                          ? 'bg-accent/20 text-accent'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  {product.shortDescription && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.shortDescription}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-primary">
                      £{Number(product.price).toFixed(2)}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openView(product)}
                        className="p-2 rounded-md border border-border hover:bg-muted"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEdit(product)}
                        className="p-2 rounded-md border border-border hover:bg-muted"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDelete(product)}
                        className="p-2 rounded-md border border-border hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Product"
        maxWidth="max-w-lg"
      >
        {renderFormFields()}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => setIsAddOpen(false)}
            className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={submitting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Product"
        maxWidth="max-w-lg"
      >
        {renderFormFields()}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => setIsEditOpen(false)}
            className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEdit}
            disabled={submitting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Product Details"
        maxWidth="max-w-lg"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <img
              src={getProductImage(selectedProduct)}
              alt={selectedProduct.name}
              className="w-full h-48 object-cover rounded-lg"
            />
            <h3 className="text-xl font-semibold text-foreground">{selectedProduct.name}</h3>
            <p className="text-2xl font-bold text-primary">
              £{Number(selectedProduct.price).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">{getCategoryName(selectedProduct)}</p>
            {selectedProduct.material && (
              <p className="text-sm text-muted-foreground">Material: {selectedProduct.material}</p>
            )}
            {selectedProduct.description && (
              <p className="text-sm text-foreground">{selectedProduct.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Stock:</span>
              <span className="font-medium text-foreground">
                {selectedProduct.stockQuantity || 0} units
              </span>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedProduct.inStock
                    ? 'bg-accent/20 text-accent'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {selectedProduct.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Product"
        description={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
      >
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => setIsDeleteOpen(false)}
            className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md font-medium hover:bg-destructive/90 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Deleting...' : 'Delete Product'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Products;

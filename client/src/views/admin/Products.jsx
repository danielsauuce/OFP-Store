import { useState, useEffect, useMemo } from 'react';
import {
  Edit,
  Trash2,
  Plus,
  Eye,
  Loader,
  Search,
  Package,
  Tag,
  Layers,
  ImageIcon,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './components/Modal';
import {
  getAllProductsAdminService,
  createProductService,
  updateProductService,
  deleteProductService,
} from '../../services/adminService';
import { getAllCategoriesService } from '../../services/categoryService';
import { uploadImageService } from '../../services/uploadService';

const PRODUCTS_PER_PAGE = 12;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'];

const isAllowedImageType = (file) => ALLOWED_IMAGE_MIMES.includes(file.type);

const EMPTY_FORM = {
  name: '',
  price: '',
  category: '',
  description: '',
  shortDescription: '',
  material: '',
  stockQuantity: 0,
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);

  const previewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

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
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getAllCategoriesService();
      if (data?.success) setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setImageFile(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'price' || name === 'stockQuantity'
            ? Number(value) || 0
            : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAllowedImageType(file)) {
      toast.error('Please select PNG, JPEG, GIF, or WebP');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be under 5MB');
      return;
    }
    setImageFile(file);
  };

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
      stockQuantity: product.stockQuantity || 0,
    });
    setImageFile(null);
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

  // Strip empty optional strings so Joi doesn't reject them
  const sanitisePayload = (obj) => {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' && v.trim() === '') continue;
      result[k] = v;
    }
    return result;
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    if (!isAllowedImageType(imageFile)) {
      toast.error('Invalid image type');
      return null;
    }
    try {
      const data = await uploadImageService(imageFile, 'products');
      if (data?.success && data.media) return data.media.id || data.media._id;
      return null;
    } catch {
      toast.error('Image upload failed');
      return null;
    }
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.category || !formData.price) {
      toast.error('Please fill in name, category, and price');
      return;
    }
    if (!formData.description || formData.description.trim().length < 20) {
      toast.error('Description must be at least 20 characters');
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
        setSubmitting(false);
        return;
      }

      const payload = sanitisePayload({
        ...formData,
        primaryImage,
        price: Number(formData.price),
        stockQuantity: Number(formData.stockQuantity) || 0,
      });

      const data = await createProductService(payload);
      if (data?.success) {
        toast.success(`"${formData.name}" created`);
        setIsAddOpen(false);
        resetForm();
        fetchProducts(currentPage);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create product');
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
    if (formData.description && formData.description.trim().length < 20) {
      toast.error('Description must be at least 20 characters');
      return;
    }

    setSubmitting(true);
    try {
      let primaryImage;
      if (imageFile) {
        primaryImage = await uploadImage();
        if (!primaryImage) {
          setSubmitting(false);
          return;
        }
      }

      const payload = sanitisePayload({
        ...formData,
        price: Number(formData.price),
        stockQuantity: Number(formData.stockQuantity) || 0,
        ...(primaryImage ? { primaryImage } : {}),
      });

      const data = await updateProductService(selectedProduct._id, payload);
      if (data?.success) {
        toast.success(`"${formData.name}" updated`);
        setIsEditOpen(false);
        resetForm();
        fetchProducts(currentPage);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update product');
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
        toast.success(`"${selectedProduct.name}" deleted`);
        setIsDeleteOpen(false);
        const newPage = products.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        setCurrentPage(newPage);
        fetchProducts(newPage);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  const getProductImage = (product) =>
    product.primaryImage?.secureUrl || product.primaryImage?.url || null;

  const getCategoryName = (product) =>
    typeof product.category === 'object' ? product.category?.name : product.category || '—';

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        getCategoryName(p).toLowerCase().includes(q),
    );
  }, [products, search]);

  const FieldLabel = ({ children }) => (
    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
      {children}
    </label>
  );

  const Input = ({ name, type = 'text', placeholder, className = '', ...rest }) => (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${className}`}
      {...rest}
    />
  );

  const renderFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Product Name *</FieldLabel>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g. Oak Dining Chair"
          />
        </div>
        <div>
          <FieldLabel>Price (£) *</FieldLabel>
          <Input
            name="price"
            type="number"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Category *</FieldLabel>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Stock Quantity</FieldLabel>
          <Input
            name="stockQuantity"
            type="number"
            value={formData.stockQuantity}
            onChange={handleInputChange}
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      <div>
        <FieldLabel>Material</FieldLabel>
        <Input
          name="material"
          value={formData.material}
          onChange={handleInputChange}
          placeholder="e.g. Solid oak, velvet upholstery"
        />
      </div>

      <div>
        <FieldLabel>Short Description</FieldLabel>
        <Input
          name="shortDescription"
          value={formData.shortDescription}
          onChange={handleInputChange}
          placeholder="Brief tagline (max 160 chars)"
          maxLength={160}
        />
      </div>

      <div>
        <FieldLabel>Full Description * (min 20 chars)</FieldLabel>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Detailed product description..."
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          {formData.description.length} / 5000 chars
        </p>
      </div>

      <div>
        <FieldLabel>Product Image {!selectedProduct && '*'}</FieldLabel>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all">
          <input
            type="file"
            accept={ALLOWED_IMAGE_MIMES.join(',')}
            onChange={handleImageChange}
            className="hidden"
          />
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-xl" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8 opacity-40" />
              <p className="text-xs">Click to upload PNG, JPEG, WebP (max 5MB)</p>
            </div>
          )}
        </label>
      </div>
    </div>
  );

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalProducts} total products</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search products by name or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {loading && products.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}

      {/* Product grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <Package className="h-14 w-14 mx-auto text-muted-foreground opacity-30 mb-4" />
          <p className="font-medium text-foreground mb-1">No products found</p>
          <p className="text-sm text-muted-foreground">
            {search ? 'Try a different search term' : 'Add your first product to get started'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const img = getProductImage(product);
            const catName = getCategoryName(product);
            return (
              <div
                key={product._id}
                className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Image */}
                <div className="relative h-44 bg-muted">
                  {img ? (
                    <img
                      src={img}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Package className="h-10 w-10 text-muted-foreground opacity-30" />
                    </div>
                  )}
                  {/* Stock badge */}
                  <div className="absolute top-2 right-2">
                    {product.inStock ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        In Stock
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-semibold">
                        <XCircle className="h-2.5 w-2.5" />
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="font-bold text-primary text-sm shrink-0">
                      £{Number(product.price).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {catName && catName !== '—' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                        <Tag className="h-2.5 w-2.5" />
                        {catName}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Layers className="h-2.5 w-2.5" />
                      {product.stockQuantity ?? 0} units
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-1 border-t border-border">
                    <button
                      aria-label={`View ${product.name}`}
                      onClick={() => openView(product)}
                      className="flex-1 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                      View
                    </button>
                    <div className="w-px h-4 bg-border" />
                    <button
                      aria-label={`Edit ${product.name}`}
                      onClick={() => openEdit(product)}
                      className="flex-1 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </button>
                    <div className="w-px h-4 bg-border" />
                    <button
                      aria-label={`Delete ${product.name}`}
                      onClick={() => openDelete(product)}
                      className="flex-1 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-md transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted border border-border'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── ADD MODAL ── */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Product"
        description="Fill in the details below to add a new product to your catalogue"
        maxWidth="max-w-2xl"
      >
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button
            onClick={() => setIsAddOpen(false)}
            className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={submitting}
            className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {submitting && <Loader className="h-3.5 w-3.5 animate-spin" />}
            {submitting ? 'Creating…' : 'Create Product'}
          </button>
        </div>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Product"
        description={`Editing: ${selectedProduct?.name || ''}`}
        maxWidth="max-w-2xl"
      >
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button
            onClick={() => setIsEditOpen(false)}
            className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEdit}
            disabled={submitting}
            className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {submitting && <Loader className="h-3.5 w-3.5 animate-spin" />}
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* ── VIEW MODAL ── */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Product Details"
        maxWidth="max-w-lg"
      >
        {selectedProduct && (
          <div className="space-y-4">
            {getProductImage(selectedProduct) && (
              <div className="w-full h-52 rounded-xl overflow-hidden bg-muted">
                <img
                  src={getProductImage(selectedProduct)}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Name</p>
                <p className="text-sm font-medium text-foreground">{selectedProduct.name}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Price</p>
                <p className="text-sm font-bold text-primary">£{Number(selectedProduct.price).toFixed(2)}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Category</p>
                <p className="text-sm text-foreground">{getCategoryName(selectedProduct)}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Stock</p>
                <p className="text-sm text-foreground">
                  {selectedProduct.stockQuantity ?? 0} units
                </p>
              </div>
              {selectedProduct.material && (
                <div className="bg-muted/40 rounded-lg p-3 col-span-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Material</p>
                  <p className="text-sm text-foreground">{selectedProduct.material}</p>
                </div>
              )}
            </div>

            {selectedProduct.description && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-foreground leading-relaxed">{selectedProduct.description}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedProduct.inStock
                    ? 'bg-green-100 text-green-700'
                    : 'bg-destructive/15 text-destructive'
                }`}
              >
                {selectedProduct.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsViewOpen(false);
                    openEdit(selectedProduct);
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors flex items-center gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setIsViewOpen(false)}
                  className="px-3 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── DELETE MODAL ── */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Product"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
            <Trash2 className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">This action is irreversible</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Deleting <strong>&quot;{selectedProduct?.name}&quot;</strong> will permanently remove it and all associated media from the system.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <Loader className="h-3.5 w-3.5 animate-spin" />}
              {submitting ? 'Deleting…' : 'Delete Product'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Products;

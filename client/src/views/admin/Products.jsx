import { useState } from 'react';
import { Edit, Trash2, Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../admin/components/Modal';
import ProductFormFields from '../admin/components/Productformfields';
import Pagination from '../admin/components/Pagination';
import { initialProducts, emptyProduct } from '../../data/ProductsData';

const PRODUCTS_PER_PAGE = 6;

const Products = () => {
  const [productList, setProductList] = useState(initialProducts);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState(emptyProduct);

  const isSafeCloudinaryUrl = (url) => {
    if (!url || typeof url !== 'string') return false;

    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && parsed.hostname.endsWith('cloudinary.com');
    } catch {
      return false;
    }
  };

  // --- Pagination ---
  const totalPages = Math.ceil(productList.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = productList.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Form handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleStockChange = (checked) => {
    setFormData((prev) => ({ ...prev, inStock: checked }));
  };

  // --- Dialog openers ---
  const openAdd = () => {
    setFormData({ ...emptyProduct });
    setIsAddOpen(true);
  };

  const openEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      description: product.description,
      material: product.material,
      inStock: product.inStock,
    });
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

  // --- CRUD actions ---
  const handleAdd = () => {
    if (!formData.name || !formData.category || formData.price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newProduct = { id: `prod-${Date.now()}`, ...formData };
    setProductList((prev) => [...prev, newProduct]);
    setIsAddOpen(false);
    setFormData({ ...emptyProduct });
    toast.success(`Product "${newProduct.name}" added successfully!`);

    // Jump to last page to show the new product
    const newTotal = Math.ceil((productList.length + 1) / PRODUCTS_PER_PAGE);
    setCurrentPage(newTotal);
  };

  const handleEdit = () => {
    if (!selectedProduct) return;
    if (!formData.name || !formData.category || formData.price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setProductList((prev) =>
      prev.map((p) => (p.id === selectedProduct.id ? { ...p, ...formData } : p)),
    );
    setIsEditOpen(false);
    setSelectedProduct(null);
    setFormData({ ...emptyProduct });
    toast.success(`Product "${formData.name}" updated successfully!`);
  };

  const handleDelete = () => {
    if (!selectedProduct) return;

    const updatedList = productList.filter((p) => p.id !== selectedProduct.id);
    setProductList(updatedList);
    setIsDeleteOpen(false);
    toast.success(`Product "${selectedProduct.name}" deleted successfully!`);
    setSelectedProduct(null);

    // If current page is now empty, go back a page
    const newTotal = Math.ceil(updatedList.length / PRODUCTS_PER_PAGE);
    if (currentPage > newTotal && newTotal > 0) {
      setCurrentPage(newTotal);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Products Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your furniture inventory ({productList.length} products)
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Pagination Info */}
      <p className="text-sm text-muted-foreground">
        Showing {startIndex + 1}–{Math.min(startIndex + PRODUCTS_PER_PAGE, productList.length)} of{' '}
        {productList.length} products
      </p>

      {/* Product List */}
      <div className="grid gap-4">
        {paginatedProducts.map((product) => (
          <div
            key={product.id}
            className="bg-card p-6 rounded-lg shadow-card border border-border hover:scale-[1.01] transition-transform"
          >
            <div className="flex gap-6">
              <img
                src={isSafeCloudinaryUrl(product.image) ? product.image : '/placeholder.jpg'}
                alt={product.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.inStock
                        ? 'bg-accent/20 text-accent'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                {product.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-primary">£{product.price.toFixed(2)}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openView(product)}
                      className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEdit(product)}
                      className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDelete(product)}
                      className="p-2 rounded-md border border-border text-destructive hover:bg-destructive/10 transition-colors"
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

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Product"
        description="Fill in the details to add a new product to your inventory."
      >
        <ProductFormFields
          formData={formData}
          onInputChange={handleInputChange}
          onCategoryChange={handleCategoryChange}
          onStockChange={handleStockChange}
        />
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => setIsAddOpen(false)}
            className="px-4 py-2 rounded-md border border-border text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary-dark transition-colors"
          >
            Add Product
          </button>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Product"
        description="Update the product details below."
      >
        <ProductFormFields
          formData={formData}
          onInputChange={handleInputChange}
          onCategoryChange={handleCategoryChange}
          onStockChange={handleStockChange}
        />
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => setIsEditOpen(false)}
            className="px-4 py-2 rounded-md border border-border text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEdit}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary-dark transition-colors"
          >
            Save Changes
          </button>
        </div>
      </Modal>

      {/* View Product Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Product Details">
        {selectedProduct && (
          <div className="space-y-4">
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="w-full h-48 object-cover rounded-lg"
            />
            <div>
              <h3 className="text-xl font-semibold text-foreground">{selectedProduct.name}</h3>
              <span
                className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedProduct.inStock
                    ? 'bg-accent/20 text-accent'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {selectedProduct.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Price:</span>
                <p className="font-semibold text-primary">£{selectedProduct.price.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span>
                <p className="font-medium text-foreground">{selectedProduct.category}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Material:</span>
                <p className="font-medium text-foreground">{selectedProduct.material || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">ID:</span>
                <p className="font-mono text-xs text-foreground">{selectedProduct.id}</p>
              </div>
            </div>

            {selectedProduct.description && (
              <div>
                <span className="text-sm text-muted-foreground">Description:</span>
                <p className="text-sm mt-1 text-foreground">{selectedProduct.description}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsViewOpen(false)}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary-dark transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Product"
        description={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
      >
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => setIsDeleteOpen(false)}
            className="px-4 py-2 rounded-md border border-border text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Products;

import { useState } from 'react';
import { Edit, Trash2, Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../admin/components/Modal';
import ProductFormFields from '../admin/components/Productformfields';
import Pagination from '../admin/components/Pagination';
import { initialProducts, emptyProduct } from '../../data/ProductsData';

const PRODUCTS_PER_PAGE = 6;

// Cloudinary URL validator
const isSafeCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);

    const allowedHosts = ['res.cloudinary.com'];

    if (parsed.protocol !== 'https:') return false;
    if (!allowedHosts.includes(parsed.hostname)) return false;

    return true;
  } catch {
    return false;
  }
};

const Products = () => {
  const [productList, setProductList] = useState(initialProducts);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState(emptyProduct);

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

    const newTotal = Math.ceil(updatedList.length / PRODUCTS_PER_PAGE);

    if (currentPage > newTotal && newTotal > 0) {
      setCurrentPage(newTotal);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* View Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Product Details">
        {selectedProduct && (
          <div className="space-y-4">
            <img
              src={
                isSafeCloudinaryUrl(selectedProduct.image)
                  ? selectedProduct.image
                  : '/placeholder.jpg'
              }
              alt={selectedProduct.name}
              className="w-full h-48 object-cover rounded-lg"
            />

            <h3 className="text-xl font-semibold">{selectedProduct.name}</h3>

            {selectedProduct.description && (
              <p className="text-sm">{selectedProduct.description}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Products;

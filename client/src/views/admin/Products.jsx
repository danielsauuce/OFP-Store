import { useState, useEffect, useMemo } from 'react';
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
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
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
      inStock: product.inStock ?? true,
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

  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      const data = await uploadImageService(imageFile, 'products');

      if (data?.success && data.media) {
        return data.media.id || data.media._id;
      }

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

    if (!imageFile) {
      toast.error('Please select a product image');
      return;
    }

    setSubmitting(true);

    try {
      const primaryImage = await uploadImage();

      if (!primaryImage) {
        toast.error('Image upload failed');
        setSubmitting(false);
        return;
      }

      const { inStock, ...rest } = formData;

      const payload = {
        ...rest,
        primaryImage,
        price: Number(rest.price),
        stockQuantity: Number(rest.stockQuantity) || 0,
      };

      const data = await createProductService(payload);

      if (data?.success) {
        toast.success(`Product "${formData.name}" created`);
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

    setSubmitting(true);

    try {
      let primaryImage;

      if (imageFile) {
        primaryImage = await uploadImage();
      }

      const { inStock, ...rest } = formData;

      const payload = {
        ...rest,
        price: Number(rest.price),
        stockQuantity: Number(rest.stockQuantity) || 0,
      };

      if (primaryImage) payload.primaryImage = primaryImage;

      const data = await updateProductService(selectedProduct._id, payload);

      if (data?.success) {
        toast.success(`Product "${formData.name}" updated`);
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
        toast.success(`Product "${selectedProduct.name}" deleted`);
        setIsDeleteOpen(false);
        fetchProducts(currentPage);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

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

  const renderFormFields = () => (
    <div className="grid gap-4 py-2">
      <input
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        placeholder="Product Name"
        className="input"
      />

      <input
        name="price"
        type="number"
        value={formData.price}
        onChange={handleInputChange}
        placeholder="Price"
        className="input"
      />

      <select name="category" value={formData.category} onChange={handleInputChange}>
        <option value="">Select category</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.name}
          </option>
        ))}
      </select>

      <input type="file" accept="image/*" onChange={handleImageChange} />

      {previewUrl && (
        <img src={previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
      )}

      <textarea
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        placeholder="Description"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Products Management</h1>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {products.map((product) => (
        <div key={product._id} className="border p-4 rounded flex gap-4">
          <img
            src={getProductImage(product)}
            alt={product.name}
            className="w-24 h-24 object-cover"
          />

          <div className="flex-1">
            <h3 className="font-semibold">{product.name}</h3>
            <p>£{Number(product.price).toFixed(2)}</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => openView(product)}>
              <Eye />
            </button>

            <button onClick={() => openEdit(product)}>
              <Edit />
            </button>

            <button onClick={() => openDelete(product)}>
              <Trash2 />
            </button>
          </div>
        </div>
      ))}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Product">
        {renderFormFields()}

        <button onClick={handleAdd} disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Product'}
        </button>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Product">
        {renderFormFields()}

        <button onClick={handleEdit} disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Product">
        <button onClick={handleDelete} disabled={submitting}>
          {submitting ? 'Deleting...' : 'Delete Product'}
        </button>
      </Modal>
    </div>
  );
};

export default Products;

import { categories } from '../../../data/ProductsData';

const ProductFormFields = ({ formData, onInputChange, onCategoryChange, onStockChange }) => {
  return (
    <div className="grid gap-4 py-4">
      {/* Product Name */}
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Product Name *
        </label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={onInputChange}
          placeholder="Enter product name"
          className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        />
      </div>

      {/* Price + Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label htmlFor="price" className="text-sm font-medium text-foreground">
            Price (£) *
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price || ''}
            onChange={onInputChange}
            placeholder="0.00"
            className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="category" className="text-sm font-medium text-foreground">
            Category *
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          >
            <option value="">Select</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Image URL */}
      <div className="grid gap-2">
        <label htmlFor="image" className="text-sm font-medium text-foreground">
          Image URL
        </label>
        <input
          id="image"
          name="image"
          value={formData.image}
          onChange={onInputChange}
          placeholder="https://example.com/image.jpg"
          className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        />
      </div>

      {/* Material */}
      <div className="grid gap-2">
        <label htmlFor="material" className="text-sm font-medium text-foreground">
          Material
        </label>
        <input
          id="material"
          name="material"
          value={formData.material}
          onChange={onInputChange}
          placeholder="e.g., Oak Wood, Leather"
          className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        />
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onInputChange}
          placeholder="Describe the product..."
          rows={3}
          className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
        />
      </div>

      {/* In Stock Toggle */}
      <div className="flex items-center justify-between">
        <label htmlFor="inStock" className="text-sm font-medium text-foreground">
          In Stock
        </label>
        <button
          type="button"
          role="switch"
          id="inStock"
          aria-checked={formData.inStock}
          onClick={() => onStockChange(!formData.inStock)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            formData.inStock ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
              formData.inStock ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default ProductFormFields;

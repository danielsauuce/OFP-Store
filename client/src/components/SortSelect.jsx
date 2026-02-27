const SortSelect = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="sort" className="text-card-foreground font-medium">
        Sort by:
      </label>

      <select
        id="sort"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-border rounded-lg px-4 py-2 bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="newest">Newest First</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
        <option value="name">Name: A to Z</option>
      </select>
    </div>
  );
};

export default SortSelect;

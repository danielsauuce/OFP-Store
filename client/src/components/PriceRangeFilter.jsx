const PriceRangeFilter = ({ range, onChange }) => {
  return (
    <div className="mb-6">
      <label className="mb-3 block font-semibold text-card-foreground">
        Price Range: £{range[0]} – £{range[1]}
      </label>

      <input
        type="range"
        min="0"
        max="5000"
        step="50"
        value={range[1]}
        onChange={(e) => onChange([range[0], Number(e.target.value)])}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-primary"
      />
    </div>
  );
};

export default PriceRangeFilter;

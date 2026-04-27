const PriceRangeFilter = ({ range, onChange }) => {
  return (
    <div className="mb-6">
      <label className="mb-3 block font-semibold text-card-foreground">
        Price Range: ₦{range[0].toLocaleString('en-NG')} – ₦{range[1].toLocaleString('en-NG')}
      </label>

      <input
        type="range"
        min="0"
        max="500000"
        step="5000"
        value={range[1]}
        onChange={(e) => onChange([range[0], Number(e.target.value)])}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-primary"
      />
    </div>
  );
};

export default PriceRangeFilter;

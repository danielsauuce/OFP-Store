const CategoryFilter = ({ categories, selected, onChange }) => {
  return (
    <div className="category-filter">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Categories
      </p>
      <div className="space-y-0.5 max-h-72 overflow-y-auto pr-0.5">
        {categories.map((category) => {
          const isActive = selected === category;
          return (
            <button
              key={category}
              onClick={() => onChange(category)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-between group ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground hover:bg-muted/80'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors ${
                    isActive
                      ? 'bg-primary-foreground'
                      : 'bg-muted-foreground/40 group-hover:bg-primary/40'
                  }`}
                />
                {category}
              </span>
              {isActive && (
                <svg
                  className="h-3.5 w-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;

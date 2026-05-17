"use client";

import * as React from "react";
import { PackageSearch, Search } from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { EmptyState } from "@/components/storefront/EmptyState";
import type { CartProduct } from "@/store/useCartStore";

export interface StorefrontCategory {
  id: string;
  name: string;
}

interface ProductsBrowserProps {
  products: CartProduct[];
  categories: StorefrontCategory[];
  createdAtMap: Record<string, number>;
}

type SortKey = "newest" | "price-asc" | "price-desc";

export function ProductsBrowser({
  products,
  categories,
  createdAtMap,
}: ProductsBrowserProps): React.ReactElement {
  const [search, setSearch] = React.useState<string>("");
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<SortKey>("newest");

  // กรอง + เรียงสินค้าใหม่ทุกครั้งที่ filter เปลี่ยน
  const filtered = React.useMemo<CartProduct[]>(() => {
    const q = search.trim().toLowerCase();

    const matched = products.filter((p) => {
      const matchCat = activeCategory === "all" || p.categoryId === activeCategory;
      const matchQ =
        q.length === 0 ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    const sorted = [...matched];
    if (sortBy === "price-asc") {
      sorted.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === "price-desc") {
      sorted.sort((a, b) => b.basePrice - a.basePrice);
    } else {
      sorted.sort((a, b) => (createdAtMap[b.id] ?? 0) - (createdAtMap[a.id] ?? 0));
    }
    return sorted;
  }, [products, search, activeCategory, sortBy, createdAtMap]);

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E8E0D5] bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#736B66]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or SKU..."
            className="h-10 w-full rounded-lg border border-[#E8E0D5] bg-white pl-10 pr-3 text-sm text-[#2D2825] placeholder:text-[#736B66] outline-none transition-colors focus:border-[#CC785C] focus:ring-2 focus:ring-[#CC785C]/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="sort-select"
            className="text-xs font-medium uppercase tracking-wider text-[#736B66]"
          >
            Sort
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="h-10 rounded-lg border border-[#E8E0D5] bg-white px-3 text-sm text-[#2D2825] outline-none transition-colors focus:border-[#CC785C] focus:ring-2 focus:ring-[#CC785C]/20"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <CategoryPill
          label="All"
          count={products.length}
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
        />
        {categories.map((cat) => {
          const count = products.filter((p) => p.categoryId === cat.id).length;
          return (
            <CategoryPill
              key={cat.id}
              label={cat.name}
              count={count}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            />
          );
        })}
      </div>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No products match your filters"
          description="Try adjusting your search terms or selecting a different category."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryPillProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function CategoryPill({
  label,
  count,
  active,
  onClick,
}: CategoryPillProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-[#CC785C] bg-[#CC785C] text-white"
          : "border-[#E8E0D5] bg-white text-[#2D2825] hover:border-[#CC785C]/40 hover:text-[#CC785C]"
      }`}
    >
      <span>{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          active ? "bg-white/20 text-white" : "bg-[#F5F0E8] text-[#736B66]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

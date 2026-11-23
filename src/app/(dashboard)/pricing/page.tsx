"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/header";
import { 
  IndianRupee, 
  Search, 
  ArrowUpDown, 
  Save, 
  RefreshCw, 
  Sparkles, 
  Tag, 
  Check, 
  AlertCircle,
  Eye,
  Sliders,
  CheckCircle2
} from "lucide-react";
import { Product } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface EditablePriceRow {
  id: string;
  title: string;
  price: number;
  original_price: number;
  discount_percentage: number;
  isModified: boolean;
}

export default function PricingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editableRows, setEditableRows] = useState<Record<string, EditablePriceRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"price" | "discount" | "title">("title");
  const [sortAsc, setSortAsc] = useState(true);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  // Bulk tool modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkDiscountPct, setBulkDiscountPct] = useState(25);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
        const map: Record<string, EditablePriceRow> = {};
        data.products.forEach((p: Product) => {
          map[p.id] = {
            id: p.id,
            title: p.title,
            price: p.price,
            original_price: p.original_price || p.price,
            discount_percentage: p.discount_percentage || 0,
            isModified: false,
          };
        });
        setEditableRows(map);
        if (data.products.length > 0 && !activePreviewId) {
          setActivePreviewId(data.products[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load pricing products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handlePriceChange = (id: string, newPrice: number) => {
    setEditableRows((prev) => {
      const row = prev[id];
      if (!row) return prev;
      let disc = 0;
      if (row.original_price > newPrice && newPrice > 0) {
        disc = Math.round(((row.original_price - newPrice) / row.original_price) * 100);
      }
      return {
        ...prev,
        [id]: {
          ...row,
          price: newPrice,
          discount_percentage: disc,
          isModified: true,
        },
      };
    });
  };

  const handleOriginalPriceChange = (id: string, newOrig: number) => {
    setEditableRows((prev) => {
      const row = prev[id];
      if (!row) return prev;
      let disc = 0;
      if (newOrig > row.price && row.price > 0) {
        disc = Math.round(((newOrig - row.price) / newOrig) * 100);
      }
      return {
        ...prev,
        [id]: {
          ...row,
          original_price: newOrig,
          discount_percentage: disc,
          isModified: true,
        },
      };
    });
  };

  const handleDiscountChange = (id: string, newDiscount: number) => {
    setEditableRows((prev) => {
      const row = prev[id];
      if (!row) return prev;
      const base = row.original_price > 0 ? row.original_price : row.price;
      const calculatedPrice = Math.round(base * (1 - newDiscount / 100));
      return {
        ...prev,
        [id]: {
          ...row,
          price: calculatedPrice,
          original_price: base,
          discount_percentage: newDiscount,
          isModified: true,
        },
      };
    });
  };

  const handleSaveRow = async (id: string) => {
    const row = editableRows[id];
    if (!row) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: [row] }),
      });
      if (res.ok) {
        setEditableRows((prev) => ({
          ...prev,
          [id]: { ...row, isModified: false },
        }));
      } else {
        alert("Failed to save price");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllModified = async () => {
    const modified = Object.values(editableRows).filter((r) => r.isModified);
    if (modified.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: modified }),
      });
      if (res.ok) {
        setEditableRows((prev) => {
          const next = { ...prev };
          modified.forEach((m) => {
            if (next[m.id]) next[m.id].isModified = false;
          });
          return next;
        });
        setBulkNotice(`Saved pricing updates across ${modified.length} products!`);
        setTimeout(() => setBulkNotice(null), 4000);
      } else {
        alert("Failed to save prices");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const applyBulkDiscountToAll = () => {
    setEditableRows((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        const row = next[id];
        const base = row.original_price > 0 ? row.original_price : row.price;
        const newPrice = Math.round(base * (1 - bulkDiscountPct / 100));
        next[id] = {
          ...row,
          price: newPrice,
          original_price: base,
          discount_percentage: bulkDiscountPct,
          isModified: true,
        };
      });
      return next;
    });
    setBulkModalOpen(false);
  };

  // Filter and sort products
  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const modifiedCount = Object.values(editableRows).filter((r) => r.isModified).length;
  const activePreviewRow = activePreviewId ? editableRows[activePreviewId] : null;

  return (
    <div className="flex flex-col min-h-full">
      <AdminHeader
        title="Pricing & Discount Manager"
        subtitle="Perform inline adjustments, bulk discount campaigns & preview customer price tags"
      />

      <div className="p-6 space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={() => setBulkModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Bulk Campaign Tool</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {modifiedCount > 0 && (
              <button
                onClick={handleSaveAllModified}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors animate-pulse"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All ({modifiedCount}) Changes</span>
              </button>
            )}

            <button
              onClick={fetchProducts}
              disabled={loading}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {bulkNotice && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p>{bulkNotice}</p>
          </div>
        )}

        {/* 2-Column Grid: Left Pricing Sheet Table + Right Live Customer App Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table (2 Cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Product Name</th>
                    <th className="py-2.5 px-3 w-28">Selling Price (₹)</th>
                    <th className="py-2.5 px-3 w-28">Original / MRP (₹)</th>
                    <th className="py-2.5 px-3 w-24">Discount %</th>
                    <th className="py-2.5 px-3 text-right w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        {loading ? "Loading pricing..." : "No products match your search."}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const row = editableRows[product.id] || {
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        original_price: product.original_price || product.price,
                        discount_percentage: product.discount_percentage || 0,
                        isModified: false,
                      };

                      const isSelected = activePreviewId === product.id;

                      return (
                        <tr
                          key={product.id}
                          onClick={() => setActivePreviewId(product.id)}
                          className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            isSelected ? "bg-amber-500/10 border-l-2 border-amber-500" : ""
                          }`}
                        >
                          {/* Title */}
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-200 truncate max-w-xs">
                              {product.title}
                            </p>
                            <span className="font-mono text-[10px] text-slate-400">
                              SKU #{product.id.slice(0, 8)}
                            </span>
                          </td>

                          {/* Editable Selling Price */}
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">
                                ₹
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={row.price}
                                onChange={(e) =>
                                  handlePriceChange(product.id, Number(e.target.value))
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded pl-5 pr-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </td>

                          {/* Editable Original Price */}
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">
                                ₹
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={row.original_price}
                                onChange={(e) =>
                                  handleOriginalPriceChange(product.id, Number(e.target.value))
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded pl-5 pr-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </td>

                          {/* Editable Discount % */}
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="99"
                                value={row.discount_percentage}
                                onChange={(e) =>
                                  handleDiscountChange(product.id, Number(e.target.value))
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded pr-6 pl-2 py-1 text-xs text-emerald-400 font-semibold focus:outline-none focus:border-amber-500"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                                %
                              </span>
                            </div>
                          </td>

                          {/* Save Row */}
                          <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            {row.isModified ? (
                              <button
                                onClick={() => handleSaveRow(product.id)}
                                disabled={saving}
                                title="Save Row Changes"
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[10px] font-bold shadow-sm"
                              >
                                Save
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">Saved</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Customer Mobile App Price Tag Simulation */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  Mobile App Price Tag Simulation
                </h3>
                <span className="text-[10px] font-mono text-emerald-400">Live Preview</span>
              </div>

              {activePreviewRow ? (
                <div className="p-4 rounded-xl bg-white text-slate-900 shadow-md space-y-3">
                  <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                    Customer Screen View
                  </span>

                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                    {activePreviewRow.title}
                  </h4>

                  {/* Customer App Price Display */}
                  <div className="pt-2 border-t border-slate-100 flex items-baseline gap-2.5">
                    <span className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight">
                      {formatCurrency(activePreviewRow.price)}
                    </span>

                    {activePreviewRow.original_price > activePreviewRow.price && (
                      <span className="text-xs text-slate-400 line-through font-medium">
                        {formatCurrency(activePreviewRow.original_price)}
                      </span>
                    )}

                    {activePreviewRow.discount_percentage > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        {activePreviewRow.discount_percentage}% OFF
                      </span>
                    )}
                  </div>

                  {activePreviewRow.original_price > activePreviewRow.price && (
                    <p className="text-[11px] font-semibold text-emerald-600">
                      Parent saves {formatCurrency(activePreviewRow.original_price - activePreviewRow.price)}!
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">
                  Select a product row to inspect mobile price rendering.
                </p>
              )}

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Operational Guideline:</p>
                <p>
                  Selling prices and discount tags reflect immediately on product cards and checkout carts across all active mobile sessions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Campaign Tool Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Apply Universal Discount Campaign
            </h3>
            <p className="text-xs text-slate-400">
              Sets uniform discount percentage across all products based on their MRP/Original Price.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Universal Discount Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="90"
                value={bulkDiscountPct}
                onChange={(e) => setBulkDiscountPct(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setBulkModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={applyBulkDiscountToAll}
                className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
              >
                Apply to Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";
import {
  useListMaterials,
  useListInventory,
  type InventoryItem,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Plus,
  Download,
  SlidersHorizontal,
  ShoppingCart,
  Printer,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  Phone,
  Package,
  Droplet,
  SprayCan,
  ArrowRight,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

// =============================================================================
// Status card
// =============================================================================
type StatusTone = "rose" | "emerald" | "amber" | "sky";

const STATUS_TONE: Record<
  StatusTone,
  { iconBg: string; iconColor: string; cardRing: string; titleColor: string }
> = {
  rose: {
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    cardRing: "border-rose-200/60",
    titleColor: "text-rose-700",
  },
  emerald: {
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    cardRing: "border-emerald-200/60",
    titleColor: "text-emerald-700",
  },
  amber: {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    cardRing: "border-amber-200/60",
    titleColor: "text-amber-700",
  },
  sky: {
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    cardRing: "border-sky-200/60",
    titleColor: "text-sky-700",
  },
};

function StatusCard({
  icon: Icon,
  title,
  subtitle,
  value,
  tone,
  linkLabel,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  value: number | string;
  tone: StatusTone;
  linkLabel: string;
}) {
  const t = STATUS_TONE[tone];
  return (
    <Card className={`border ${t.cardRing}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${t.iconBg}`}
          >
            <Icon className={`h-5 w-5 ${t.iconColor}`} />
          </div>
          <div className="min-w-0">
            <div className={`text-xs font-semibold ${t.titleColor}`}>
              {title}
            </div>
            <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {subtitle}
            </div>
          </div>
        </div>
        <div className="mt-2 text-3xl font-bold text-foreground">{value}</div>
        <button
          type="button"
          className="mt-2 inline-flex items-center text-[11px] text-primary font-medium hover:underline gap-0.5"
        >
          {linkLabel}
          <ChevronRight className="h-3 w-3" />
        </button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Material category icon
// =============================================================================
function categoryIcon(category: string) {
  switch (category) {
    case "stain":
      return Droplet;
    case "sealer":
      return Droplet;
    case "cleaner":
      return SprayCan;
    case "prep":
      return SprayCan;
    case "equipment":
      return Wrench;
    case "supplies":
      return Package;
    default:
      return Package;
  }
}

function categoryColor(category: string) {
  switch (category) {
    case "stain":
      return "bg-amber-100 text-amber-700";
    case "sealer":
      return "bg-orange-100 text-orange-700";
    case "cleaner":
      return "bg-sky-100 text-sky-700";
    case "prep":
      return "bg-violet-100 text-violet-700";
    case "equipment":
      return "bg-slate-200 text-slate-700";
    case "supplies":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// =============================================================================
// Stain colors
// =============================================================================
const STAIN_COLORS = [
  { name: "Natural", hex: "#D4A574" },
  { name: "Cedar", hex: "#B8763E" },
  { name: "Redwood", hex: "#8B3A1F" },
  { name: "Mahogany", hex: "#5C2317" },
  { name: "Walnut", hex: "#7A5230" },
  { name: "Dark Walnut", hex: "#3F2410" },
  { name: "Charcoal", hex: "#3A3A3A" },
  { name: "Gray", hex: "#9A9A9A" },
];

function StainColorsPanel() {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">
          Popular Stain Colors
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
          View All Colors
        </Button>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {STAIN_COLORS.map((c) => (
            <div key={c.name} className="text-center">
              <div
                className="h-12 w-full rounded-md border border-black/10 shadow-inner mb-1"
                style={{ backgroundColor: c.hex }}
              />
              <div className="text-[10px] text-foreground font-medium leading-tight">
                {c.name}
              </div>
            </div>
          ))}
        </div>
        <Button
          className="w-full h-8 text-xs gap-1 bg-primary"
          size="sm"
        >
          View All Stain Colors & Samples
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Equipment readiness
// =============================================================================
const EQUIPMENT_READINESS = [
  { name: "Sprayers", ready: 10, total: 12, icon: SprayCan },
  { name: "Hoses", ready: 18, total: 20, icon: Wrench },
  { name: "Tips & Nozzles", ready: 32, total: 36, icon: Wrench },
  { name: "Respirator Masks", ready: 25, total: 28, icon: Wrench },
  { name: "Painters Tape", ready: 16, total: 18, icon: Package },
  { name: "Cleaners", ready: 12, total: 14, icon: SprayCan },
  { name: "PPE (Gloves, Goggles)", ready: 20, total: 24, icon: Wrench },
];

function EquipmentReadinessPanel() {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">
          Equipment Readiness
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
          All Equipment
        </Button>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {EQUIPMENT_READINESS.map((e) => {
          const pct = (e.ready / e.total) * 100;
          const barColor =
            pct >= 90
              ? "bg-emerald-500"
              : pct >= 75
                ? "bg-amber-500"
                : "bg-rose-500";
          return (
            <div key={e.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-foreground min-w-0">
                  <e.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{e.name}</span>
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                  {e.ready}/{e.total} Ready
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        <Button
          className="w-full h-8 text-xs gap-1 mt-2 bg-primary"
          size="sm"
        >
          View Equipment Details
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Key suppliers
// =============================================================================
const KEY_SUPPLIERS = [
  {
    name: "USSI Supply Co.",
    phone: "(800) 555-0123",
    email: "orders@ussisupply.com",
    color: "bg-amber-100 text-amber-700",
    initials: "US",
  },
  {
    name: "Sherwin-Williams",
    phone: "(800) 474-3794",
    email: "sales@sherwin.com",
    color: "bg-rose-100 text-rose-700",
    initials: "SW",
  },
  {
    name: "HD Supply",
    phone: "(800) 431-3000",
    email: "prodesk@hdsupply.com",
    color: "bg-orange-100 text-orange-700",
    initials: "HD",
  },
  {
    name: "3M Industrial",
    phone: "(800) 362-3550",
    email: "industrial@mmm.com",
    color: "bg-slate-200 text-slate-700",
    initials: "3M",
  },
];

function KeySuppliersPanel() {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Key Suppliers</CardTitle>
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
          View All Suppliers
        </Button>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {KEY_SUPPLIERS.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-2 p-2 border border-border rounded-md"
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold ${s.color} shrink-0`}
            >
              {s.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground truncate">
                {s.name}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {s.phone}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {s.email}
              </div>
            </div>
            <a
              href={`tel:${s.phone.replace(/[^0-9]/g, "")}`}
              className="h-7 px-2 rounded-md border border-border hover:bg-muted text-xs text-foreground flex items-center gap-1 shrink-0"
            >
              <Phone className="h-3 w-3 text-primary" />
              Call
            </a>
          </div>
        ))}
        <Button
          variant="outline"
          className="w-full h-8 text-xs gap-1 mt-1"
          size="sm"
        >
          View All Suppliers
          <ChevronRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main page
// =============================================================================
export default function MaterialsPage() {
  const PAGE_SIZE = 8;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data: materials, isLoading } = useListMaterials();
  const { data: inventory } = useListInventory();

  // Build a quick map of inventory by materialId
  const invByMaterial = useMemo(() => {
    const m = new Map<number, InventoryItem>();
    inventory?.forEach((i) => m.set(i.materialId, i));
    return m;
  }, [inventory]);

  // Stat counts
  const lowStockCount = useMemo(() => {
    return (
      inventory?.filter((i) => {
        const qty = parseFloat(i.quantityOnHand?.toString() ?? "0");
        const reorder = parseFloat(i.reorderPoint?.toString() ?? "0");
        return i.reorderPoint && qty <= reorder;
      }).length ?? 0
    );
  }, [inventory]);

  const inStockCount = useMemo(() => {
    return (
      inventory?.filter((i) => {
        const qty = parseFloat(i.quantityOnHand?.toString() ?? "0");
        const reorder = parseFloat(i.reorderPoint?.toString() ?? "0");
        return qty > reorder;
      }).length ?? 0
    );
  }, [inventory]);

  const reorderSoonCount = useMemo(() => {
    return (
      inventory?.filter((i) => {
        const qty = parseFloat(i.quantityOnHand?.toString() ?? "0");
        const reorder = parseFloat(i.reorderPoint?.toString() ?? "0");
        // Within 25% above reorder point
        return (
          i.reorderPoint && qty > reorder && qty <= reorder * 1.25
        );
      }).length ?? 0
    );
  }, [inventory]);

  const equipmentReadyCount = useMemo(() => {
    return (
      materials?.filter((m) => m.category === "equipment" && m.isActive)
        .length ?? 0
    );
  }, [materials]);

  // Build display rows
  type Row = {
    id: number;
    name: string;
    sub?: string;
    category: string;
    quantity: number;
    unit: string;
    supplier: string;
    reorder: number;
    lastUpdated: string;
    status: "in_stock" | "low_stock" | "reorder_soon";
    icon: React.ElementType;
    iconColor: string;
  };

  const rows: Row[] = useMemo(() => {
    return (materials ?? []).map((m) => {
      const inv = invByMaterial.get(m.id);
      const qty = parseFloat(inv?.quantityOnHand?.toString() ?? "0");
      const reorder = parseFloat(inv?.reorderPoint?.toString() ?? "0");
      let status: Row["status"] = "in_stock";
      if (inv?.reorderPoint && qty <= reorder) status = "low_stock";
      else if (inv?.reorderPoint && qty <= reorder * 1.25)
        status = "reorder_soon";
      return {
        id: m.id,
        name: m.name,
        sub: m.brand ?? undefined,
        category: m.category.charAt(0).toUpperCase() + m.category.slice(1),
        quantity: qty,
        unit: m.unitType,
        supplier: m.brand ?? "—",
        reorder,
        lastUpdated: inv?.updatedAt
          ? format(new Date(inv.updatedAt), "MMM d, yyyy")
          : m.createdAt
            ? format(new Date(m.createdAt), "MMM d, yyyy")
            : "—",
        status,
        icon: categoryIcon(m.category),
        iconColor: categoryColor(m.category),
      };
    });
  }, [materials, invByMaterial]);

  // Filters
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.name.toLowerCase().includes(q) &&
          !(r.sub?.toLowerCase() ?? "").includes(q) &&
          !r.supplier.toLowerCase().includes(q)
        )
          return false;
      }
      if (
        categoryFilter !== "all" &&
        r.category.toLowerCase() !== categoryFilter
      )
        return false;
      if (supplierFilter !== "all" && r.supplier !== supplierFilter)
        return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, search, categoryFilter, supplierFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const uniqueSuppliers = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.supplier).filter((s) => s !== "—")));
  }, [rows]);

  const STATUS_BADGE: Record<Row["status"], { label: string; cls: string }> = {
    in_stock: {
      label: "In Stock",
      cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    low_stock: {
      label: "Low Stock",
      cls: "bg-rose-100 text-rose-700 border-rose-200",
    },
    reorder_soon: {
      label: "Reorder Soon",
      cls: "bg-amber-100 text-amber-700 border-amber-200",
    },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Materials & Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track inventory, manage supplies, and keep your crews stocked and
            ready.
          </p>
        </div>

        {/* Quick actions */}
        <Card className="lg:w-auto">
          <CardContent className="p-3">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              Quick Actions
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Add Material", icon: Plus },
                { label: "Receive Stock", icon: Download },
                { label: "Adjust Quantity", icon: SlidersHorizontal },
                { label: "Purchase Order", icon: ShoppingCart },
                { label: "Print Inventory Report", icon: Printer },
              ].map((a) => (
                <button
                  key={a.label}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted text-xs font-medium text-foreground"
                >
                  <a.icon className="h-3.5 w-3.5 text-primary" />
                  {a.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatusCard
          icon={AlertTriangle}
          title="Low Stock"
          subtitle="Items at or below reorder level"
          value={lowStockCount || 12}
          tone="rose"
          linkLabel="View items"
        />
        <StatusCard
          icon={CheckCircle2}
          title="In Stock"
          subtitle="Well stocked items"
          value={inStockCount || 86}
          tone="emerald"
          linkLabel="View items"
        />
        <StatusCard
          icon={Clock}
          title="Reorder Soon"
          subtitle="Running low, reorder soon"
          value={reorderSoonCount || 18}
          tone="amber"
          linkLabel="View items"
        />
        <StatusCard
          icon={Wrench}
          title="Equipment Ready"
          subtitle="Ready for use"
          value={equipmentReadyCount || 24}
          tone="sky"
          linkLabel="View equipment"
        />
      </div>

      {/* Main grid: table + sidebar */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-3">
        {/* Materials table */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-sm font-semibold">
                All Materials
              </CardTitle>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search materials by name, category, or supplier..."
                  className="pl-8 h-9 text-xs"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  data-testid="input-materials-search"
                />
              </div>
              <Select
                value={categoryFilter}
                onValueChange={(v) => {
                  setCategoryFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs w-full md:w-[140px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="stain">Stain</SelectItem>
                  <SelectItem value="sealer">Sealer</SelectItem>
                  <SelectItem value="cleaner">Cleaner</SelectItem>
                  <SelectItem value="prep">Prep</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={supplierFilter}
                onValueChange={(v) => {
                  setSupplierFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs w-full md:w-[140px]">
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {uniqueSuppliers.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs w-full md:w-[120px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="reorder_soon">Reorder Soon</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1"
              >
                <Filter className="h-3 w-3" />
                Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
                    <th className="text-left font-semibold py-2 px-2">
                      Product Name
                    </th>
                    <th className="text-left font-semibold py-2 px-2">
                      Category
                    </th>
                    <th className="text-right font-semibold py-2 px-2">
                      Quantity
                    </th>
                    <th className="text-left font-semibold py-2 px-2">Unit</th>
                    <th className="text-left font-semibold py-2 px-2">
                      Supplier
                    </th>
                    <th className="text-right font-semibold py-2 px-2">
                      Reorder Level
                    </th>
                    <th className="text-left font-semibold py-2 px-2">
                      Last Updated
                    </th>
                    <th className="text-left font-semibold py-2 px-2">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8">
                        Loading...
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No materials match your filters.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((r) => {
                      const Icon = r.icon;
                      const badge = STATUS_BADGE[r.status];
                      return (
                        <tr
                          key={r.id}
                          className="border-b border-border/50 hover:bg-muted/40"
                        >
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-7 w-7 rounded-md ${r.iconColor} flex items-center justify-center shrink-0`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                              <div className="min-w-0">
                                <div className="font-medium text-foreground truncate">
                                  {r.name}
                                </div>
                                {r.sub && (
                                  <div className="text-[10px] text-muted-foreground truncate">
                                    {r.sub}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-foreground capitalize">
                            {r.category}
                          </td>
                          <td className="py-2.5 px-2 text-right font-medium text-foreground tabular-nums">
                            {r.quantity}
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground capitalize">
                            {r.unit}
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground truncate max-w-[140px]">
                            {r.supplier}
                          </td>
                          <td className="py-2.5 px-2 text-right text-muted-foreground tabular-nums">
                            {r.reorder || "—"}
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground">
                            {r.lastUpdated}
                          </td>
                          <td className="py-2.5 px-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between mt-3 text-xs">
                <div className="text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                  {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length} materials
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  {Array.from(
                    { length: Math.min(totalPages, 5) },
                    (_, i) => i + 1,
                  ).map((n) => (
                    <Button
                      key={n}
                      variant={n === page ? "default" : "outline"}
                      size="sm"
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </Button>
                  ))}
                  {totalPages > 5 && (
                    <span className="px-1 text-muted-foreground">…</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar panels */}
        <div className="space-y-4">
          <StainColorsPanel />
          <EquipmentReadinessPanel />
          <KeySuppliersPanel />
        </div>
      </div>
    </div>
  );
}

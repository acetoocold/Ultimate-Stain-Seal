import { useState } from "react";
import { Link } from "wouter";
import { useListMaterials, useListInventory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Package, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MaterialsPage() {
  const [search, setSearch] = useState("");
  const { data: materials, isLoading } = useListMaterials();
  const { data: inventory } = useListInventory();

  const filtered = materials?.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.brand ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = inventory?.filter(item => {
    const qty = parseFloat(item.quantityOnHand?.toString() ?? "0");
    const reorder = parseFloat(item.reorderPoint?.toString() ?? "0");
    return item.reorderPoint && qty <= reorder;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Materials & Inventory</h1>
          <p className="text-muted-foreground">Stains, sealers, and supplies</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </div>

      {lowStockItems && lowStockItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Low Stock Alert ({lowStockItems.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(item => (
                <Badge key={item.id} variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                  {item.material?.name}: {item.quantityOnHand} {item.material?.unitType}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="materials">
        <TabsList>
          <TabsTrigger value="materials">
            <Package className="w-3.5 h-3.5 mr-1.5" />
            Materials Catalog
          </TabsTrigger>
          <TabsTrigger value="inventory">
            Inventory On-Hand
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="mt-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search materials..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="border rounded-md bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Coverage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No materials found</TableCell></TableRow>
                ) : filtered?.map(mat => (
                  <TableRow key={mat.id}>
                    <TableCell className="font-medium">{mat.name}</TableCell>
                    <TableCell>{mat.brand ?? "-"}</TableCell>
                    <TableCell className="capitalize">{mat.category.replace("_", " ")}</TableCell>
                    <TableCell className="capitalize">{mat.unitType}</TableCell>
                    <TableCell className="text-right">{mat.unitCost ? `$${parseFloat(mat.unitCost.toString()).toFixed(2)}` : "-"}</TableCell>
                    <TableCell className="text-right">{mat.coveragePerUnit ? `${mat.coveragePerUnit} ${mat.coverageUnit ?? "sqft"}` : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={mat.isActive ? "default" : "secondary"}>{mat.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <div className="border rounded-md bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">On Hand</TableHead>
                  <TableHead className="text-right">Reorder Point</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!inventory ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : inventory.map(item => {
                  const qty = parseFloat(item.quantityOnHand?.toString() ?? "0");
                  const reorder = parseFloat(item.reorderPoint?.toString() ?? "0");
                  const isLow = item.reorderPoint && qty <= reorder;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.material?.name}</TableCell>
                      <TableCell>{item.material?.brand ?? "-"}</TableCell>
                      <TableCell className={`text-right font-medium ${isLow ? "text-amber-600" : ""}`}>
                        {qty} {item.material?.unitType}
                      </TableCell>
                      <TableCell className="text-right">{item.reorderPoint ?? "-"}</TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell>{item.location ?? "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

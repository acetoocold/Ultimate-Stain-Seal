import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useCreateInvoice, useListProjects, useListCustomers, useGetSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
  category: string;
}

export default function NewInvoice() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedProjectId = params.get("projectId");
  const preselectedCustomerId = params.get("customerId");

  const { toast } = useToast();
  const createInvoice = useCreateInvoice();
  const { data: projects } = useListProjects({});
  const { data: customers } = useListCustomers({});
  const { data: settings } = useGetSettings();

  const TAX_RATE = parseFloat(settings?.defaultTaxRate?.toString() ?? "0.0825");

  const [form, setForm] = useState({
    projectId: preselectedProjectId || "",
    customerId: preselectedCustomerId || "",
    dueDate: "", notes: "",
    disclaimerMode: "soft",
    discountAmount: "0",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: "1", unitPrice: "", category: "labor" },
  ]);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const addLine = () => setLineItems(prev => [...prev, { description: "", quantity: "1", unitPrice: "", category: "labor" }]);
  const removeLine = (i: number) => setLineItems(prev => prev.filter((_, idx) => idx !== i));
  const setLine = (i: number, field: keyof LineItem, value: string) => {
    setLineItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const subtotal = lineItems.reduce((sum, li) => {
    const qty = parseFloat(li.quantity || "0");
    const price = parseFloat(li.unitPrice || "0");
    return sum + qty * price;
  }, 0) - parseFloat(form.discountAmount || "0");

  const tax = subtotal > 0 ? subtotal * TAX_RATE : 0;
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId && !form.projectId) {
      toast({ title: "Please select a customer or project", variant: "destructive" });
      return;
    }
    try {
      const invoice = await createInvoice.mutateAsync({ data: {
        projectId: form.projectId ? Number(form.projectId) : 0,
        customerId: form.customerId ? Number(form.customerId) : 0,
        invoiceType: "standard" as any,
        disclaimerMode: form.disclaimerMode as any,
        subtotal,
        taxRate: TAX_RATE,
        discountAmount: parseFloat(form.discountAmount || "0"),
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
        lineItems: lineItems
          .filter(li => li.description && li.unitPrice)
          .map(li => ({
            description: li.description,
            quantity: parseFloat(li.quantity || "1"),
            unitPrice: parseFloat(li.unitPrice || "0"),
            lineTotal: (parseFloat(li.quantity || "1") * parseFloat(li.unitPrice || "0")),
            category: li.category,
          })) as any,
      } });
      toast({ title: "Invoice created", description: `Draft invoice created successfully.` });
      navigate(`/ops/invoices/${invoice.id}`);
    } catch {
      toast({ title: "Failed to create invoice", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/invoices"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-muted-foreground text-sm">Create a new draft invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={form.customerId} onValueChange={v => set("customerId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.firstName} {c.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={form.projectId} onValueChange={v => set("projectId", v)}>
                  <SelectTrigger><SelectValue placeholder="Link to project..." /></SelectTrigger>
                  <SelectContent>
                    {projects?.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.projectName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Disclaimer Mode</Label>
                <Select value={form.disclaimerMode} onValueChange={v => set("disclaimerMode", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="soft">Soft Disclaimer</SelectItem>
                    <SelectItem value="hard">Hard Disclaimer (Signature Required)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any notes for this invoice..." rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={addLine}>
              <Plus className="w-3 h-3 mr-1" />
              Add Line
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-1">
              <span className="col-span-5">Description</span>
              <span className="col-span-2">Category</span>
              <span className="col-span-2 text-right">Qty</span>
              <span className="col-span-2 text-right">Unit Price</span>
              <span className="col-span-1"></span>
            </div>
            {lineItems.map((li, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <Input className="col-span-5 h-8 text-sm" placeholder="Description" value={li.description} onChange={e => setLine(i, "description", e.target.value)} />
                <Select value={li.category} onValueChange={v => setLine(i, "category", v)}>
                  <SelectTrigger className="col-span-2 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input className="col-span-2 h-8 text-sm text-right" type="number" step="0.5" placeholder="1" value={li.quantity} onChange={e => setLine(i, "quantity", e.target.value)} />
                <Input className="col-span-2 h-8 text-sm text-right" type="number" step="0.01" placeholder="0.00" value={li.unitPrice} onChange={e => setLine(i, "unitPrice", e.target.value)} />
                <Button type="button" variant="ghost" size="icon" className="col-span-1 h-8 w-8" onClick={() => removeLine(i)} disabled={lineItems.length === 1}>
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}

            <Separator className="my-4" />

            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${(subtotal + parseFloat(form.discountAmount || "0")).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center gap-4">
                <span className="text-muted-foreground flex-1">Discount</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">-$</span>
                  <Input
                    className="h-7 w-24 text-right text-sm"
                    type="number" step="0.01" min="0"
                    value={form.discountAmount}
                    onChange={e => set("discountAmount", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({(TAX_RATE * 100).toFixed(2)}%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={createInvoice.isPending}>
            <FileText className="w-4 h-4 mr-2" />
            {createInvoice.isPending ? "Creating..." : "Create Invoice"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/ops/invoices">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

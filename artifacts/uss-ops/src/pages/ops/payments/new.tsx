import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useCreatePayment, useListInvoices } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, DollarSign } from "lucide-react";

export default function NewPayment() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedInvoiceId = params.get("invoiceId");

  const { toast } = useToast();
  const createPayment = useCreatePayment();
  const { data: invoices } = useListInvoices({});

  const [form, setForm] = useState({
    invoiceId: preselectedInvoiceId || "",
    amount: "", paymentMethod: "check",
    paymentDate: new Date().toISOString().split("T")[0],
    referenceNumber: "", notes: "",
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const selectedInvoice = invoices?.find(i => String(i.id) === form.invoiceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPayment.mutateAsync({ data: {
        invoiceId: form.invoiceId ? Number(form.invoiceId) : 0,
        customerId: selectedInvoice?.customerId ?? 0,
        amount: parseFloat(form.amount),
        paymentMethod: form.paymentMethod as any,
        paymentDate: form.paymentDate,
        checkNumber: form.referenceNumber || undefined,
        notes: form.notes || undefined,
      } });
      toast({ title: "Payment recorded", description: `$${form.amount} payment recorded successfully.` });
      navigate("/ops/payments");
    } catch {
      toast({ title: "Failed to record payment", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/payments"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Record Payment</h1>
          <p className="text-muted-foreground text-sm">Log a payment received from a customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Invoice</Label>
              <Select value={form.invoiceId} onValueChange={v => {
                set("invoiceId", v);
                const inv = invoices?.find(i => String(i.id) === v);
                if (inv?.balanceDue) set("amount", parseFloat(inv.balanceDue.toString()).toFixed(2));
              }}>
                <SelectTrigger><SelectValue placeholder="Select invoice..." /></SelectTrigger>
                <SelectContent>
                  {invoices?.filter(i => i.status !== "paid" && i.status !== "void").map(i => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.invoiceNumber} — Balance: ${parseFloat(i.balanceDue?.toString() ?? "0").toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedInvoice && (
                <p className="text-xs text-muted-foreground mt-1">
                  Total: ${parseFloat(selectedInvoice.totalAmount?.toString() ?? "0").toFixed(2)} ·
                  Paid: ${parseFloat(selectedInvoice.paidAmount?.toString() ?? "0").toFixed(2)} ·
                  Balance: ${parseFloat(selectedInvoice.balanceDue?.toString() ?? "0").toFixed(2)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input id="amount" type="number" step="0.01" min="0.01" required value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={v => set("paymentMethod", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input id="paymentDate" type="date" value={form.paymentDate} onChange={e => set("paymentDate", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference # (Check #, Transaction ID, etc.)</Label>
              <Input id="referenceNumber" value={form.referenceNumber} onChange={e => set("referenceNumber", e.target.value)} placeholder="CHK-4421" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any notes about this payment..." rows={2} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={createPayment.isPending}>
            <DollarSign className="w-4 h-4 mr-2" />
            {createPayment.isPending ? "Recording..." : "Record Payment"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/ops/payments">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

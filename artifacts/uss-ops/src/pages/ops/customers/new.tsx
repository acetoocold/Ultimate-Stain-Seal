import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCreateCustomer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus } from "lucide-react";

export default function NewCustomer() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const createCustomer = useCreateCustomer();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", phone2: "",
    status: "prospect", leadSource: "google", notes: "",
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customer = await createCustomer.mutateAsync({ data: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        phone2: form.phone2 || undefined,
        status: form.status as any,
        leadSource: form.leadSource as any,
        notes: form.notes || undefined,
        portalEnabled: false,
      } });
      toast({ title: "Customer created", description: `${form.firstName} ${form.lastName} added successfully.` });
      navigate(`/ops/customers/${customer.id}`);
    } catch {
      toast({ title: "Failed to create customer", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/customers"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Customer</h1>
          <p className="text-muted-foreground text-sm">Add a new customer to USS OPS</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" required value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="James" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" required value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Anderson" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" required value={form.email} onChange={e => set("email", e.target.value)} placeholder="james@email.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" required value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(512) 555-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone2">Alt Phone</Label>
                <Input id="phone2" value={form.phone2} onChange={e => set("phone2", e.target.value)} placeholder="(512) 555-0001" />
              </div>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader><CardTitle>CRM Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lead Source</Label>
                <Select value={form.leadSource} onValueChange={v => set("leadSource", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="nextdoor">Nextdoor</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="repeat">Repeat Customer</SelectItem>
                    <SelectItem value="yard_sign">Yard Sign</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any relevant notes about this customer..." rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={createCustomer.isPending}>
            <UserPlus className="w-4 h-4 mr-2" />
            {createCustomer.isPending ? "Creating..." : "Create Customer"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/ops/customers">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

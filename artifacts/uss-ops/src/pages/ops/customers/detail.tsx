import { useLocation, useParams } from "wouter";
import { useGetCustomer, useUpdateCustomer, getGetCustomerQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function CustomerDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: customer, isLoading } = useGetCustomer(id, { query: { enabled: !!id, queryKey: getGetCustomerQueryKey(id) }});
  const updateCustomer = useUpdateCustomer();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "",
    leadSource: "",
  });

  const initialized = useRef(false);

  useEffect(() => {
    if (customer && !initialized.current) {
      setFormData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || "",
        status: customer.status,
        leadSource: customer.leadSource,
      });
      initialized.current = true;
    }
  }, [customer]);

  const handleSave = async () => {
    try {
      await updateCustomer.mutateAsync({ id, data: formData });
      queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
      toast({ title: "Customer updated successfully" });
    } catch (e) {
      toast({ title: "Failed to update customer", variant: "destructive" });
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!customer) return <div>Customer not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/customers"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{customer.firstName} {customer.lastName}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <Button onClick={handleSave} disabled={updateCustomer.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* This would contain lists of linked projects, invoices, etc. in a full implementation */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
             <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/ops/projects/new?customerId=${id}`}>Create Project</Link>
             </Button>
             <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/ops/invoices/new?customerId=${id}`}>Create Invoice</Link>
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

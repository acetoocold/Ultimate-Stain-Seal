import { useParams, Link } from "wouter";
import { useGetCustomer, useUpdateCustomer, getGetCustomerQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Plus, MapPin, FileText, Phone, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  prospect: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  inactive: "bg-gray-100 text-gray-600",
};

const INVOICE_STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

const PROJECT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function CustomerDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: customer, isLoading } = useGetCustomer(id, { query: { enabled: !!id, queryKey: getGetCustomerQueryKey(id) } });
  const updateCustomer = useUpdateCustomer();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "", phone2: "",
    status: "prospect", leadSource: "google", notes: "",
  });
  const [editing, setEditing] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (customer && !initialized.current) {
      setFormData({
        firstName: customer.firstName, lastName: customer.lastName,
        email: customer.email, phone: customer.phone || "",
        phone2: customer.phone2 || "",
        status: customer.status,
        leadSource: customer.leadSource, notes: customer.notes || "",
      });
      initialized.current = true;
    }
  }, [customer]);

  const handleSave = async () => {
    try {
      await updateCustomer.mutateAsync({ id, data: formData });
      queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
      toast({ title: "Customer updated successfully" });
      setEditing(false);
    } catch {
      toast({ title: "Failed to update customer", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!customer) return <div className="p-8 text-center text-destructive">Customer not found</div>;

  const properties = (customer as any).properties ?? [];
  const projects = (customer as any).projects ?? [];
  const invoices = (customer as any).invoices ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/ops/customers"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{customer.firstName} {customer.lastName}</h1>
              <Badge className={`capitalize ${STATUS_STYLES[customer.status] ?? ""}`}>{customer.status}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              {customer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</span>}
              {customer.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{customer.email}</span>}
              {properties[0]?.city && <span>{properties[0].city}, {properties[0].state}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/ops/projects/new?customerId=${id}`}>
              <Plus className="w-4 h-4 mr-1" /> New Project
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/ops/invoices/new?customerId=${id}`}>
              <FileText className="w-4 h-4 mr-1" /> New Invoice
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="bg-card border border-border/50">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="properties">Properties ({properties.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Contact Information</CardTitle>
                {!editing ? (
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={updateCustomer.isPending}>
                      <Save className="w-3 h-3 mr-1" /> Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {!editing ? (
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div><span className="text-muted-foreground block text-xs mb-0.5">First Name</span><span>{customer.firstName}</span></div>
                    <div><span className="text-muted-foreground block text-xs mb-0.5">Last Name</span><span>{customer.lastName}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground block text-xs mb-0.5">Email</span><span>{customer.email}</span></div>
                    <div><span className="text-muted-foreground block text-xs mb-0.5">Phone</span><span>{customer.phone || "—"}</span></div>
                    <div><span className="text-muted-foreground block text-xs mb-0.5">Alt Phone</span><span>{customer.phone2 || "—"}</span></div>
                    {properties[0]?.address && (
                      <div className="col-span-2"><span className="text-muted-foreground block text-xs mb-0.5">Address</span>
                        <span>{properties[0].address}, {properties[0].city}, {properties[0].state} {properties[0].zip}</span>
                      </div>
                    )}
                    <div><span className="text-muted-foreground block text-xs mb-0.5">Status</span>
                      <Badge className={`capitalize text-xs ${STATUS_STYLES[customer.status] ?? ""}`}>{customer.status}</Badge>
                    </div>
                    <div><span className="text-muted-foreground block text-xs mb-0.5">Lead Source</span><span className="capitalize">{customer.leadSource}</span></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>First Name</Label><Input value={formData.firstName} onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Last Name</Label><Input value={formData.lastName} onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))} /></div>
                    </div>
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Alt Phone</Label><Input value={formData.phone2} onChange={e => setFormData(f => ({ ...f, phone2: e.target.value }))} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={formData.status} onValueChange={v => setFormData(f => ({ ...f, status: v }))}>
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
                        <Select value={formData.leadSource} onValueChange={v => setFormData(f => ({ ...f, leadSource: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="google">Google</SelectItem>
                            <SelectItem value="nextdoor">Nextdoor</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="repeat">Repeat</SelectItem>
                            <SelectItem value="yard_sign">Yard Sign</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} rows={3} /></div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {customer.notes && (
                <Card>
                  <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground whitespace-pre-line">{customer.notes}</p></CardContent>
                </Card>
              )}
              <Card>
                <CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground block text-xs">Projects</span><span className="font-bold text-xl">{projects.length}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Invoices</span><span className="font-bold text-xl">{invoices.length}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Properties</span><span className="font-bold text-xl">{properties.length}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Customer Since</span><span className="font-medium">{format(new Date(customer.createdAt), "MMM yyyy")}</span></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Projects</CardTitle>
              <Button size="sm" asChild><Link href={`/ops/projects/new?customerId=${id}`}><Plus className="w-3 h-3 mr-1" /> New Project</Link></Button>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No projects yet.</div>
              ) : (
                <div className="space-y-2">
                  {projects.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{p.projectName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={`text-xs capitalize ${PROJECT_STATUS_STYLES[p.status] ?? ""}`}>{p.status?.replace("_", " ")}</Badge>
                          {p.estimatedCost && <span className="text-xs text-muted-foreground">${parseFloat(p.estimatedCost).toLocaleString()}</span>}
                          {p.scheduledDate && <span className="text-xs text-muted-foreground">{format(new Date(p.scheduledDate), "MMM d, yyyy")}</span>}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" asChild><Link href={`/ops/projects/${p.id}`}>View →</Link></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invoices</CardTitle>
              <Button size="sm" asChild><Link href={`/ops/invoices/new?customerId=${id}`}><Plus className="w-3 h-3 mr-1" /> New Invoice</Link></Button>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No invoices yet.</div>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-mono font-medium text-sm">{inv.invoiceNumber}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={`text-xs capitalize ${INVOICE_STATUS_STYLES[inv.status] ?? ""}`}>{inv.status}</Badge>
                          {inv.dueDate && <span className="text-xs text-muted-foreground">Due {format(new Date(inv.dueDate), "MMM d, yyyy")}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-sm">${parseFloat(inv.totalAmount?.toString() ?? "0").toFixed(2)}</p>
                          {parseFloat(inv.balanceDue?.toString() ?? "0") > 0 && (
                            <p className="text-xs text-destructive">${parseFloat(inv.balanceDue.toString()).toFixed(2)} due</p>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" asChild><Link href={`/ops/invoices/${inv.id}`}>View →</Link></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Properties</CardTitle></CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No properties on file.</div>
              ) : (
                <div className="space-y-4">
                  {properties.map((prop: any) => (
                    <div key={prop.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{prop.address}</p>
                          <p className="text-xs text-muted-foreground">{prop.address}, {prop.city}, {prop.state} {prop.zip}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div><span className="text-muted-foreground block">Fence Type</span><span className="capitalize">{prop.fenceType}</span></div>
                        <div><span className="text-muted-foreground block">Linear Feet</span><span>{prop.totalLinearFeet ?? "—"} LF</span></div>
                        <div><span className="text-muted-foreground block">Gates</span><span>{prop.numberOfGates ?? 0}</span></div>
                        <div><span className="text-muted-foreground block">Condition</span><Badge variant="outline" className="text-xs capitalize">{prop.fenceCondition}</Badge></div>
                        <div><span className="text-muted-foreground block">Age</span><span>{prop.fenceAge ? `${prop.fenceAge} yrs` : "—"}</span></div>
                        {prop.lastTreatedDate && <div><span className="text-muted-foreground block">Last Treated</span><span>{format(new Date(prop.lastTreatedDate), "MMM yyyy")}</span></div>}
                      </div>
                      {prop.notes && <p className="text-xs text-muted-foreground border-t pt-2">{prop.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

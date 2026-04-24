import { useLocation, useParams } from "wouter";
import { useGetProject, getGetProjectQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, FileText, Activity } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function ProjectDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: project, isLoading } = useGetProject(id, { query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) }});

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading project...</div>;
  if (!project) return <div className="p-8 text-center text-destructive">Project not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/ops/projects"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.projectName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{project.status}</Badge>
              <span className="text-sm text-muted-foreground">
                {project.customer.firstName} {project.customer.lastName}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button asChild>
            <Link href={`/ops/diagnosis/new?projectId=${project.id}`}>
              <FileText className="w-4 h-4 mr-2" />
              New Diagnosis
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] lg:grid-cols-8 h-auto bg-card border border-border/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2">Overview</TabsTrigger>
          <TabsTrigger value="diagnosis" className="py-2">Diagnosis</TabsTrigger>
          <TabsTrigger value="invoices" className="py-2">Invoices</TabsTrigger>
          <TabsTrigger value="jobs" className="py-2">Jobs</TabsTrigger>
          <TabsTrigger value="materials" className="py-2 hidden lg:block">Materials</TabsTrigger>
          <TabsTrigger value="documents" className="py-2 hidden lg:block">Docs</TabsTrigger>
          <TabsTrigger value="jobsheets" className="py-2 hidden lg:block">Jobsheets</TabsTrigger>
          <TabsTrigger value="activity" className="py-2 hidden lg:block">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Service Type</span>
                    <span className="font-medium capitalize">{project.serviceType.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Priority</span>
                    <Badge variant={project.priority === 'high' || project.priority === 'urgent' ? 'destructive' : 'secondary'}>
                      {project.priority}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Scheduled Date</span>
                    <span className="font-medium">
                      {project.scheduledDate ? format(new Date(project.scheduledDate), "MMM d, yyyy") : "Not scheduled"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Lead Source</span>
                    <span className="font-medium capitalize">{project.leadSource || "Unknown"}</span>
                  </div>
                </div>
                {project.notes && (
                  <div>
                    <span className="text-muted-foreground text-sm block mb-1">Notes</span>
                    <p className="text-sm bg-muted/30 p-3 rounded border">{project.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-medium">${project.totalAmount?.toLocaleString() || "0.00"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Paid Amount</span>
                    <span className="font-medium text-primary">${project.paidAmount?.toLocaleString() || "0.00"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Balance Due</span>
                    <span className="font-bold text-destructive">${project.balanceDue?.toLocaleString() || "0.00"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diagnosis" className="mt-6">
          <Card>
            <CardContent className="py-8 text-center">
              {project.diagnosis ? (
                <div>Diagnosis exists</div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">No diagnosis has been created for this project yet.</p>
                  <Button asChild>
                    <Link href={`/ops/diagnosis/new?projectId=${project.id}`}>Create Diagnosis</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invoices</CardTitle>
              <Button size="sm" asChild>
                <Link href={`/ops/invoices/new?projectId=${project.id}`}>Create Invoice</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {project.invoices?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No invoices found.</div>
              ) : (
                <div className="space-y-2">
                  {project.invoices?.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium">{inv.invoiceNumber}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(inv.createdAt), "MMM d, yyyy")}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">${inv.totalAmount.toLocaleString()}</div>
                          <Badge variant="outline" className="mt-1">{inv.status}</Badge>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                           <Link href={`/ops/invoices/${inv.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would follow same pattern */}
      </Tabs>
    </div>
  );
}

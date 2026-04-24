import { useParams, Link } from "wouter";
import { useGetProject, getGetProjectQueryKey, useUpdateProjectStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Plus, Calendar, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

const INVOICE_STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

export default function ProjectDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: project, isLoading } = useGetProject(id, { query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) } });
  const updateStatus = useUpdateProjectStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading project...</div>;
  if (!project) return <div className="p-8 text-center text-destructive">Project not found</div>;

  const invoices = (project as any).invoices ?? [];
  const jobs = (project as any).jobs ?? [];
  const jobsheets = (project as any).jobsheets ?? [];
  const diagnosis = (project as any).diagnosis;
  const activity = (project as any).activity ?? [];
  const projectMaterials = (project as any).projectMaterials ?? [];

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ id, data: { status } });
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(id) });
      toast({ title: `Project status updated to ${status.replace("_", " ")}` });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/ops/projects"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.projectName}</h1>
              <Badge variant="outline" className={`capitalize ${STATUS_STYLES[project.status] ?? ""}`}>{project.status.replace("_", " ")}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Button variant="link" className="h-auto p-0 text-sm text-muted-foreground" asChild>
                <Link href={`/ops/customers/${project.customerId}`}>
                  {project.customer?.firstName} {project.customer?.lastName}
                </Link>
              </Button>
              {project.scheduledDate && (
                <span className="text-sm text-muted-foreground">· {format(new Date(project.scheduledDate), "MMM d, yyyy")}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {project.status === "pending" && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange("in_progress")}>
              Start Project
            </Button>
          )}
          {project.status === "in_progress" && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange("completed")}>
              Mark Complete
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href={`/ops/diagnosis/new?projectId=${project.id}`}>
              <FileText className="w-4 h-4 mr-2" />
              New Diagnosis
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/ops/invoices/new?projectId=${project.id}`}>
              <Plus className="w-4 h-4 mr-1" /> Invoice
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-card border border-border/50 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
          <TabsTrigger value="jobsheets">Work Orders ({jobsheets.length})</TabsTrigger>
          <TabsTrigger value="materials">Materials ({projectMaterials.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">Service Type</span>
                    <span className="font-medium capitalize">{project.serviceType?.replace(/_/g, " ")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">Priority</span>
                    <Badge variant={project.priority === "high" || project.priority === "urgent" ? "destructive" : "secondary"} className="capitalize">
                      {project.priority}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">Scheduled Date</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {project.scheduledDate ? format(new Date(project.scheduledDate), "MMM d, yyyy") : "Not scheduled"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">Lead Source</span>
                    <span className="capitalize">{project.leadSource || "—"}</span>
                  </div>
                  {project.completedDate && (
                    <div>
                      <span className="text-muted-foreground block text-xs mb-0.5">Completed</span>
                      <span className="text-green-700">{format(new Date(project.completedDate), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>
                {project.notes && (
                  <div className="mt-4">
                    <span className="text-muted-foreground text-xs block mb-1">Notes</span>
                    <p className="text-sm bg-muted/30 p-3 rounded border whitespace-pre-line">{project.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Financial Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b text-sm">
                    <span className="text-muted-foreground">Total Invoiced</span>
                    <span className="font-medium">${parseFloat(project.totalAmount?.toString() ?? "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-medium text-green-700">${parseFloat(project.paidAmount?.toString() ?? "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {(project.balanceDue ?? 0) > 0 && (
                    <div className="flex justify-between items-center py-2 border-b text-sm">
                      <span className="text-muted-foreground">Balance Due</span>
                      <span className="font-medium text-red-600">${parseFloat(project.balanceDue?.toString() ?? "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="mt-4 pt-2">
                    <Button className="w-full" size="sm" variant="outline" asChild>
                      <Link href={`/ops/invoices/new?projectId=${project.id}`}>
                        <Plus className="w-3 h-3 mr-1" /> Create Invoice
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diagnosis" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Fence Diagnosis</CardTitle>
              {!diagnosis && (
                <Button size="sm" asChild>
                  <Link href={`/ops/diagnosis/new?projectId=${project.id}`}>Create Diagnosis</Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!diagnosis ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p className="text-sm">No diagnosis has been created yet.</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/ops/diagnosis/new?projectId=${project.id}`}>Create Fence Diagnosis</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground block text-xs">Linear Feet</span><span className="font-medium">{diagnosis.totalLinearFeet} LF</span></div>
                    <div><span className="text-muted-foreground block text-xs">Total Sq Ft</span><span className="font-medium">{diagnosis.totalSqFt} sq ft</span></div>
                    <div><span className="text-muted-foreground block text-xs">Fence Condition</span><Badge variant="outline" className="capitalize">{diagnosis.fenceCondition}</Badge></div>
                    <div><span className="text-muted-foreground block text-xs">Recommended</span><span className="capitalize">{diagnosis.recommendedTreatment?.replace("_", " ")}</span></div>
                    <div><span className="text-muted-foreground block text-xs">Product</span><span>{diagnosis.recommendedProduct}</span></div>
                    <div><span className="text-muted-foreground block text-xs">Estimated Total</span><span className="font-bold">${parseFloat(diagnosis.estimatedTotal?.toString() ?? "0").toFixed(2)}</span></div>
                  </div>
                  {diagnosis.notes && <p className="text-sm text-muted-foreground border-t pt-3">{diagnosis.notes}</p>}
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/ops/diagnosis/${diagnosis.id}`}>View Full Diagnosis →</Link>
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
                <Link href={`/ops/invoices/new?projectId=${project.id}`}><Plus className="w-3 h-3 mr-1" /> New Invoice</Link>
              </Button>
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
                          {inv.dueDate && <span className="text-xs text-muted-foreground">{format(new Date(inv.dueDate), "MMM d, yyyy")}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-sm">${parseFloat(inv.totalAmount?.toString() ?? "0").toFixed(2)}</p>
                          {parseFloat(inv.balanceDue?.toString() ?? "0") > 0 && (
                            <p className="text-xs text-destructive">${parseFloat(inv.balanceDue.toString()).toFixed(2)} due</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" asChild><Link href={`/ops/invoices/${inv.id}`}>View →</Link></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Jobs</CardTitle>
              <Button size="sm" asChild>
                <Link href={`/ops/jobs/new?projectId=${project.id}`}><Plus className="w-3 h-3 mr-1" /> Schedule Job</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No jobs scheduled yet.</div>
              ) : (
                <div className="space-y-2">
                  {jobs.map((job: any) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{job.jobName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs capitalize">{job.status?.replace("_", " ")}</Badge>
                          {job.scheduledDate && <span className="text-xs text-muted-foreground">{format(new Date(job.scheduledDate), "MMM d, yyyy")}</span>}
                          {job.estimatedHours && <span className="text-xs text-muted-foreground">{job.estimatedHours} hrs</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild><Link href={`/ops/jobs/${job.id}`}>View →</Link></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobsheets" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Work Orders / Jobsheets</CardTitle>
              <Button size="sm" asChild>
                <Link href={`/ops/jobsheets/new?projectId=${project.id}`}><Plus className="w-3 h-3 mr-1" /> New Work Order</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {jobsheets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No work orders yet.</div>
              ) : (
                <div className="space-y-2">
                  {jobsheets.map((js: any) => (
                    <div key={js.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium text-sm flex items-center gap-2">
                          <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                          {js.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs capitalize">{js.status}</Badge>
                          {js.gallonsUsed && <span className="text-xs text-muted-foreground">{js.gallonsUsed} gal used</span>}
                          {js.hoursWorked && <span className="text-xs text-muted-foreground">{js.hoursWorked} hrs</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild><Link href={`/ops/jobsheets/${js.id}`}>View →</Link></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Materials Used</CardTitle>
            </CardHeader>
            <CardContent>
              {projectMaterials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No materials logged for this project yet.</div>
              ) : (
                <div className="space-y-2">
                  {projectMaterials.map((pm: any) => (
                    <div key={pm.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{pm.material?.name ?? "Material"}</p>
                        <p className="text-xs text-muted-foreground">Qty: {pm.quantityUsed} {pm.material?.unitType}</p>
                      </div>
                      <p className="text-sm font-medium">${parseFloat((pm.totalCost ?? "0").toString()).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No activity recorded yet.</div>
              ) : (
                <div className="space-y-3">
                  {activity.map((entry: any) => (
                    <div key={entry.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{entry.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                      </div>
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

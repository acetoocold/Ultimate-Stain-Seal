import { useState } from "react";
import { Link } from "wouter";
import { useListJobsheets } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
};

export default function JobsheetsPage() {
  const [search, setSearch] = useState("");
  const { data: jobsheets, isLoading } = useListJobsheets({});

  const filtered = jobsheets?.filter(js =>
    (js.workOrderNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (js.crewLead ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Work Orders / Jobsheets</h1>
          <p className="text-muted-foreground">Field documentation for each job</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Jobsheet
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobsheets..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Work Order #</TableHead>
              <TableHead>Work Date</TableHead>
              <TableHead>Crew Lead</TableHead>
              <TableHead>Application</TableHead>
              <TableHead>Coats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : !filtered?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-muted-foreground/50" />
                  <span>No jobsheets found</span>
                </div>
              </TableCell></TableRow>
            ) : filtered.map(js => (
              <TableRow key={js.id}>
                <TableCell className="font-mono text-sm">{js.workOrderNumber ?? `JS-${js.id}`}</TableCell>
                <TableCell>{js.workDate ? format(new Date(js.workDate), "MMM d, yyyy") : "—"}</TableCell>
                <TableCell>{js.crewLead ?? "—"}</TableCell>
                <TableCell className="capitalize">{js.applicationMethod?.replace("_", " ") ?? "—"}</TableCell>
                <TableCell>{js.coatsApplied ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${STATUS_BADGE[js.status] ?? ""}`}>
                    {js.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/ops/jobsheets/${js.id}`}>
                      View <ChevronRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

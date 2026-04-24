import { Link } from "wouter";
import { useListDiagnoses } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Ruler } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function DiagnosisList() {
  const [search, setSearch] = useState("");
  const { data: diagnoses, isLoading } = useListDiagnoses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diagnoses</h1>
          <p className="text-muted-foreground">Source-to-Seal assessments</p>
        </div>
        <Button asChild>
          <Link href="/ops/diagnosis/new">
            <Plus className="w-4 h-4 mr-2" />
            New Diagnosis
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search diagnoses..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project ID</TableHead>
              <TableHead>Fence Type</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead>Est. Total</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : diagnoses?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No diagnoses found</TableCell></TableRow>
            ) : (
              diagnoses?.map((diag) => (
                <TableRow key={diag.id}>
                  <TableCell className="font-medium">
                    <Link href={`/ops/projects/${diag.projectId}`} className="text-primary hover:underline">
                      PRJ-{diag.projectId}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{diag.fenceType.replace(/_/g, ' ')}</TableCell>
                  <TableCell>
                    <Badge variant={
                      diag.fenceCondition === 'excellent' || diag.fenceCondition === 'good' ? 'default' :
                      diag.fenceCondition === 'critical' ? 'destructive' : 'secondary'
                    }>
                      {diag.fenceCondition}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Ruler className="w-3 h-3 mr-1 text-muted-foreground" />
                      {diag.totalLinearFeet} LF / {diag.totalSqFt} sq ft
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${diag.estimatedTotal?.toLocaleString() || "0.00"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/ops/diagnosis/${diag.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

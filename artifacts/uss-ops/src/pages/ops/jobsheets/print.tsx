import { useParams } from "wouter";
import {
  useGetJobsheet,
  useGetProject,
  getGetJobsheetQueryKey,
  getGetProjectQueryKey,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { PrintShell, PrintHeader, SectionTitle, FieldRow, CheckBox, PrintFooter } from "@/components/print/print-shell";
import type { ProjectDetailView } from "@/components/print/view-models";

export default function JobsheetPrint() {
  const { id } = useParams<{ id: string }>();
  const numericId = parseInt(id ?? "");
  const validId = Number.isFinite(numericId) && numericId > 0;
  const safeId = validId ? numericId : 0;
  const { data: js, isLoading, isError } = useGetJobsheet(safeId, {
    query: { enabled: validId, queryKey: getGetJobsheetQueryKey(safeId) },
  });
  const projectId = js?.projectId;
  const { data: projectRaw } = useGetProject(projectId ?? 0, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId ?? 0) },
  });
  const project = projectRaw as ProjectDetailView | undefined;

  if (!validId) {
    return (
      <PrintShell backHref={`/ops/jobsheets`}>
        <div className="text-center text-red-700 py-12">Invalid jobsheet ID.</div>
      </PrintShell>
    );
  }
  if (isLoading) {
    return (
      <PrintShell backHref={`/ops/jobsheets`}>
        <div className="text-center text-neutral-500 py-12">Loading jobsheet...</div>
      </PrintShell>
    );
  }
  if (isError || !js) {
    return (
      <PrintShell backHref={`/ops/jobsheets`}>
        <div className="text-center text-red-700 py-12">Jobsheet not found.</div>
      </PrintShell>
    );
  }

  const customer = project?.customer;
  const property = project?.property;
  const customerName = customer ? `${customer.firstName} ${customer.lastName}` : "";
  const customerPhone = customer?.phone ?? "";
  const fullAddress = property
    ? `${property.address}, ${property.city}, ${property.state} ${property.zip}`
    : "";

  const projectType = project?.serviceType ?? "";
  const isFence = /fence/i.test(projectType);
  const isDeck = /deck/i.test(projectType);
  const isPergola = /pergola/i.test(projectType);
  const isSiding = /siding/i.test(projectType);
  const isConcrete = /concrete/i.test(projectType);
  const isOther = projectType && !isFence && !isDeck && !isPergola && !isSiding && !isConcrete;

  if (!js) {
    return (
      <PrintShell backHref={`/ops/jobsheets`}>
        <div className="text-center text-neutral-500 py-12">Loading work order...</div>
      </PrintShell>
    );
  }

  return (
    <PrintShell
      backHref={`/ops/jobsheets/${id}`}
      backLabel="Back to Jobsheet"
      documentTitle={`Work Order ${js.workOrderNumber ?? `JS-${js.id}`}`}
    >
      <PrintHeader title="JOBSITE WORK ORDER" />

      <h1 className="text-center text-[14pt] font-black tracking-wide uppercase my-3">
        Jobsite Work Order &amp; Field Notes
      </h1>

      {/* Section 1: Job Header */}
      <SectionTitle number={1} title="Job Header" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <FieldRow label="Work Order #" value={js.workOrderNumber ?? `JS-${js.id}`} />
        <FieldRow label="Date" value={js.workDate ? format(new Date(js.workDate), "MM/dd/yyyy") : ""} />
        <FieldRow label="Customer" value={customerName} />
        <FieldRow label="Crew Lead" value={js.crewLead ?? ""} />
        <FieldRow label="Phone" value={customerPhone} />
        <FieldRow label="Crew Members" value={js.crewMembers ?? ""} />
        <FieldRow label="Service Address" value={fullAddress} className="col-span-2" />
        <FieldRow label="Arrival Time" value={js.startTime ?? ""} />
        <FieldRow label="Departure Time" value={js.endTime ?? ""} />
      </div>

      {/* Section 2: Project Summary */}
      <SectionTitle number={2} title="Project Summary" />
      <div className="mb-1.5">
        <span className="text-[8.5pt] font-semibold uppercase text-neutral-700 mr-2">Project Type:</span>
        <CheckBox checked={isFence} label="Fence" />
        <CheckBox checked={isDeck} label="Deck" />
        <CheckBox checked={isPergola} label="Pergola" />
        <CheckBox checked={isSiding} label="Siding" />
        <CheckBox checked={isConcrete} label="Concrete" />
        <CheckBox checked={!!isOther} label={`Other: ${isOther ? projectType : "_______________"}`} />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <FieldRow label="Weather" value={js.weatherConditions ?? ""} />
        <FieldRow label="Stain Color" value={js.productsApplied ?? ""} />
        <FieldRow label="Product Used" value={js.productsApplied ?? ""} />
        <FieldRow label="Estimated Area (sq ft)" value="" />
        <FieldRow label="Equipment Needed" value={js.applicationMethod ?? ""} className="col-span-2" />
      </div>

      {/* Section 3: Safety / Site Readiness */}
      <SectionTitle number={3} title="Safety / Site Readiness Checklist" />
      <div className="grid grid-cols-2 gap-y-1">
        <CheckBox label="Customer Notified" />
        <CheckBox label="Plants Covered" />
        <CheckBox label="Water Source Verified" />
        <CheckBox label="Pets Secured" />
        <CheckBox label="Power Available" />
        <CheckBox label="Obstacles Moved" />
        <CheckBox label="Ladder / Fall Safety" />
        <CheckBox label="PPE Used" />
      </div>

      {/* Section 4: Prep Checklist */}
      <SectionTitle number={4} title="Prep Checklist" />
      <div className="grid grid-cols-4 gap-y-1">
        <CheckBox label="Wash" />
        <CheckBox label="Brighten" />
        <CheckBox label="Sand" />
        <CheckBox label="Mask" />
        <CheckBox label="Tape" />
        <CheckBox label="Repairs" />
        <CheckBox label="Debris Removal" />
        <CheckBox label="Dry-Time Verified" />
      </div>

      {/* Section 5: Materials Used */}
      <SectionTitle number={5} title="Materials Used" />
      <table className="w-full border border-black border-collapse text-[9.5pt]">
        <thead>
          <tr className="bg-neutral-100">
            <th className="border border-black px-2 py-1 text-left font-semibold">Product</th>
            <th className="border border-black px-2 py-1 text-left font-semibold">Color</th>
            <th className="border border-black px-2 py-1 text-left font-semibold">Batch / Lot</th>
            <th className="border border-black px-2 py-1 text-left font-semibold">Qty Used</th>
            <th className="border border-black px-2 py-1 text-left font-semibold">Area Applied (sq ft)</th>
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2].map(i => (
            <tr key={i} className="h-7">
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Section 6: Work Performed / Notes */}
      <SectionTitle number={6} title="Work Performed / Progress Notes" />
      <div className="space-y-3">
        {[js.areasCompleted, js.fieldNotes, "", ""].slice(0, 4).map((line, i) => (
          <div key={i} className="border-b border-black min-h-[18px] text-[10pt]">{line ?? ""}</div>
        ))}
      </div>

      {/* Section 7: Issues / Touch-Ups */}
      <SectionTitle number={7} title="Issues / Touch-Ups / Return Visit Needed" />
      <div className="space-y-3">
        {[js.issuesEncountered, js.followUpNotes].map((line, i) => (
          <div key={i} className="border-b border-black min-h-[18px] text-[10pt]">{line ?? ""}</div>
        ))}
      </div>

      {/* Section 8: Completion Checklist */}
      <SectionTitle number={8} title="Completion Checklist" />
      <div className="grid grid-cols-2 gap-y-1">
        <CheckBox label="Site Cleaned" />
        <CheckBox label="Photos Taken" />
        <CheckBox checked={!!js.customerPresent} label="Customer Walkthrough" />
        <CheckBox label="Final Approval Pending" />
        <CheckBox label="Final Approval Received" />
        <CheckBox checked={!!js.followUpRequired} label="Follow-Up Required" />
      </div>

      {/* Section 9: Sign-Off */}
      <SectionTitle number={9} title="Sign-Off" />
      <div className="grid grid-cols-3 gap-x-6 mt-6">
        <div>
          <div className="border-t border-black pt-1 text-[8.5pt] uppercase font-semibold text-neutral-700">
            Crew Lead Signature
          </div>
        </div>
        <div>
          <div className="border-t border-black pt-1 text-[8.5pt] uppercase font-semibold text-neutral-700">
            Customer Signature
          </div>
        </div>
        <div>
          <div className="border-t border-black pt-1 text-[8.5pt] uppercase font-semibold text-neutral-700">
            Date
          </div>
        </div>
      </div>

      <PrintFooter />
    </PrintShell>
  );
}

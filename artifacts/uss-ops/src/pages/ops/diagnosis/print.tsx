import { useParams } from "wouter";
import {
  useGetDiagnosis,
  useGetProject,
  getGetDiagnosisQueryKey,
  getGetProjectQueryKey,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { PrintShell, PrintHeader, SectionTitle, FieldRow, CheckBox, PrintFooter } from "@/components/print/print-shell";
import type { DiagnosisWithRelations, ProjectDetailView } from "@/components/print/view-models";

const conditionScale = ["Excellent", "Good", "Fair", "Poor"];

function ConditionRating({ label, value }: { label: string; value?: string | null }) {
  const v = (value ?? "").toLowerCase();
  return (
    <div className="flex items-center justify-between border-b border-neutral-300 py-1">
      <span className="text-[9.5pt]">{label}</span>
      <div className="flex items-center gap-2">
        {conditionScale.map(s => (
          <CheckBox key={s} checked={v === s.toLowerCase()} label={s} />
        ))}
      </div>
    </div>
  );
}

function SourceDiagnosisRow({ label, status }: { label: string; status?: "good" | "watch" | "attention" | null }) {
  return (
    <div className="grid grid-cols-[1fr,auto,auto,auto] gap-x-3 items-center border-b border-neutral-300 py-1">
      <span className="text-[9.5pt]">{label}</span>
      <CheckBox checked={status === "good"} label="Good" />
      <CheckBox checked={status === "watch"} label="Watch" />
      <CheckBox checked={status === "attention"} label="Needs Attention" />
    </div>
  );
}

export default function DiagnosisPrint() {
  const { id } = useParams<{ id: string }>();
  const numericId = parseInt(id ?? "");
  const validId = Number.isFinite(numericId) && numericId > 0;
  const safeId = validId ? numericId : 0;
  const { data: dxRaw, isLoading, isError } = useGetDiagnosis(safeId, {
    query: { enabled: validId, queryKey: getGetDiagnosisQueryKey(safeId) },
  });
  const dx = dxRaw as DiagnosisWithRelations | undefined;
  const projectId = dx?.projectId;
  const { data: projectRaw } = useGetProject(projectId ?? 0, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId ?? 0) },
  });
  const project = projectRaw as ProjectDetailView | undefined;

  if (!validId) {
    return (
      <PrintShell backHref={`/ops/diagnosis`}>
        <div className="text-center text-red-700 py-12">Invalid diagnosis ID.</div>
      </PrintShell>
    );
  }
  if (isLoading) {
    return (
      <PrintShell backHref={`/ops/diagnosis`}>
        <div className="text-center text-neutral-500 py-12">Loading diagnosis...</div>
      </PrintShell>
    );
  }
  if (isError || !dx) {
    return (
      <PrintShell backHref={`/ops/diagnosis`}>
        <div className="text-center text-red-700 py-12">Diagnosis not found.</div>
      </PrintShell>
    );
  }

  const customer = dx.customer ?? project?.customer;
  const property = project?.property ?? null;
  const customerName = customer ? `${customer.firstName} ${customer.lastName}` : "";
  const propertyAddr = property?.address ?? "";
  const propertyCSZ = property ? `${property.city ?? ""}, ${property.state ?? ""} ${property.zip ?? ""}`.trim() : "";

  // Map fence/surface type
  const ft = (dx.fenceType ?? "").toLowerCase();
  const isFence = ft.includes("wood") || ft.includes("vinyl") || ft.includes("chain") || ft.includes("aluminum") || ft.includes("composite") || ft.includes("split_rail");

  // Map booleans to source-diagnosis status (true => attention)
  const sourceStatus = (flag: boolean | null | undefined): "good" | "attention" =>
    flag ? "attention" : "good";
  const moldStatus = sourceStatus(dx.moldMildew);
  const grayStatus = sourceStatus(dx.graying);
  const crackStatus = sourceStatus(dx.cracking);
  const repairStatus = sourceStatus(dx.repairNeeded);
  const moistureLevel = (dx.moistureLevel ?? "").toLowerCase();
  const moistureStatus = moistureLevel === "high" ? "attention" : moistureLevel === "medium" ? "watch" : "good";

  return (
    <PrintShell
      backHref={`/ops/diagnosis/${id}`}
      backLabel="Back to Diagnosis"
      documentTitle={`Diagnosis #${dx.id} — Source-to-Seal Profile`}
    >
      <PrintHeader title="DIAGNOSIS" />

      <h1 className="text-center text-[14pt] font-black tracking-wide uppercase mt-3 mb-1">
        Source-to-Seal Diagnosis &amp; Care Profile
      </h1>
      <div className="text-center text-[9pt] italic text-neutral-700 mb-3">
        Free with every on-site visit • From Source to Seal
      </div>

      {/* Section 1: Customer & Property Profile */}
      <SectionTitle number={1} title="Customer & Property Profile" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <FieldRow label="Diagnosis Date" value={dx.diagnosedAt ? format(new Date(dx.diagnosedAt), "MM/dd/yyyy") : ""} />
        <FieldRow label="Referred By" value={customer?.leadSourceDetail ?? ""} />
        <FieldRow label="Customer Name" value={customerName} />
        <FieldRow label="Phone" value={customer?.phone ?? ""} />
        <FieldRow label="Email" value={customer?.email ?? ""} />
        <div className="flex items-baseline gap-2" data-testid="row-preferred-contact">
          <span className="text-[8.5pt] font-semibold uppercase text-neutral-700 whitespace-nowrap">
            Preferred Contact:
          </span>
          <span className="flex items-center">
            <CheckBox label="Phone" />
            <CheckBox label="Text" />
            <CheckBox label="Email" />
          </span>
        </div>
        <FieldRow label="Property Address" value={propertyAddr} className="col-span-2" />
        <FieldRow label="City / State / ZIP" value={propertyCSZ} />
        <FieldRow label="Property Type" value={property?.propertyType ?? ""} />
      </div>

      {/* Section 2: Project / Surface Profile */}
      <SectionTitle number={2} title="Project / Surface Profile" />
      <div className="mb-1.5">
        <span className="text-[8.5pt] font-semibold uppercase text-neutral-700 mr-2">Surface:</span>
        <CheckBox checked={isFence} label="Fence" />
        <CheckBox label="Deck" />
        <CheckBox label="Pergola" />
        <CheckBox label="Siding" />
        <CheckBox label="Concrete" />
        <CheckBox label="Other" />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <FieldRow label="Surface Material" value={dx.woodType ?? dx.fenceType?.replace(/_/g, " ")} />
        <FieldRow label="Approx. Square Footage" value={dx.totalSqFt ?? ""} />
        <FieldRow label="Age of Surface (years)" value={dx.lastStainedYear ? `${new Date().getFullYear() - dx.lastStainedYear}` : ""} />
        <FieldRow label="Previous Product Used" value={dx.currentFinish ?? ""} />
        <FieldRow label="Last Service Date" value={dx.lastStainedYear ? `${dx.lastStainedYear}` : ""} />
        <FieldRow label="Desired Color / Finish" value={dx.productColor ?? ""} />
      </div>

      {/* Section 3: Source Diagnosis */}
      <SectionTitle number={3} title="Source Diagnosis" />
      <div className="text-[8.5pt] uppercase text-neutral-600 grid grid-cols-[1fr,auto,auto,auto] gap-x-3 pb-0.5 border-b border-black">
        <span></span><span>Good</span><span>Watch</span><span>Needs Attention</span>
      </div>
      <SourceDiagnosisRow label="UV / Sun Exposure" status={(dx.weatherExposure ?? "").toLowerCase().includes("high") ? "attention" : "watch"} />
      <SourceDiagnosisRow label="Moisture Exposure" status={moistureStatus} />
      <SourceDiagnosisRow label="Drainage Issues" />
      <SourceDiagnosisRow label="Sprinkler Contact" />
      <SourceDiagnosisRow label="Vegetation Contact" />
      <SourceDiagnosisRow label="Mold / Mildew" status={moldStatus} />
      <SourceDiagnosisRow label="Gray Weathering" status={grayStatus} />
      <SourceDiagnosisRow label="Peeling / Failure" status={crackStatus} />
      <SourceDiagnosisRow label="Absorption Condition" />
      <SourceDiagnosisRow label="Repair Needs" status={repairStatus} />

      {/* Section 4: Condition Snapshot */}
      <SectionTitle number={4} title="Condition Snapshot" />
      <ConditionRating label="Structural Condition" value={dx.fenceCondition} />
      <ConditionRating label="Surface Dryness" />
      <ConditionRating label="Stain Wear" value={dx.fenceCondition} />
      <ConditionRating label="Seal Protection" />
      <ConditionRating label="Sun Exposure" />
      <ConditionRating label="Water Exposure" value={moistureLevel === "high" ? "poor" : moistureLevel === "medium" ? "fair" : "good"} />
      <ConditionRating label="Cleanliness" />
      <ConditionRating label="Safety / Access" />

      {/* Section 5: Diagnosis Summary */}
      <SectionTitle number={5} title="Diagnosis Summary" />
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-black p-2">
          <div className="text-[8.5pt] uppercase font-bold text-neutral-700 mb-1">Source Findings</div>
          <div className="min-h-[36px] text-[9.5pt]">{dx.repairNotes ?? ""}</div>
        </div>
        <div className="border border-black p-2">
          <div className="text-[8.5pt] uppercase font-bold text-neutral-700 mb-1">Likely Cause</div>
          <div className="min-h-[36px] text-[9.5pt]"></div>
        </div>
        <div className="border border-black p-2">
          <div className="text-[8.5pt] uppercase font-bold text-neutral-700 mb-1">Risks if Left Untreated</div>
          <div className="min-h-[36px] text-[9.5pt]"></div>
        </div>
        <div className="border border-black p-2">
          <div className="text-[8.5pt] uppercase font-bold text-neutral-700 mb-1">Recommended Next Step</div>
          <div className="min-h-[36px] text-[9.5pt]">{dx.recommendedProduct ?? ""}</div>
        </div>
      </div>

      {/* Section 6: Recommended Care Plan */}
      <SectionTitle number={6} title="Recommended Care Plan" />
      <div className="mb-2">
        <span className="text-[8.5pt] font-semibold uppercase text-neutral-700 mr-2">Services:</span>
        <CheckBox checked={(dx.prepRequired ?? "").toLowerCase().includes("clean")} label="Clean" />
        <CheckBox checked={(dx.prepRequired ?? "").toLowerCase().includes("bright")} label="Brighten" />
        <CheckBox checked={(dx.recommendedProduct ?? "").toLowerCase().includes("stain")} label="Stain" />
        <CheckBox checked={(dx.recommendedProduct ?? "").toLowerCase().includes("seal")} label="Seal" />
        <CheckBox checked={!!dx.repairNeeded} label="Repair" />
        <CheckBox label="Recoat" />
        <CheckBox label="Maintenance Wash" />
        <CheckBox label="Other" />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <FieldRow label="Recommended Product System" value={dx.recommendedProduct ?? ""} />
        <FieldRow label="Color Notes" value={dx.productColor ?? ""} />
        <FieldRow label="Number of Coats" value={dx.recommendedCoats ?? ""} />
        <FieldRow label="Target Service Window" value="" />
        <FieldRow label="Follow-Up Recommendation" value={dx.careNotes ?? ""} className="col-span-2" />
      </div>

      {/* Section 7: Customer Profile & Portal Setup */}
      <SectionTitle number={7} title="Customer Profile & Portal Setup" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <CheckBox checked={!!customer?.portalEnabled} label="Portal Profile Created" />
        <CheckBox label="Monthly Update Enabled" />
        <FieldRow label="Customer Login Email" value={customer?.email ?? ""} className="col-span-2" />
        <FieldRow label="Next Recommended Check-In" value="" />
        <FieldRow label="Next Recommended Stain/Seal Window" value="" />
        <FieldRow label="Special Monitoring Notes" value="" className="col-span-2" />
      </div>
      <div className="mt-2 border border-[hsl(20,75%,28%)] bg-[hsl(38,40%,96%)] p-2 text-[9pt]">
        <div className="font-bold text-[hsl(20,75%,28%)] uppercase text-[8.5pt] mb-1">What the Customer Gets</div>
        Free portal access with stain/seal history, photos, recommendations, and proactive maintenance reminders.
      </div>

      {/* Section 8: Recommended Service Range */}
      <SectionTitle number={8} title="Recommended Service Range" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <FieldRow label="Recommended Service Level" value="" />
        <FieldRow label="Estimated Scope" value="" />
        <FieldRow
          label="Estimated Investment Range"
          value={dx.estimatedTotal ? `$${parseFloat(dx.estimatedTotal.toString()).toFixed(0)} – $${(parseFloat(dx.estimatedTotal.toString()) * 1.25).toFixed(0)}` : "$_____ – $_____"}
        />
        <FieldRow label="Optional Add-Ons" value="" />
      </div>
      <div className="text-[8pt] italic text-neutral-600 mt-1">
        Estimates are preliminary and subject to a final on-site verification. Final pricing will be provided in a written estimate.
      </div>

      {/* Section 9: Next Step & Sign-Off */}
      <SectionTitle number={9} title="Next Step & Sign-Off" />
      <FieldRow label="Customer Questions / Notes" value="" className="mb-2" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <FieldRow label="Next Follow-Up Date" value="" />
        <FieldRow label="Team Member" value="" />
      </div>
      <div className="grid grid-cols-2 gap-x-6 mt-6">
        <div>
          <div className="border-t border-black pt-1 text-[8.5pt] uppercase font-semibold text-neutral-700">
            Customer Signature &nbsp;·&nbsp; Date
          </div>
        </div>
        <div>
          <div className="border-t border-black pt-1 text-[8.5pt] uppercase font-semibold text-neutral-700">
            Company Representative &nbsp;·&nbsp; Date
          </div>
        </div>
      </div>

      <PrintFooter />
    </PrintShell>
  );
}

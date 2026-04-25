import { useState } from "react";
import { useParams } from "wouter";
import {
  useGetInvoice,
  useGetProject,
  getGetInvoiceQueryKey,
  getGetProjectQueryKey,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { PrintShell, PrintHeader, SectionTitle, FieldRow, CheckBox, PrintFooter } from "@/components/print/print-shell";
import type { InvoiceDetailWithRelations, ProjectDetailView } from "@/components/print/view-models";

const HARD_DISCLAIMER = `NOTICE: Exterior oil-based stain and seal products may cause minor incidental misting or overspray on adjacent surfaces such as concrete, siding, windows, vehicles, and landscaping. Ultimate Stain and Seal applies industry-standard masking, drop cloths, and overspray protection on every job; however, microscopic particles may still settle on surfaces near the work area. By signing this invoice the customer acknowledges that USS has reviewed protective measures, that incidental contact with adjacent surfaces is not considered damage under the terms of this contract, and that any post-completion staining of adjacent surfaces requested by the customer will be performed at the customer's expense.`;

const OIL_MIGRATION_DISCLOSURE = `ADJACENT SURFACES & OIL MIGRATION DISCLOSURE: Wood-penetrating oil and stain products may, over time, migrate or "bleed" through wood and onto adjacent porous surfaces (concrete, brick, pavers, mortar joints, soil) due to capillary action, weather, or wood movement. This natural migration is a property of the material and is not a defect in workmanship. The customer accepts responsibility for understanding this product behavior, agrees that any cleaning, sealing, or restoration of adjacent surfaces affected by oil migration is the customer's responsibility, and acknowledges that USS may decline warranty claims related to migration on surfaces not included in the scope of work.`;

export default function InvoicePrint() {
  const { id } = useParams<{ id: string }>();
  const numericId = parseInt(id ?? "");
  const validId = Number.isFinite(numericId) && numericId > 0;
  const safeId = validId ? numericId : 0;
  const { data: invoiceRaw, isLoading, isError } = useGetInvoice(safeId, {
    query: { enabled: validId, queryKey: getGetInvoiceQueryKey(safeId) },
  });
  const invoice = invoiceRaw as InvoiceDetailWithRelations | undefined;
  const projectId = invoice?.projectId;
  const { data: projectRaw } = useGetProject(projectId ?? 0, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId ?? 0) },
  });
  const project = projectRaw as ProjectDetailView | undefined;
  const isHardMode = invoice?.disclaimerMode === "hard";

  if (!validId) {
    return (
      <PrintShell backHref={`/ops/invoices`}>
        <div className="text-center text-red-700 py-12">Invalid invoice ID.</div>
      </PrintShell>
    );
  }
  if (isLoading) {
    return (
      <PrintShell backHref={`/ops/invoices`}>
        <div className="text-center text-neutral-500 py-12">Loading invoice...</div>
      </PrintShell>
    );
  }
  if (isError || !invoice) {
    return (
      <PrintShell backHref={`/ops/invoices`}>
        <div className="text-center text-red-700 py-12">Invoice not found.</div>
      </PrintShell>
    );
  }

  return <InvoicePrintBody invoice={invoice} project={project} isHardMode={isHardMode} id={id} />;
}

interface InvoiceBodyProps {
  invoice: InvoiceDetailWithRelations;
  project: ProjectDetailView | undefined;
  isHardMode: boolean;
  id: string;
}

function InvoicePrintBody({ invoice, project, isHardMode, id }: InvoiceBodyProps) {
  const [includeMigration, setIncludeMigration] = useState(true);

  const customer = invoice.customer ?? project?.customer;
  const property = project?.property ?? null;
  const invoiceProject = invoice.project ?? project;

  const customerName = customer ? `${customer.firstName} ${customer.lastName}` : "";
  const billingAddress = property
    ? `${property.address ?? ""}\n${property.city ?? ""}, ${property.state ?? ""} ${property.zip ?? ""}`
    : "";

  const lineItems = invoice.lineItems ?? [];
  const payments = invoice.payments ?? [];

  const toNum = (v: number | string | null | undefined) => parseFloat(v?.toString() ?? "0");
  const subtotal = toNum(invoice.subtotal);
  const taxRate = toNum(invoice.taxRate);
  const taxAmount = toNum(invoice.taxAmount);
  const discount = toNum(invoice.discountAmount);
  const total = toNum(invoice.totalAmount);
  const paid = toNum(invoice.paidAmount);
  const balance = toNum(invoice.balanceDue);

  const lastPayment = payments[payments.length - 1];
  const lastMethod = lastPayment?.paymentMethod ?? "";

  return (
    <PrintShell
      backHref={`/ops/invoices/${id}`}
      backLabel="Back to Invoice"
      documentTitle={`Invoice ${invoice.invoiceNumber}`}
    >
      <div className="no-print mb-3 flex items-center gap-4 text-[11pt] text-neutral-700">
        <span className="font-semibold">
          Disclaimer mode: <span className="text-[hsl(20,75%,28%)]">{isHardMode ? "Hard (legal)" : "Soft (standard)"}</span>
        </span>
        <span className="flex items-center gap-2">
          <input
            type="checkbox"
            id="include-migration"
            checked={includeMigration}
            onChange={(e) => setIncludeMigration(e.target.checked)}
            className="w-4 h-4"
            data-testid="checkbox-include-migration"
          />
          <label htmlFor="include-migration" className="cursor-pointer">
            Include Adjacent Surfaces &amp; Oil Migration disclosure
          </label>
        </span>
      </div>

      <PrintHeader title="INVOICE" />

      <h1 className="text-center text-[14pt] font-black tracking-wide uppercase mt-3 mb-3">
        Invoice &amp; Payment Record
      </h1>

      {/* Invoice meta */}
      <div className="grid grid-cols-4 gap-x-4 gap-y-1.5 mb-3 print-keep-together">
        <FieldRow label="Invoice #" value={invoice.invoiceNumber} />
        <FieldRow label="Invoice Date" value={format(new Date(invoice.createdAt), "MM/dd/yyyy")} />
        <FieldRow label="Due Date" value={invoice.dueDate ? format(new Date(invoice.dueDate), "MM/dd/yyyy") : ""} />
        <FieldRow label="Project #" value={invoice.projectId} />
      </div>

      {/* Section 2: Bill To */}
      <SectionTitle number={2} title="Bill To" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <FieldRow label="Customer Name" value={customerName} />
        <FieldRow label="Phone" value={customer?.phone ?? ""} />
        <FieldRow label="Email" value={customer?.email ?? ""} className="col-span-2" />
        <div className="col-span-2">
          <span className="text-[8.5pt] font-semibold uppercase text-neutral-700">Billing Address:</span>
          <div className="border border-black p-1.5 min-h-[36px] mt-0.5 text-[10pt] whitespace-pre-line">{billingAddress}</div>
        </div>
      </div>

      {/* Service Location */}
      <SectionTitle number={3} title="Service Location & Project Summary" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <FieldRow label="Service Address" value={property?.address ?? ""} className="col-span-2" />
        <FieldRow label="City / State / ZIP" value={property ? `${property.city}, ${property.state} ${property.zip}` : ""} />
        <FieldRow label="Project Type" value={invoiceProject?.serviceType ?? ""} />
        <FieldRow label="Crew Lead" value="" />
        <FieldRow label="Date of Service" value={invoiceProject?.completedDate ? format(new Date(invoiceProject!.completedDate), "MM/dd/yyyy") : ""} />
        <FieldRow label="Stain Color" value="" />
        <FieldRow label="Product Used" value="" />
      </div>

      {/* Section 4: Line Items */}
      <SectionTitle number={4} title="Line Items" />
      <table className="w-full border border-black border-collapse text-[9.5pt]">
        <thead>
          <tr className="bg-[hsl(20,75%,28%)] text-white">
            <th className="border border-black px-2 py-1.5 text-left font-bold">DESCRIPTION</th>
            <th className="border border-black px-2 py-1.5 text-right font-bold w-16">QTY</th>
            <th className="border border-black px-2 py-1.5 text-right font-bold w-24">UNIT PRICE</th>
            <th className="border border-black px-2 py-1.5 text-right font-bold w-24">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.length === 0 ? (
            <tr><td colSpan={4} className="border border-black px-2 py-3 text-center text-neutral-500">No line items</td></tr>
          ) : (
            lineItems.map((li: any) => (
              <tr key={li.id} className="align-top">
                <td className="border border-black px-2 py-1">{li.description}</td>
                <td className="border border-black px-2 py-1 text-right">{parseFloat(li.quantity?.toString() ?? "1").toFixed(2)}</td>
                <td className="border border-black px-2 py-1 text-right">${parseFloat(li.unitPrice?.toString() ?? "0").toFixed(2)}</td>
                <td className="border border-black px-2 py-1 text-right">${parseFloat(li.lineTotal?.toString() ?? "0").toFixed(2)}</td>
              </tr>
            ))
          )}
          {lineItems.length > 0 && lineItems.length < 5 && [...Array(5 - lineItems.length)].map((_, i) => (
            <tr key={`empty-${i}`} className="h-7">
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Section 5: Totals */}
      <div className="grid grid-cols-2 gap-x-6 mt-3">
        <div className="text-[9pt] italic text-neutral-700">
          Thank you for your business! All payments are due within 30 days unless otherwise stated.
        </div>
        <div className="text-[10pt]">
          <div className="flex justify-between border-b border-neutral-300 py-1"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between border-b border-neutral-300 py-1"><span>Tax ({(taxRate * 100).toFixed(2)}%)</span><span>${taxAmount.toFixed(2)}</span></div>
          {discount > 0 && (
            <div className="flex justify-between border-b border-neutral-300 py-1 text-green-700"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between border-b border-neutral-300 py-1"><span>Deposit Received</span><span>$_______</span></div>
          <div className="flex justify-between border-b border-neutral-300 py-1"><span>Adjustment</span><span>$_______</span></div>
          <div className="flex justify-between border-y-2 border-black py-1.5 my-1 font-bold text-[11pt]"><span>BALANCE DUE</span><span>${total.toFixed(2)}</span></div>
          <div className="flex justify-between border-b border-neutral-300 py-1"><span>Amount Paid Today</span><span>${paid.toFixed(2)}</span></div>
          <div className="flex justify-between border-y-2 border-black py-1.5 mt-1 font-bold text-[12pt] bg-[hsl(38,40%,92%)] px-1"><span>REMAINING BALANCE</span><span>${balance.toFixed(2)}</span></div>
        </div>
      </div>

      {/* Section 6: Payment Details */}
      <SectionTitle number={6} title="Payment Details" />
      <div className="mb-2">
        <span className="text-[8.5pt] font-semibold uppercase text-neutral-700 mr-2">Payment Method:</span>
        <CheckBox checked={lastMethod === "cash"} label="Cash" />
        <CheckBox checked={lastMethod === "check"} label="Check" />
        <CheckBox checked={lastMethod === "credit_card"} label="Credit / Debit Card" />
        <CheckBox checked={["zelle", "venmo", "ach"].includes(lastMethod)} label="Online (ACH/Zelle/Venmo)" />
        <CheckBox checked={lastMethod === "other"} label="Other" />
      </div>
      <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
        <FieldRow label="Payment Date" value={lastPayment ? format(new Date(lastPayment.paymentDate), "MM/dd/yyyy") : ""} />
        <FieldRow label="Check / Ref #" value={lastPayment?.checkNumber ?? lastPayment?.transactionId ?? ""} />
        <FieldRow label="Received By" value="" />
      </div>

      {/* Section 7: Notes */}
      <SectionTitle number={7} title="Notes / Work Performed / Customer Comments" />
      <div className="space-y-3">
        <div className="border-b border-black min-h-[18px] text-[10pt]">{invoice.notes ?? ""}</div>
        <div className="border-b border-black min-h-[18px]"></div>
        <div className="border-b border-black min-h-[18px]"></div>
      </div>

      {/* Section 8: Signatures */}
      <SectionTitle number={8} title="Signatures" />
      <div className="grid grid-cols-3 gap-x-6 mt-6 mb-2">
        <div>
          <div className="border-t border-black pt-1 text-[8.5pt] uppercase font-semibold text-neutral-700">Customer Signature</div>
        </div>
        <div>
          <div className="border-t border-black pt-1 text-[8.5pt] uppercase font-semibold text-neutral-700">Company Representative</div>
        </div>
        <div>
          <div className="border-t border-black pt-1 text-[8.5pt] uppercase font-semibold text-neutral-700">Date</div>
        </div>
      </div>

      {/* Section 9: Notice / Disclaimer */}
      <SectionTitle number={9} title={isHardMode ? "Legal Notice & Disclaimer" : "Notice"} />
      <div className="border border-black p-2 text-[8.5pt] leading-snug whitespace-pre-line">
        {isHardMode
          ? HARD_DISCLAIMER
          : (invoice.disclaimerText && invoice.disclaimerText.trim().length > 0
              ? invoice.disclaimerText
              : "Note: Weather conditions may affect drying time. USS is not responsible for re-staining needs due to extreme weather events within 30 days of service.")}
      </div>

      {/* Section 10: Adjacent Surfaces (Optional) */}
      {includeMigration && (
        <>
          <SectionTitle number={10} title="Adjacent Surfaces & Oil Migration Disclosure" />
          <div className="border border-black p-2 text-[8.5pt] leading-snug">
            {OIL_MIGRATION_DISCLOSURE}
          </div>
          <div className="grid grid-cols-2 gap-x-6 mt-4">
            <FieldRow label="Customer Initials" value="" />
            <FieldRow label="Date" value="" />
          </div>
        </>
      )}

      <PrintFooter />
    </PrintShell>
  );
}

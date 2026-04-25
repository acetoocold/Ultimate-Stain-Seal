import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Printer } from "lucide-react";
import ussLogo from "@assets/5C78B988-D51E-4DDC-93EC-03F01BF9B178_1777081283693.png";

interface PrintShellProps {
  backHref: string;
  backLabel?: string;
  documentTitle?: string;
  children: React.ReactNode;
}

export function PrintShell({
  backHref,
  backLabel = "Back",
  documentTitle,
  children,
}: PrintShellProps) {
  useEffect(() => {
    const prev = document.title;
    if (documentTitle) document.title = documentTitle;
    return () => {
      document.title = prev;
    };
  }, [documentTitle]);

  return (
    <div className="min-h-screen bg-neutral-200">
      <div className="no-print sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-[8.5in] mx-auto flex items-center justify-between px-4 py-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900"
            data-testid="link-print-back"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[hsl(20,75%,28%)] text-white text-sm font-semibold hover:bg-[hsl(20,75%,22%)] shadow"
            data-testid="button-print"
          >
            <Printer className="w-4 h-4" />
            Print Form
          </button>
        </div>
      </div>

      <div className="py-6 print:py-0">
        <div className="print-page mx-auto bg-white shadow-lg w-[8.5in] min-h-[11in] p-[0.5in] text-[10.5pt] leading-tight text-black">
          {children}
        </div>
      </div>
    </div>
  );
}

export function PrintHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-4">
      <div className="flex items-center gap-3">
        <img
          src={ussLogo}
          alt="Ultimate Stain and Seal"
          className="w-16 h-16 object-contain"
          data-testid="img-print-logo"
        />
        <div>
          <div className="font-black text-[15pt] tracking-tight text-[hsl(20,75%,28%)] leading-none">
            ULTIMATE STAIN AND SEAL
          </div>
          <div className="text-[8.5pt] text-neutral-700 mt-0.5">
            Built for the Field. Backed by the Best.
          </div>
        </div>
      </div>
      <div className="text-right text-[8.5pt] text-neutral-800 leading-snug">
        <div className="font-semibold">(214) 555-0142</div>
        <div>info@ultimatestainandseal.com</div>
        <div>www.ultimatestainandseal.com</div>
        <div>P.O. Box 1284, McKinney, TX 75070</div>
        <div className="italic mt-0.5">Proudly Serving North Texas</div>
      </div>
    </div>
  );
}

export function SectionTitle({
  number,
  title,
  className = "",
}: {
  number: number;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-[hsl(20,75%,28%)] text-white px-2 py-1 text-[10pt] font-bold uppercase tracking-wide mt-3 mb-2 ${className}`}
    >
      Section {number} — {title}
    </div>
  );
}

export function FieldRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string | number | null;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className="text-[8.5pt] font-semibold uppercase text-neutral-700 whitespace-nowrap">
        {label}:
      </span>
      <span className="flex-1 border-b border-black min-h-[14px] text-[10pt] px-1">
        {value ?? ""}
      </span>
    </div>
  );
}

export function CheckBox({
  checked = false,
  label,
}: {
  checked?: boolean;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 mr-3 text-[9.5pt]">
      <span className={`blank-box ${checked ? "checked" : ""}`} />
      {label}
    </label>
  );
}

export function PrintFooter() {
  return (
    <div className="border-t border-neutral-400 mt-4 pt-2 text-center text-[8pt] text-neutral-600">
      Ultimate Stain and Seal &nbsp;·&nbsp; (214) 555-0142 &nbsp;·&nbsp;
      www.ultimatestainandseal.com &nbsp;·&nbsp; Proudly Serving North Texas
    </div>
  );
}

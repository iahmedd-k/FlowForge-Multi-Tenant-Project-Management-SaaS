import { Link } from "react-router-dom";

type FlowForgeLogoProps = {
  to?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
};

const markClassName = {
  regular: "grid h-9 w-9 grid-cols-2 gap-[3px] rounded-[10px] bg-white p-[5px] shadow-sm ring-1 ring-[#dde4f4]",
  compact: "grid h-8 w-8 grid-cols-2 gap-[3px] rounded-[10px] bg-white p-[5px] shadow-sm ring-1 ring-[#dde4f4]",
};

function LogoInner({ subtitle, compact = false, className = "" }: Omit<FlowForgeLogoProps, "to">) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <span className={compact ? markClassName.compact : markClassName.regular} aria-hidden="true">
        <span className="rounded-full bg-[#635bff]" />
        <span className="rounded-full bg-[#7b74ff]" />
        <span className="rounded-full bg-[#4da6ff]" />
        <span className="rounded-full bg-[#9c7bff]" />
      </span>
      <span className="min-w-0 leading-none">
        <span className={`block font-display font-semibold text-[#1f2a44] ${compact ? "text-lg" : "text-[18px]"}`}>
          FlowForge
          {subtitle ? <span className="font-normal text-[#4f5d81]"> {subtitle}</span> : null}
        </span>
      </span>
    </span>
  );
}

export default function FlowForgeLogo({ to, subtitle, className, compact = false }: FlowForgeLogoProps) {
  if (to) {
    return (
      <Link to={to} className="inline-flex items-center">
        <LogoInner subtitle={subtitle} compact={compact} className={className} />
      </Link>
    );
  }

  return <LogoInner subtitle={subtitle} compact={compact} className={className} />;
}

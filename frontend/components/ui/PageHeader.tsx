import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backText?: string;
}

export default function PageHeader({ 
  title, 
  subtitle, 
  backHref = "/dashboard", 
  backText = "Back" 
}: PageHeaderProps) {
  return (
    <div className="mb-10">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        {backText}
      </Link>
      
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

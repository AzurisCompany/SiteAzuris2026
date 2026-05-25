import { TECH_ROWS, techMaskUrl, type Tech } from "@/lib/tech-stack";

// Lookup case-insensitive por nome canônico
const TECH_LOOKUP = new Map<string, Tech>(
  TECH_ROWS.flat().map((t) => [t.name.toLowerCase(), t]),
);

// Aliases comuns que aparecem nos cases mas não são exatamente o nome catálogo
const ALIASES: Record<string, string> = {
  "delta": "delta lake",
  "starburst": "trino",
  "redpanda": "kafka",
  "hadoop": "hive",
  "hdfs": "hive",
  "great expectations": "",
  "sql": "",
  "mahout": "",
  "pig": "",
};

function resolveTech(name: string): Tech | undefined {
  const key = name.toLowerCase().trim();
  const direct = TECH_LOOKUP.get(key);
  if (direct) return direct;
  const alias = ALIASES[key];
  return alias ? TECH_LOOKUP.get(alias) : undefined;
}

type Props = {
  name: string;
  /** sm = compacto pra dentro de cards; md = como na home */
  size?: "sm" | "md";
};

export function TechChip({ name, size = "sm" }: Props) {
  const tech = resolveTech(name);
  const url = tech ? techMaskUrl(tech) : null;
  const isMd = size === "md";

  const base =
    "inline-flex items-center rounded-full border border-slate/60 bg-ink/60 font-mono text-foam/70 hover:text-cyan-brand hover:border-cyan-brand/50 transition-colors";
  const sizing = isMd
    ? "gap-2.5 px-4 py-2 text-sm"
    : "gap-1.5 px-2.5 py-1 text-[11px]";
  const iconSize = isMd ? "size-5" : "size-3.5";

  const Inner = (
    <>
      {url ? (
        <span
          aria-hidden
          className={`${iconSize} bg-current shrink-0`}
          style={{
            WebkitMaskImage: `url("${url}")`,
            maskImage: `url("${url}")`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
      ) : null}
      <span>{name}</span>
    </>
  );

  if (tech) {
    return (
      <a
        href={tech.url}
        target="_blank"
        rel="noopener noreferrer"
        title={`${name} — site oficial`}
        className={`${base} ${sizing}`}
      >
        {Inner}
      </a>
    );
  }

  return <span className={`${base} ${sizing} cursor-default`}>{Inner}</span>;
}

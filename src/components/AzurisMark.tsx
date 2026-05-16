import type { SVGProps } from "react";

/**
 * AzurisMark — versão isolada do "A" da Azuris com gradiente animado.
 * O gradiente desce pelo SVG em loop, simulando dados fluindo pela marca.
 * O viewBox foi recortado pra mostrar SÓ o A (sem o wordmark do SVG original).
 */
export function AzurisMark({
  className,
  animated = true,
  ...rest
}: SVGProps<SVGSVGElement> & { animated?: boolean }) {
  // Unique id para múltiplas instâncias na mesma página
  const id = "azuris-flow";

  return (
    <svg
      viewBox="60 -5 250 175"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      <defs>
        <linearGradient
          id={id}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="35%" stopColor="#14b7de" />
          <stop offset="50%" stopColor="#7dd3fc" />
          <stop offset="65%" stopColor="#14b7de" />
          <stop offset="100%" stopColor="#0891b2" />
          {animated ? (
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="0 -1"
              to="0 1"
              dur="3s"
              repeatCount="indefinite"
            />
          ) : null}
        </linearGradient>

        {/* Glow filter (sutil) */}
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        fill={`url(#${id})`}
        filter={`url(#${id}-glow)`}
        d="m190.82,0c37.53,0,67.96,30.42,67.96,67.96,0,1.5-.05,2.99-.15,4.46,24.4.51,44.2,20.63,44.2,45.15s-20.32,45.16-45.16,45.16h-15.16L185.96,26.5l-56.55,136.22h-8.08c-28.73,0-52.25-23.51-52.25-52.25s23.52-52.25,52.25-52.25h2.22C128.29,25.3,156.6,0,190.82,0h0Zm30.84,162.72h0l-13.29-32.3h-44.81l-13.29,32.3h71.4Zm-19.86-49.69h0l-15.84-40.37-15.84,40.37h31.68Z"
      />
    </svg>
  );
}

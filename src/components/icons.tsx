import type { SVGProps } from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export type IconName = "scan" | "layers" | "flag" | "doc" | "brain" | "plug";

function Scan(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8" />
      <path d="M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8" />
      <path d="M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16" />
      <path d="M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <path d="M4 12h16" />
    </svg>
  );
}

function Layers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="m3 13 9 5 9-5" />
      <path d="m3 16.5 9 5 9-5" />
    </svg>
  );
}

function Flag(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 21V4" />
      <path d="M5 4h13l-3 4.5L18 13H5" />
    </svg>
  );
}

function Doc(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

function Brain(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3.2 3.2 0 0 0 2 5.6A3 3 0 0 0 9 20" />
      <path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3.2 3.2 0 0 1-2 5.6A3 3 0 0 1 15 20" />
      <path d="M9 4v16" />
      <path d="M15 4v16" />
    </svg>
  );
}

function Plug(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M9 3v5" />
      <path d="M15 3v5" />
      <path d="M6 8h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8Z" />
      <path d="M12 17v4" />
    </svg>
  );
}

const icons: Record<IconName, (props: SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  scan: Scan,
  layers: Layers,
  flag: Flag,
  doc: Doc,
  brain: Brain,
  plug: Plug,
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const Component = icons[name];
  return <Component {...props} />;
}

import Image from "next/image";
import Link from "next/link";

export default function Wordmark({
  className = "",
  size = "md",
  href,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
}) {
  // Logo is landscape; intrinsic size after crop is ~738x762 but we render
  // to a fixed height with auto width.
  const heights = { sm: 36, md: 48, lg: 72 } as const;
  const h = heights[size];
  const img = (
    <Image
      src="/brand/logo.png"
      alt="OraMongale Tradings"
      width={140}
      height={h}
      style={{ height: h, width: "auto" }}
      priority
      unoptimized
      className="object-contain"
    />
  );
  if (href) {
    return (
      <Link href={href} className={"inline-flex items-center " + className}>
        {img}
      </Link>
    );
  }
  return <div className={"inline-flex items-center " + className}>{img}</div>;
}

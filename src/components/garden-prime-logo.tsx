import { cn } from "@/lib/utils";
import logoImg from "@/assets/garden-prime-logo.png";
import logoHorizontalImg from "@/assets/garden-prime-lado.png";

export function GardenPrimeLogo({
  className,
  imgClassName,
  size = "default",
  horizontal = false,
}: {
  className?: string;
  imgClassName?: string;
  size?: "small" | "default" | "large";
  horizontal?: boolean;
}) {
  const height = horizontal
    ? size === "small"
      ? "h-9"
      : size === "large"
        ? "h-14"
        : "h-11"
    : size === "small"
      ? "h-8"
      : size === "large"
        ? "h-20"
        : "h-10";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src={horizontal ? logoHorizontalImg : logoImg}
        alt="GARDEN PRIME"
        className={cn("w-auto object-contain max-w-full", imgClassName || height)}
      />
    </div>
  );
}

export const GardenPrimeLogoHorizontal = (
  props: Omit<Parameters<typeof GardenPrimeLogo>[0], "horizontal">,
) => <GardenPrimeLogo {...props} horizontal />;

export const VivaverdeLogo = GardenPrimeLogo;

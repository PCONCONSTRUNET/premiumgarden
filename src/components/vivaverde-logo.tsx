import { cn } from "@/lib/utils";
import logoImg from "@/assets/vivaverde-logo.png";

export function VivaverdeLogo({
  className,
  size = "default",
}: {
  className?: string;
  size?: "small" | "default" | "large";
}) {
  const height = size === "small" ? "h-8" : size === "large" ? "h-20" : "h-10";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img src={logoImg} alt="VIVAVERDE" className={cn("w-auto object-contain", height)} />
    </div>
  );
}

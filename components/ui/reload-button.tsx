import * as React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface ReloadButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
  "aria-label"?: string;
}

export const ReloadButton: React.FC<ReloadButtonProps> = ({
  onClick,
  loading = false,
  className = "",
  "aria-label": ariaLabel = "Reload",
}) => (
  <Button
    variant="outline"
    size="icon"
    className={className}
    onClick={onClick}
    disabled={loading}
    aria-label={ariaLabel}
  >
    <RotateCcw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
  </Button>
);

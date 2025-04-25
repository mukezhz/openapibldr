import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddButtonProps {
  onClick: () => void;
  label: string;
  fullWidth?: boolean;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  className?: string;
}

export const AddButton: React.FC<AddButtonProps> = ({
  onClick,
  label,
  fullWidth = false,
  variant = "outline",
  size = "default",
  disabled = false,
  className = "",
}) => {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={`${fullWidth ? "w-full" : ""} ${className}`}
    >
      <Plus className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
};

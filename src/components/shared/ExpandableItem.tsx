import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

interface ExpandableItemProps {
  title: string | React.ReactNode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  badge?: React.ReactNode;
  stopPropagation?: boolean;
}

export const ExpandableItem: React.FC<ExpandableItemProps> = ({
  title,
  isExpanded,
  onToggleExpand,
  onDelete,
  canDelete = true,
  children,
  className = "border rounded-md p-4",
  titleClassName = "text-md font-medium",
  badge,
  stopPropagation = true,
}) => {
  const handleClick = () => {
    onToggleExpand();
  };

  const handleDelete = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    onDelete?.();
  };

  return (
    <div className={className}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 mr-2" />
          ) : (
            <ChevronDown className="h-5 w-5 mr-2" />
          )}
          <div className="flex items-center">
            <h4 className={titleClassName}>{title}</h4>
            {badge && <div className="ml-2">{badge}</div>}
          </div>
        </div>

        {canDelete && onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {isExpanded && <div className="space-y-4 mt-4">{children}</div>}
    </div>
  );
};

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import {
  FileUp,
  Info,
  Server,
  Boxes,
  Shield,
  Route as RouteIcon,
  X,
} from "lucide-react";

const navItems = [
  { id: "info", label: "API Info", icon: <Info className="h-5 w-5 mr-2" /> },
  {
    id: "servers",
    label: "Servers",
    icon: <Server className="h-5 w-5 mr-2" />,
  },
  { id: "paths", label: "Paths", icon: <RouteIcon className="h-5 w-5 mr-2" /> },
  {
    id: "components",
    label: "Components",
    icon: <Boxes className="h-5 w-5 mr-2" />,
  },
  {
    id: "security",
    label: "Security",
    icon: <Shield className="h-5 w-5 mr-2" />,
  },
];

interface SidebarProps {
  showImport: boolean;
  onToggleImport: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ showImport, onToggleImport }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveNavFromPath = () => {
    const path = location.pathname.split("/")[1];
    return path || "info";
  };

  const activeNav = showImport ? "import" : getActiveNavFromPath();

  const handleNavChange = (navId: string) => {
    if (showImport && navId !== "import") {
      onToggleImport();
    }
    navigate(`/${navId}`);
  };

  const handleToggleImport = () => {
    onToggleImport();
    navigate(showImport ? `/info` : "/import");
  };

  return (
    <div className="w-64 border-r bg-muted/10 flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">OpenApiBldr</h1>
        <p className="text-sm text-muted-foreground">OpenAPI 3.1 Builder</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavChange(item.id)}
            className={cn(
              "flex items-center w-full px-3 py-2 rounded-md text-left transition-colors",
              activeNav === item.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t">
        <Button
          onClick={handleToggleImport}
          variant="outline"
          className="flex items-center w-full"
        >
          {showImport ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancel Import
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              Import OpenAPI
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
export { navItems };

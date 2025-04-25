import React from "react";
import { useLocation } from "react-router-dom";
import { navItems } from "./Sidebar";

interface ContentHeaderProps {
  showImport: boolean;
}

const ContentHeader: React.FC<ContentHeaderProps> = ({ showImport }) => {
  const location = useLocation();

  // Get active navigation item from URL path
  const getActiveNavFromPath = () => {
    const path = location.pathname.split("/")[1];
    return path || "info"; // Default to info if no path
  };

  const activeNav = showImport ? "import" : getActiveNavFromPath();

  const getFormTitle = () => {
    if (showImport) return "Import OpenAPI Specification";
    const activeItem = navItems.find((item) => item.id === activeNav);
    return activeItem ? activeItem.label : "Form";
  };

  const getFormDescription = () => {
    if (showImport) return "";

    switch (activeNav) {
      case "info":
        return "Define basic information about your API including title, version, and contact details.";
      case "servers":
        return "Configure server URLs where your API is hosted.";
      case "paths":
        return "Define API endpoints, HTTP methods, and responses.";
      case "components":
        return "Create reusable schemas, parameters, and responses.";
      case "security":
        return "Define security requirements for your API.";
      default:
        return "";
    }
  };

  return (
    <div className="px-8 py-6 border-b">
      <div className="flex items-center">
        {!showImport && navItems.find((item) => item.id === activeNav)?.icon}
        <h2 className="text-2xl font-semibold ml-2">{getFormTitle()}</h2>
      </div>
      {!showImport && (
        <p className="text-muted-foreground mt-2">{getFormDescription()}</p>
      )}
    </div>
  );
};

export default ContentHeader;

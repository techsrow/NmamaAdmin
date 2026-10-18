import NavigationManager from "./NavigationManager";
import InventoryTools from "../inventory/InventoryTools";
import React from "react";
import { Navigate, useParams } from "react-router-dom";
import ProductionModulePage from "./ProductionModulePage";
import CollectionsMerchandisingPage from "./CollectionsMerchandisingPage";
import SearchDiscoveryPage from "./SearchDiscoveryPage";
import InventoryPage from "./InventoryPage";
import PaymentsPage from "../payments/PaymentsPage";
import ShippingPage from "../shipping/ShippingPage";
import { productionConfigs } from "./productionConfigs";

export default function ModuleRoute() {
  const { module } = useParams();
  if (module === "navigation") return <NavigationManager />;
  if(["barcodes","reconciliation","ledger"].includes(module))return <InventoryTools key={module} mode={module}/>;
  if (module === "collections") return <CollectionsMerchandisingPage />;
  if (module === "search") return <SearchDiscoveryPage />;
  if (module === "inventory") return <InventoryPage />;
  if (module === "payments") return <PaymentsPage />;
  if (module === "shipping") return <ShippingPage />;
  const config = productionConfigs[module];
  if (!config) return <Navigate to="/dashboard" replace />;
  return <ProductionModulePage key={module} config={config} />;
}

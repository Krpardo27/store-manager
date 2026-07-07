export const dashboardNavItems = [
  { href: "/dashboard", label: "Inicio", description: "Resumen general", iconKey: "home" },
  { href: "/dashboard/ventas", label: "Ventas", description: "Registro comercial", iconKey: "sales" },
  {
    href: "/dashboard/inventario",
    label: "Inventario",
    description: "Stock y reposicion",
    iconKey: "inventory",
  },
  { href: "/dashboard/clientes", label: "Clientes", description: "Historial y atencion", iconKey: "clients" },
  { href: "/dashboard/caja", label: "Caja", description: "Ingresos y cierre", iconKey: "cash" },
] as const;
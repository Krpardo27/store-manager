export const dashboardNavItems = [
  { href: "/dashboard", label: "Inicio", description: "Resumen general" },
  { href: "/dashboard/ventas", label: "Ventas", description: "Registro comercial" },
  { href: "/dashboard/inventario", label: "Inventario", description: "Stock y reposicion" },
  { href: "/dashboard/clientes", label: "Clientes", description: "Historial y atencion" },
  { href: "/dashboard/caja", label: "Caja", description: "Ingresos y cierre" },
] as const;
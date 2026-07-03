export const dashboardNavItems = [
  { href: "/auth", label: "Inicio", description: "Resumen general" },
  { href: "/auth/ventas", label: "Ventas", description: "Registro comercial" },
  { href: "/auth/inventario", label: "Inventario", description: "Stock y reposicion" },
  { href: "/auth/clientes", label: "Clientes", description: "Historial y atencion" },
  { href: "/auth/caja", label: "Caja", description: "Ingresos y cierre" },
] as const;
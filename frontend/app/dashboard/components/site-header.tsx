export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 bg-zinc-50 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) m-0 p-0">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 m-0">
        <h1 className="text-lg font-semibold text-zinc-800 m-0">Bienvenido al Sistema de Ferias IUIAI WASI</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-sm text-zinc-600">
            Panel de Administración
          </div>
        </div>
      </div>
    </header>
  )
}

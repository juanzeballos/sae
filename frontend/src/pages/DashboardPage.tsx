import AppLayout from '@/components/layout/AppLayout'

function DashboardPage() {
  return (
    <AppLayout>
      <div className="p-6 space-y-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al SAE. Las métricas se implementan en fases futuras.
        </p>
      </div>
    </AppLayout>
  )
}

export default DashboardPage

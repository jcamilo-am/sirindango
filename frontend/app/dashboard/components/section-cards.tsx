import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total productos</CardDescription>
          <CardTitle className="text-4xl font-bold tabular-nums text-green-600 @[250px]/card:text-5xl">
            45
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total ventas</CardDescription>
          <CardTitle className="text-4xl font-bold tabular-nums text-green-600 @[250px]/card:text-5xl">
            $30,412
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Participación en ferias y eventos</CardDescription>
          <CardTitle className="text-4xl font-bold tabular-nums text-red-600 @[250px]/card:text-5xl">
            5
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}

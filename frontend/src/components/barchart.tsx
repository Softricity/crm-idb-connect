"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type ChartBarMixedProps = {
  title?: string
  description?: string
  chartData: {
    [key: string]: any
  }[]
  dataKey: string
  categoryKey: string
  chartConfig: ChartConfig
  footerText?: string
  footerSubText?: string
}

export function ChartBarMixed({
  title,
  description,
  chartData,
  dataKey,
  categoryKey,
  chartConfig,
  footerText,
  footerSubText,
}: ChartBarMixedProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-auto">
        <ChartContainer config={chartConfig}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              left: 20,
              right:20
            }}
          >
            <YAxis
              dataKey={categoryKey}
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) =>
                chartConfig[value as keyof typeof chartConfig]?.label || value
              }
            />
            <XAxis dataKey={dataKey} type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey={dataKey} layout="vertical" radius={5} label />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

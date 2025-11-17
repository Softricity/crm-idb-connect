"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"

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

type ChartPieDonutProps = {
  title?: string
  description?: string
  chartData: any[]
  dataKey: string
  nameKey: string
  chartConfig: ChartConfig
  footerText?: string
  footerSubText?: string
}

export function ChartPieDonut({
  title = "Pie Chart - Donut",
  description = "Showing data summary",
  chartData,
  dataKey,
  nameKey,
  chartConfig,
  footerText = "Trending up by 5.2% this month",
  footerSubText = "Showing data for the selected period",
}: ChartPieDonutProps) {
  return (
    <Card className="flex flex-col w-full">
      <CardHeader className="items-center pb-0 text-center">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart
            margin={{
              left: 30,
              right: 20
            }}
            
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey={dataKey}
              nameKey={nameKey}
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
              label
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

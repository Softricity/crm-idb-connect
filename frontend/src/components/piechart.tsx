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

import { cn } from "@/lib/utils"

type ChartPieDonutProps = {
  title?: string
  description?: string
  chartData: any[]
  dataKey: string
  nameKey: string
  chartConfig: ChartConfig
  footerText?: string
  footerSubText?: string
  className?: string
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
  className,
}: ChartPieDonutProps) {
  const contentHeight = 350;

  return (
    <Card className={cn("flex flex-col w-full", className)}>
      <CardHeader className="items-center pb-2 text-center">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pt-0" style={{ height: contentHeight }}>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-full"
        >
          <PieChart
            margin={{
              left: 30,
              right: 20,
              bottom: 20
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

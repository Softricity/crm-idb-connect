"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { cn } from "@/lib/utils"
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
  className?: string
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
  className,
}: ChartBarMixedProps) {
  const contentHeight = 350; // Standardize on a comfortable height
  const barHeight = 45; // Height per bar including spacing
  const chartHeight = Math.max(contentHeight - 100, chartData.length * barHeight);

  return (
    <Card className={cn("w-full flex flex-col", className)}>
      <CardHeader className="pb-0 pt-4 px-4">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto overflow-x-hidden pt-0 px-2 pb-2" style={{ height: contentHeight }}>
        <div style={{ height: chartHeight, minWidth: '100%' }}>
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{
                left: 100,
                right: 20,
                top: 10,
                bottom: 10
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
              <Bar dataKey={dataKey} layout="vertical" radius={5} barSize={24} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

import { Card, CardHeader, CardBody } from "@heroui/react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

type Props = {
  data: Record<string, number>;
  loading?: boolean;
};

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#8dd1e1", "#a4de6c", "#d0ed57", "#8884d8"];

export default function StatusChart({ data }: Props) {
  const items = Object.entries(data).map(([name, value]) => ({ name, value }));
  return (
    <Card shadow="sm" radius="none" className="border border-gray-100 bg-white overflow-hidden rounded-3xl">
      <CardHeader className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
         <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Leads by Status</h2>
      </CardHeader>
      <CardBody className="p-6" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={0}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <Sector {...props} outerRadius={outerRadius + 10} />
              )}
            >
              {items.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};

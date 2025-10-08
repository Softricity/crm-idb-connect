import { Card, CardHeader, CardBody } from "@heroui/react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

type Props = {
  data: Record<string, number>;
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#7B68EE", "#40E0D0", "#FF69B4", "#BDB76B"];

export default function SourceChart ({ data }: Props) {
  const items = Object.entries(data).map(([name, value]) => ({ name, value }));
  return (
    <Card shadow="md" radius="lg">
      <CardHeader>Leads by Source</CardHeader>
      <CardBody style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie dataKey="value" data={items} outerRadius={100} label>
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

import { Card, CardHeader, CardBody } from "@heroui/react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

type Props = {
  data: Record<string, number>;
  loading?: boolean;
};

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#8dd1e1", "#a4de6c", "#d0ed57", "#8884d8"];

export default function StatusChart ({ data }: Props)  {
  const items = Object.entries(data).map(([name, value]) => ({ name, value }));
  return (
    <Card shadow="md" radius="lg">
      <CardHeader>Leads by Status</CardHeader>
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

import { Card, CardHeader, CardBody } from "@heroui/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Point = { label: string; count: number };
type Props = { data: Point[] };

export const LeadsLast7Days = ({ data }: Props) => {
  return (
    <Card shadow="md" radius="lg">
      <CardHeader>Leads Created (Last 7 Days)</CardHeader>
      <CardBody style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};

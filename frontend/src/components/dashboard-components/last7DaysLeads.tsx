import { Card, CardHeader, CardBody } from "@heroui/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Point = { label: string; count: number };
type Props = { data: Point[] };

export const LeadsLast7Days = ({ data }: Props) => {
  return (
    <Card shadow="sm" radius="none" className="border border-gray-100 bg-white overflow-hidden rounded-3xl">
      <CardHeader className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
         <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Leads Created (Last 7 Days)</h2>
      </CardHeader>
      <CardBody className="p-6" style={{ height: 320 }}>
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

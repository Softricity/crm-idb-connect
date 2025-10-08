import { Card, CardHeader, CardBody, Spinner } from "@heroui/react";
import { ReactNode } from "react";

type DashboardTileProps = {
    label: string;
    value: number | string;
    icon?: ReactNode;
    loading?: boolean;
};

export default function DashboardTile({ label, value, icon, loading }: DashboardTileProps) {
    return (
        <Card shadow="md" radius="lg" className="h-full">
            <CardHeader className="flex items-center justify-between">
                <span className="text-sm text-foreground/70">{label}</span>
                {icon}
            </CardHeader>
            <CardBody className="pt-0">
                {loading ? (
                    <div className="flex items-center justify-center h-16">
                        <Spinner label="Loading..." />
                    </div>
                ) : (
                    <div className="text-3xl font-semibold">{value}</div>
                )}
            </CardBody>
        </Card>
    );
};

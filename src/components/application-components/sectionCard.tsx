"use client";

import React from "react";
import {Card, CardHeader, CardBody, Divider} from "@heroui/react";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export default function SectionCard({title, subtitle, actions, children}: SectionCardProps) {
  return (
    <Card shadow="sm" radius="sm" className="w-full">
      <CardHeader className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h3 className="text-base font-semibold">{title}</h3>
          {subtitle ? <p className="text-xs text-foreground-500">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </CardHeader>
      <Divider />
      <CardBody>{children}</CardBody>
    </Card>
  );
}

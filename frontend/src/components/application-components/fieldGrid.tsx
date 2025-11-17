"use client";

import React from "react";

type FieldGridProps = { children: React.ReactNode };

export default function FieldGrid({children}: FieldGridProps) {
  return (
    <div
      className="grid [grid-template-columns:minmax(260px,1fr)_minmax(260px,1fr)] gap-x-6 gap-y-2"
    >
      {children}
    </div>
  );
}

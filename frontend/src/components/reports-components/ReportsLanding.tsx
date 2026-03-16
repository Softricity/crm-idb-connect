"use client";

import { REPORT_CARDS } from "@/config/reports";
import { Button } from "@heroui/react";
import Link from "next/link";

const LAST_VISITED_KEY = "crm_reports_last_visited";

type LastVisitedMap = Record<string, string>;

function readLastVisited(): LastVisitedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LAST_VISITED_KEY);
    return raw ? (JSON.parse(raw) as LastVisitedMap) : {};
  } catch {
    return {};
  }
}

export default function ReportsLanding() {
  const lastVisited = readLastVisited();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Reports</h1>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {REPORT_CARDS.map((card) => (
          <div key={card.type} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <h3 className="text-2xl font-semibold mb-1">{card.title}</h3>
            <p className="text-sm text-gray-600 mb-5">{card.description}</p>
            <div className="flex items-center gap-3">
              <Button as={Link} href={card.route} color="primary" className="text-white">
                View Report
              </Button>
              <span className="text-sm text-gray-500">
                Last visited: {lastVisited[card.type] ? new Date(lastVisited[card.type]).toLocaleString() : "Never"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

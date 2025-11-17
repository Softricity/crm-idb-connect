"use client";
import { Dispatch, SetStateAction } from "react";
import { Lead, useLeadStore } from "@/stores/useLeadStore"; 
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import LeadsTable from "./leadsTable";
import { ColumnConfig } from "./columnVisibilitySelector";

type LeadsDisplayProps = {
  leads: Lead[];
  selectedLeadIds: string[];
  setSelectedLeadIds: Dispatch<SetStateAction<string[]>>;
  columns: ColumnConfig[];
};

export default function LeadsDisplay({ leads, selectedLeadIds, setSelectedLeadIds, columns }: LeadsDisplayProps) {
  
  const { loading } = useLeadStore();
  
  if (loading) {
    return <LeadsTableSkeleton />;
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
        <p>No leads found. Start by adding a new lead!</p>
      </div>
    );
  }

  return <LeadsTable leads={leads} selectedLeadIds={selectedLeadIds} setSelectedLeadIds={setSelectedLeadIds} columns={columns} />;
}



function LeadsTableSkeleton() {
  return (
    <div className="w-full">
      <div className="max-h-[67vh] overflow-y-auto">
        <Table className="relative">
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[50px]"><Skeleton className="h-4 w-4" /></TableHead>
              <TableHead><Skeleton className="h-4 w-32" /></TableHead>
              <TableHead><Skeleton className="h-4 w-32" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead className="text-center"><Skeleton className="h-4 w-16" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
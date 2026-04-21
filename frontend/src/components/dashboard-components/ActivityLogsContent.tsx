"use client";

import React, { useEffect, useState } from "react";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { TimelineItem } from "@/components/dashboard-components/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Pagination } from "@heroui/react";

export default function ActivityLogsContent() {
  const { globalTimeline, fetchGlobalTimeline, loading, globalPagination } = useTimelineStore();
  const [page, setPage] = useState(1);
  const limit = 20;
  const safeGlobalPagination = globalPagination || { total: 0, page: 1, limit, totalPages: 0 };

  useEffect(() => {
    fetchGlobalTimeline(page, limit);
  }, [fetchGlobalTimeline, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <Activity size={24} />
        </div>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
            <p className="text-gray-500 text-sm">Real-time audit trail of all actions performed in the system.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Recent Activities</CardTitle>
            {safeGlobalPagination.totalPages > 1 && (
                <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={safeGlobalPagination.totalPages}
                    onChange={setPage}
                    size="sm"
                />
            )}
        </CardHeader>
        <Separator className="mb-4" />
        <CardContent>
          {loading ? (
            <div className="space-y-4">
               {[1, 2, 3, 4, 5].map((i) => (
                 <div key={i} className="flex gap-4 animate-pulse">
                   <div className="h-10 w-10 rounded-full bg-gray-200" />
                   <div className="flex-1 space-y-2">
                     <div className="h-4 w-1/3 bg-gray-200 rounded" />
                     <div className="h-3 w-1/4 bg-gray-200 rounded" />
                   </div>
                 </div>
               ))}
            </div>
          ) : globalTimeline.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No activities found.
            </div>
          ) : (
            <div className="relative pl-2">
              <div className="absolute left-[29px] top-4 bottom-4 w-0.5 bg-gray-100 z-0" />
              
              {globalTimeline.map((event, index) => (
                <div key={event.id} className="relative z-10 mb-2">
                   <TimelineItem 
                      event={event} 
                      isLast={index === globalTimeline.length - 1} 
                   />
                </div>
              ))}
            </div>
          )}
          
          {safeGlobalPagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
                 <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={safeGlobalPagination.totalPages}
                    onChange={setPage}
                />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

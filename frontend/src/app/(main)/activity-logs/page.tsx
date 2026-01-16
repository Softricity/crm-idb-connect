"use client";

import React, { useEffect } from "react";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { TimelineItem } from "@/components/dashboard-components/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PermissionGuard } from "@/components/PermissionGuard";
import { AdministrativePermission } from "@/lib/utils";

export default function ActivityLogsPage() {
  return (
    <PermissionGuard requiredPermissions={[AdministrativePermission.ACTIVITY_LOGS]}>
      <ActivityLogsPageContent />
    </PermissionGuard>
  );
}

function ActivityLogsPageContent() {
  const { globalTimeline, fetchGlobalTimeline, loading } = useTimelineStore();

  useEffect(() => {
    fetchGlobalTimeline();
  }, [fetchGlobalTimeline]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <Activity size={24} />
        </div>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
            <p className="text-gray-500 text-sm">Real-time audit trail of all actions performed in the system.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Activities</CardTitle>
        </CardHeader>
        <Separator className="mb-4" />
        <CardContent>
          {loading ? (
            <div className="space-y-4">
               {/* Simple loading skeleton */}
               {[1, 2, 3].map((i) => (
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
              {/* Vertical line connector for the whole list */}
              <div className="absolute left-[29px] top-4 bottom-4 w-0.5 bg-gray-100 z-0" />
              
              {globalTimeline.map((event, index) => (
                <div key={event.id} className="relative z-10 mb-2">
                   {/* We pass a modified event object if needed, or rely on TimelineItem */}
                   {/* Note: TimelineItem expects specific fields. 
                       Ensure your backend 'include: leads' works well with this. 
                       You might want to display the Lead Name in the text description if it's not clear.
                   */}
                   <TimelineItem 
                      event={event} 
                      isLast={index === globalTimeline.length - 1} 
                   />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
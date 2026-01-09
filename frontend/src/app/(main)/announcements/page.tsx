"use client";

import { useEffect } from "react";
import { useAnnouncementStore } from "@/stores/useAnnouncementStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Megaphone, Trash2 } from "lucide-react";
import { format } from "date-fns";
import CreateAnnouncementDialog from "@/components/announcement-components/CreateAnnouncementDialog";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";

export default function AnnouncementsPage() {
  const { announcements, fetchAnnouncements, loading, deleteAnnouncement } = useAnnouncementStore();
  const { user } = useAuthStore();
  
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'super admin';

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <Megaphone size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
            <p className="text-gray-500 text-sm">Updates, news, and important notices.</p>
          </div>
        </div>
        {isAdmin && <CreateAnnouncementDialog />}
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading updates...</p>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed">
            <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No Announcements</h3>
            <p className="text-gray-500">You are all caught up!</p>
          </div>
        ) : (
          announcements.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden transition-all hover:shadow-md border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {item.target_audience}
                      </Badge>
                    </div>
                    <CardDescription>
                      {/* Added safety check for created_at */}
                      Posted on {item.created_at ? format(new Date(item.created_at), "PPP 'at' p") : "Just now"}
                    </CardDescription>
                  </div>
                  
                  {isAdmin && item.id && ( // ✅ Check if item.id exists
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => item.id && deleteAnnouncement(item.id)} // ✅ Pass only if string
                    >
                        <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
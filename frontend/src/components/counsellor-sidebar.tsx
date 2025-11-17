"use client";

import React from "react";
import { LogOut, Plus } from "lucide-react";
import SidebarMenus from "./sidebar-menus";
import { counsellorMenus } from "@/config/menus";
import { NavUser } from "@/components/nav-user";
import LeadFormSheet from "./leads-components/createUpdateLead";
import { Button } from "@heroui/react";
import { usePartnerStore } from "@/stores/usePartnerStore";
import { useAuthStore } from "@/stores/useAuthStore";

export function CounsellorSidebar() {
  const [open, setOpen] = React.useState(true);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { user } = useAuthStore();

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex flex-col justify-between overflow-y-hidden border-r border-gray-300 h-screen 
        ${open ? "min-w-72" : "w-20"} transition-width duration-300`}
      >
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mt-4 mb-2 px-3">
            {open && (
              <div className="flex items-center">
                <img src="/logo.gif" alt="Logo" className="h-14" />
              </div>
            )}
            <button
              type="button"
              title="Toggle Sidebar"
              onClick={() => setOpen(!open)}
              className="min-w-14 min-h-14 flex justify-center items-center p-2 rounded-2xl hover:bg-gray-200 transition-colors"
            >
              <LogOut
                className={`rotate-${open ? "180" : "0"} transition-transform duration-300`}
              />
            </button>
          </div>
          <div className="px-3">
            {open && (
              <Button
                onClick={() => setIsSheetOpen(true)}
                variant="solid"
                color="secondary"
                className="mb-4 text-white w-full flex justify-start h-12 mt-5"
              >
                <Plus />
                Add New Lead
              </Button>
            )}
          </div>

          {/* Menus */}
          <SidebarMenus menus={counsellorMenus} open={open} />
        </div>

        {/* User Section at Bottom */}
        <div className="p-3 border-t border-gray-200">
          <NavUser
            user={{
              name: "Counsellor",
              email: user?.email ?? "",
              avatar: "https://swiftwebapp.sgp1.digitaloceanspaces.com/images/avatar.png",
            }}
          />
        </div>
      </div>
      <LeadFormSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  );
}

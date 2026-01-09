"use client";

import React, { useEffect, useRef } from "react"; // Added useEffect, useRef
import { Lock, LogOut, Plus, Settings, University } from "lucide-react";
import SidebarMenus from "./sidebar-menus";
import { menus } from "@/config/menus";
import { NavUser } from "@/components/nav-user";
import LeadFormSheet from "./leads-components/createUpdateLead";
import { Button } from "@heroui/react";
import { useAuthStore } from "@/stores/useAuthStore";
import Link from "next/link";
import { hasPermission, LeadPermission, PermissionPermission, UniversityPermission } from "@/lib/utils";
import { usePathname } from "next/navigation"; // Added usePathname

export default function Sidebar() {
  const [open, setOpen] = React.useState(true);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { user } = useAuthStore();
  
  // New Hooks for closing logic
  const pathname = usePathname();
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const settingsTriggerRef = useRef<HTMLSpanElement>(null);

  // 1. Close settings menu on Route Change
  useEffect(() => {
    setSettingsOpen(false);
  }, [pathname]);

  // 2. Close settings menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        settingsOpen &&
        settingsPanelRef.current &&
        !settingsPanelRef.current.contains(event.target as Node) &&
        settingsTriggerRef.current &&
        !settingsTriggerRef.current.contains(event.target as Node)
      ) {
        setSettingsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsOpen]);

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex flex-col justify-between overflow-y-hidden border-r border-gray-300 h-screen 
        ${open ? "w-60" : "w-20"} transition-width duration-300`}
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
                size={18}
                className={`rotate-${open ? "180" : "0"} transition-transform duration-300`}
              />
            </button>
          </div>
          <div className="px-3">
            {open && hasPermission(user?.permissions ?? [], LeadPermission.LEAD_CREATE) && (
              <Button onClick={() => setIsSheetOpen(true)} variant="solid" color="secondary" className="mb-4 text-white w-full flex justify-start h-12 mt-5">
                <Plus />
                Add New Lead
              </Button>
            )}
          </div>

          {/* Menus */}
          <div className="h-[72vh] overflow-y-auto px-3 flex flex-col gap-2">
            <SidebarMenus menus={menus} open={open} />
            
            {/* Settings Trigger with Ref */}
            <span
              ref={settingsTriggerRef} // Attached Ref
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`flex items-center gap-4 px-3 text-sm py-3 hover:bg-gray-200 rounded-xl text-black transition-colors cursor-pointer 
                ${!open && "justify-center"} `}
            >
              <Settings size={20} />
              {open && <span>Settings</span>}
            </span>
          </div>
        </div>

        {/* User Section at Bottom */}
        <div className="py-3 border-t border-gray-200">
          <NavUser user={{ name: "Admin", email: user?.email ?? "", avatar: "https://swiftwebapp.sgp1.digitaloceanspaces.com/images/avatar.png" }} />
        </div>
      </div>

      {/* Settings Panel with Ref */}
      <div 
        ref={settingsPanelRef} // Attached Ref
        className={"w-60 p-3 border-r border-gray-300 h-screen absolute left-60 z-50 bg-white " + (settingsOpen ? "block" : "hidden")}
      >
        {hasPermission(user?.permissions ?? [], UniversityPermission.UNIVERSITY_CREATE) && (
          <Link href="/universities" className="flex items-center gap-4 px-3 text-sm py-3 hover:bg-gray-200 rounded-xl text-black transition-colors">
            <University size={20} />
            <span>Universities</span>
          </Link>
        )}
        {hasPermission(user?.permissions ?? [], PermissionPermission.ROLES_CREATE) && (
          <Link href="/roles-permissions" className="flex items-center gap-4 px-3 text-sm py-3 hover:bg-gray-200 rounded-xl text-black transition-colors">
            <Lock size={20} />
            <span>Roles & Permission</span>
          </Link>
        )}
      </div>
      <LeadFormSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  );
}
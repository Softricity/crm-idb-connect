"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@heroui/react";
import SidebarMenus from "./sidebar-menus";
import { MenuItem } from "@/config/menus";
import BranchSelector from "./BranchSelector";

export default function Navbar({ menus }: { menus: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 gap-4">
      {/* Logo */}
      <div className="flex items-center shrink-0">
        <img src="/logo.gif" alt="Logo" className="w-30 rounded-xl" />
      </div>

      {/* Branch Selector - Hidden on small screens */}
      <div className="hidden lg:block flex-1 max-w-xs">
        <BranchSelector
          value={selectedBranch}
          onChange={setSelectedBranch}
          label=""
          placeholder="Select branch"
          className="w-full"
        />
      </div>

      {/* Hamburger button */}
      <button
        title="Open Menu"
        type="button"
        onClick={handleOpen}
        className="p-2 rounded-lg hover:bg-gray-100 shrink-0"
      >
        <Menu size={26} />
      </button>

      {/* Mobile Drawer */}
      <Drawer isOpen={open} onOpenChange={setOpen} placement="left" size="xs">
        <DrawerContent className="rounded-r-3xl">
          {(onClose) => (
            <>
              <DrawerHeader className="p-4 border-b border-gray-200 flex items-center justify-start gap-3">
                <img src="/logo.gif" alt="Logo" className="w-30 rounded-xl" />
              </DrawerHeader>

              <DrawerBody className="p-0">
                {/* Branch Selector for mobile */}
                <div className="p-4 border-b border-gray-200">
                  <BranchSelector
                    value={selectedBranch}
                    onChange={setSelectedBranch}
                    label="Branch"
                    placeholder="Select branch"
                  />
                </div>

                {/* Reuse SidebarMenus */}
                <SidebarMenus menus={menus} open={true} />
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

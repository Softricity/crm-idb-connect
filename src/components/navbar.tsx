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

export default function Navbar({ menus }: { menus: MenuItem[] }) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      {/* Logo */}
      <div className="flex items-center">
        <img src="logo.jpg" alt="Logo" className="w-10 rounded-xl" />
        <span className="ml-2 font-bold text-lg">Softricity</span>
      </div>

      {/* Hamburger button */}
      <button
        title="Open Menu"
        type="button"
        onClick={handleOpen}
        className="p-2 rounded-lg hover:bg-gray-100"
      >
        <Menu size={26} />
      </button>

      {/* Mobile Drawer */}
      <Drawer isOpen={open} onOpenChange={setOpen} placement="left" size="xs">
        <DrawerContent className="rounded-r-3xl">
          {(onClose) => (
            <>
              <DrawerHeader className="p-4 border-b border-gray-200 flex items-center justify-start gap-3">
                <img src="logo.jpg" alt="Logo" className="w-10 rounded-xl" />
                <span className="text-xl font-bold">Softricity</span>
              </DrawerHeader>

              <DrawerBody className="p-0">
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

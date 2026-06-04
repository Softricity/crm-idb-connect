"use client";

import { Tooltip } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuItem } from "@/config/menus";
import useUserPermissions from '@/hooks/usePermissions';
import { hasAnyPermission } from '@/lib/utils';
import { useAuthStore } from "@/stores/useAuthStore";

export default function SidebarMenus({
  menus,
  open,
}: {
  menus: MenuItem[];
  open: boolean;
}) {
  const currentMenu = usePathname();

  const userPermissions = useUserPermissions();
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col gap-2">
      {menus.map((menu, index) => {
        // If menu has requiredPermissions, hide it when user lacks them
        if (menu.requiredPermissions && menu.requiredPermissions.length > 0) {
          if (!hasAnyPermission(userPermissions, menu.requiredPermissions)) {
            return null;
          }
        }

        // If menu has requiredRoles, hide it when user lacks them
        if (menu.requiredRoles && menu.requiredRoles.length > 0) {
          const userRole = user?.role?.toLowerCase() || "";
          if (!menu.requiredRoles.some((r) => r.toLowerCase() === userRole)) {
            return null;
          }
        }

        return menu.type === "link" ? (
          <Tooltip
            key={index}
            content={menu.title}
            placement="right"
            color="secondary"
            isDisabled={open} // ✅ Only show tooltip when collapsed
            className="text-white text-sm"
          >
            <Link
              href={menu.link ?? ""}
              className={`flex items-center gap-4 px-3 text-sm py-3 rounded-xl text-black transition-colors 
                ${!open && "justify-center"} 
                ${
                  currentMenu === menu.link
                    ? "bg-secondary text-white"
                    : "hover:bg-gray-200"
                }`}
            >
              {menu.icon}
              {open && <span>{menu.title}</span>}
            </Link>
          </Tooltip>
        ) : (
          <div key={index} className="flex items-center">
            <span
              className={`text-gray-400 text-sm font-bold ml-1 ${
                !open && "hidden"
              }`}
            >
              {menu.title}
            </span>
            <hr className="flex-1 border-dotted border-t-4 mx-2 mb-2 mt-3 border-gray-300" />
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { Tooltip } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuItem } from "@/config/menus";

export default function SidebarMenus({
  menus,
  open,
}: {
  menus: MenuItem[];
  open: boolean;
}) {
  const currentMenu = usePathname();

  return (
    <div className="flex flex-col gap-2 px-3 h-[76vh] overflow-y-auto">
      {menus.map((menu, index) =>
        menu.type === "link" ? (
          <Tooltip
            key={index}
            content={menu.title}
            placement="right"
            color="secondary"
            isDisabled={open} // ✅ Only show tooltip when collapsed
            className="text-white"
          >
            <Link
              href={menu.link ?? ""}
              className={`flex items-center gap-4 px-3 py-3 rounded-xl text-black transition-colors 
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
        )
      )}
    </div>
  );
}

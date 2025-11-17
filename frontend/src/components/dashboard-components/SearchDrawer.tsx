"use client";

import { Drawer, DrawerContent } from "@heroui/react";
import { SearchIcon } from "lucide-react";
import { useState } from "react";

export default function SearchDrawer({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const [exactMatch, setExactMatch] = useState(false);

  const filters = [
    "Lead",
    "Counselling",
    "Admission Application",
    "Visa",
    "Document",
  ];

  return (
    <Drawer isOpen={open} onClose={onClose} placement="left" size="xl">
      <DrawerContent className="p-6">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Global Search</h2>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex items-center gap-2 flex-1 px-4 py-3 border border-blue-400 rounded-xl text-gray-600 bg-white">
            <SearchIcon className="h-5 w-5" />
            <input
              type="text"
              placeholder="Type... & Then Enter to Search"
              className="w-full outline-none text-sm"
            />
          </div>

          <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium">
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-5">
          {filters.map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-blue-500" />
              {item}
            </label>
          ))}
        </div>

      </DrawerContent>
    </Drawer>
  );
}

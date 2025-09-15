import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TopCounsellingHeader() {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center  gap-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Counsellings</h1>
      </div>
      <div className="relative shadow rounded ">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search Leads" className="pl-9" />
      </div>
    </header>
  );
}

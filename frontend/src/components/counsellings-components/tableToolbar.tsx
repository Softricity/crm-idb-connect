import {
  Star,
  Filter,
  ChevronsUpDown,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ColumnVisibilitySelector, { ColumnConfig } from "../leads-components/columnVisibilitySelector";

interface CounsellingTableToolbarProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export default function CounsellingTableToolbar({ columns, onColumnsChange }: CounsellingTableToolbarProps) {
  return (
    <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3 ">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm">
          <Star className="h-4 w-4 mr-2" /> Starred
        </Button>
        <Button variant="secondary" size="sm">
          <Filter className="h-4 w-4 mr-2" /> Apply Filters
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <ColumnVisibilitySelector
          columns={columns}
          onColumnsChange={onColumnsChange}
          storageKey="counsellings_column_visibility"
        />
        <Button variant="ghost" size="sm">
          Sort By: Created At <ChevronsUpDown className="h-4 w-4 ml-2" />
        </Button>
        <Button variant="ghost" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

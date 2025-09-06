"use client"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { FilterX, Search } from "lucide-react"
import { useState } from "react"
import { filterData } from "@/lib/mockdata"

// Data can be fetched from an API


export default function ModernFilterSidebar() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Card className="w-full md:w-72 lg:w-80 sticky top-4 max-h-[81vh] overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between border-b p-4">
        <CardTitle className="text-lg">Filters</CardTitle>
        <Button variant="ghost" size="sm">
          <FilterX className="w-4 h-4 mr-1" />
          Clear All
        </Button>
      </CardHeader>
      
      <CardContent className="p-2">
        <Accordion type="multiple" defaultValue={["countries", "levels"]}>
          {filterData.map((filter) => (
            <AccordionItem value={filter.id} key={filter.id}>
              <AccordionTrigger className="px-2 hover:no-underline">
                {filter.name}
              </AccordionTrigger>
              <AccordionContent className="p-1">
                {/* Add search bar for longer lists */}
                {filter.options.length > 5 && (
                  <div className="relative mx-2 mb-2">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder={`Search ${filter.name}...`} 
                      className="pl-8"
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto px-2">
                  {filter.options
                    .filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                         <Checkbox id={`${filter.id}-${option}`} />
                         <Label 
                            htmlFor={`${filter.id}-${option}`}
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                         >
                           {option}
                         </Label>
                      </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
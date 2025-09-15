import CourseCard from "@/components/courses-components/courseCards"
import FilterSidebar from "@/components/courses-components/filterSidebar"
import LeadsTableToolbar from "@/components/leads-components/leadsTableToolbar";
import TabsWrapper from "@/components/leads-components/tabsWrapper";
import { leadsData } from "@/lib/mockdata";



export default function Page() {
    return (
        <>
            <TabsWrapper leads={leadsData} />
        </>
    )
}
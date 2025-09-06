import CourseCard from "@/components/courses-components/courseCards"
import FilterSidebar from "@/components/courses-components/filterSidebar"
import { courses } from "@/lib/mockdata"



export default function Page() {
    return (
        <>
            <div className="flex flex-col md:flex-row gap-6 bg-background">
                <div className="">
                    <FilterSidebar />
                </div>
                <main className="flex-1 space-y-4">
                    <div className="text-sm text-muted-foreground">
                        We have found {courses.length} courses | No course(s) selected
                    </div>
                    <div className="space-y-4  max-h-[77vh] overflow-y-auto">
                        {courses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                </main>
            </div>
        </>
    )
}
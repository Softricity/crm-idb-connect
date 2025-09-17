"use client";

import { useState } from "react";
import { useLeadStore, Lead } from "@/stores/useLeadStore";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

const initialState: Omit<Lead, "id" | "createdat" | "updatedat"> = {
  name: "",
  mobile: "",
  email: "",
  qualifications: "",
  address: "",
  doneexam: false,
  examscores: {},
  preferredcountry: "",
  status: "new",
  type: "student",
  utmsource: "walkin",
  utmmedium: "",
  utmcampaign: "",
  assignedto: null,
};



const counselors = [
  { id: "user_1", name: "Anjali Sharma" },
  { id: "user_2", name: "Rohan Verma" },
  { id: "user_3", name: "Priya Singh" },
  { id: "user_unassigned", name: "Unassigned" },
];

export function CreateLeadSheet() {
  const addLead = useLeadStore((state) => state.addLead);
  const [formData, setFormData] = useState(initialState);
  const [examScores, setExamScores] = useState({ ielts: "", pte: "", toefl: "" });
  const [otherExams, setOtherExams] = useState<{ name: string; result: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false); // ⬅️ loader state

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };


  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExamScores((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleOtherExamChange = (index: number, field: "name" | "result", value: string) => {
    setOtherExams((prev) =>
      prev.map((exam, i) => (i === index ? { ...exam, [field]: value } : exam))
    );
  };

  const addOtherExam = () => {
    setOtherExams((prev) => [...prev, { name: "", result: "" }]);
  };

  const removeOtherExam = (index: number) => {
    setOtherExams((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true); // start loader
    try {
      const scores = formData.doneexam
        ? {
            ...examScores,
            ...Object.fromEntries(otherExams.map((e) => [e.name, e.result])),
          }
        : {};

      const leadToSubmit = { ...formData, examscores: scores };

      await addLead(leadToSubmit);

      toast.success("Lead created successfully!", {
        description: `${formData.name} has been added.`,
      });

      setFormData(initialState);
      setExamScores({ ielts: "", pte: "", toefl: "" });
      setOtherExams([]);
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to create lead", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false); // stop loader
    }
  };


  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="shadow-sm flex items-center gap-3"><Plus /> Add New Lead</Button>
      </SheetTrigger>

      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="text-xl font-semibold">Create a New Lead</SheetTitle>
          <SheetDescription>
            Enter the details below to add a new lead.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto px-6 py-6 space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded-lg">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input id="mobile" name="mobile" type="text" value={formData.mobile} onChange={handleChange} />
              </div>
              <div className="sm:col-span-2 grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="text" value={formData.email} onChange={handleChange} />
              </div>
              <div className="sm:col-span-2 grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" value={formData.address} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Academic Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded-lg">
              <div className="grid gap-2">
                <Label htmlFor="qualifications">Highest Qualifications</Label>
                <Input id="qualifications" name="qualifications" type="text" value={formData.qualifications} onChange={handleChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preferredcountry">Preferred Country</Label>
                <Input id="preferredcountry" name="preferredcountry" type="text" value={formData.preferredcountry} onChange={handleChange} />
              </div>
              <div className="sm:col-span-2 flex items-center space-x-2 pt-2">
                <Switch
                  id="doneexam"
                  checked={formData.doneexam}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, doneexam: checked }))}
                />
                <Label htmlFor="doneexam">Completed Proficiency Exams?</Label>
              </div>

              {formData.doneexam && (
                <>
                  {/* Default exams */}
                  <div className="grid gap-2">
                    <Label htmlFor="ielts">IELTS Score</Label>
                    <Input id="ielts" name="ielts" type="text" value={examScores.ielts} onChange={handleScoreChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pte">PTE Score</Label>
                    <Input id="pte" name="pte" type="text" value={examScores.pte} onChange={handleScoreChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="toefl">TOEFL Score</Label>
                    <Input id="toefl" name="toefl" type="text" value={examScores.toefl} onChange={handleScoreChange} />
                  </div>

                  {/* Other Exams */}
                  <div className="sm:col-span-2 space-y-3 mt-4">
                    <Label>Other Exams</Label>
                    {otherExams.map((exam, index) => (
                      <div key={index} className="grid grid-cols-2 gap-3 items-center my-2 ">
                        <Input
                          type="text"
                          placeholder="Exam Name"
                          value={exam.name}
                          onChange={(e) => handleOtherExamChange(index, "name", e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Result"
                            value={exam.result}
                            onChange={(e) => handleOtherExamChange(index, "result", e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeOtherExam(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addOtherExam}>
                      + Add Other Exam
                    </Button>
                  </div>
                </>
              )}

            </div>
          </div>

          {/* <div className="space-y-4">
            <h3 className="text-lg font-semibold">Lead Management</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded-lg">
              <div className="grid gap-2">
                <Label htmlFor="assignedto">Assigned To</Label>
                <Select
                  name="assignedto"
                  onValueChange={(value) => handleSelectChange("assignedto", value)}
                  value={formData.assignedto ?? "user_unassigned"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a counselor" />
                  </SelectTrigger>
                  <SelectContent>
                    {counselors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="leadsource">Lead Source</Label>
                <Input
                  id="leadsource"
                  name="leadsource"
                  type="text"
                  value={formData.utmsource ?? ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div> */}
        </div>

        <SheetFooter className="p-6 border-t bg-background mt-auto">
          <div className="flex w-full items-center gap-3">
            <SheetClose asChild>
              <Button variant="outline" disabled={loading}>
                Cancel
              </Button>
            </SheetClose>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "Creating..." : "Create Lead"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

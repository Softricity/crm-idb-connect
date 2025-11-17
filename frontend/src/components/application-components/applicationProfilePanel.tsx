"use client";

import React, {useState} from "react";
import {Button, Chip, Divider} from "@heroui/react";
import SectionCard from "./sectionCard";
import FieldGrid from "./fieldGrid";
import FieldRow from "./fieldRow";
import GroupEditDialog from "./groupEditDialog";
import useAppDataAdapter from "./useAppDataAdapter";

function joinPhone(a?: string, b?: string) {
  if (a && b) return `${a} • ${b}`;
  return a || b || "";
}

export default function ApplicantProfilePanel() {
  const {data, save} = useAppDataAdapter();

  const [groupEditor, setGroupEditor] = useState<{
    title: string;
    base: any;
    fields: {
      label: string;
      path: string[];
      kind?: "text" | "textarea" | "select" | "email" | "number" | "tel" | "date";
      options?: { label: string; value: string }[];
    }[];
  } | null>(null);

  const openGroupEdit = (title: string, base: any, fields: any[]) => setGroupEditor({title, base, fields});
  const closeGroupEdit = () => setGroupEditor(null);
  const commitGroup = (patches: {path: string[]; value: string}[]) => {
    for (const p of patches) save(p.path, p.value);
    setGroupEditor(null);
  };

  const p = data?.personal ?? {};
  const e = data?.education ?? {};
  const lang = e?.language ?? {};
  const ielts = lang?.ielts ?? {};
  const fam = data?.family ?? {};

  return (
    <div className="flex flex-col gap-6 mt-5">
      {/* PERSONAL DETAILS */}
      <SectionCard
        title="Personal Details"
        actions={
          <Button size="sm" onPress={() =>
            openGroupEdit("Edit Personal Details", p, [
              {label:"Serial Number", path:["personal","serialNumber"]},
              {label:"Lead Source", path:["personal","leadSource"]},
              {label:"Given Name", path:["personal","givenName"]},
              {label:"Surname", path:["personal","surname"]},
              {label:"Email", path:["personal","email"], kind:"email"},
              {label:"Phone", path:["personal","phone"], kind:"tel"},
              {label:"Alt Phone", path:["personal","altPhone"], kind:"tel"},
              {label:"Date of Birth", path:["personal","dob"], kind:"date"},
              {label:"Gender", path:["personal","gender"], kind:"select", options:[
                {label:"Female", value:"Female"},
                {label:"Male", value:"Male"},
                {label:"Other", value:"Other"},
              ]},
              {label:"Marital Status", path:["personal","maritalStatus"]},
              {label:"Visa Type", path:["personal","visaType"]},
              {label:"Estimated Budget", path:["personal","estimatedBudget"]},
              {label:"Referral", path:["personal","referral"]},
              {label:"Address", path:["personal","address"], kind:"textarea"},
              {label:"City", path:["personal","city"]},
              {label:"State", path:["personal","state"]},
              {label:"Country", path:["personal","country"]},
            ])
          }>
            Edit Section
          </Button>
        }
      >
        <FieldGrid>
          <FieldRow label="Serial Number" value={p.serialNumber} />
          <FieldRow label="Lead Source" value={p.leadSource} />
          <FieldRow label="Given Name" value={p.givenName} />
          <FieldRow label="Surname" value={p.surname} />
          <FieldRow label="Email" value={p.email} />
          <FieldRow label="Phone" value={joinPhone(p.phone, p.altPhone)} />
          <FieldRow label="Date of Birth" value={p.dob} />
          <FieldRow label="Gender" value={p.gender} />
          <FieldRow label="Marital Status" value={p.maritalStatus} />
          <FieldRow label="Visa Type" value={p.visaType} />
          <FieldRow label="Estimated Budget" value={p.estimatedBudget} />
          <FieldRow label="Referral" value={p.referral} />
          <FieldRow label="Address" value={p.address} />
          <FieldRow label="City" value={p.city} />
          <FieldRow label="State" value={p.state} />
          <FieldRow label="Country" value={p.country} />
        </FieldGrid>
      </SectionCard>

      {/* EDUCATION DETAILS */}
      <SectionCard
        title="Education Details"
        actions={
          <Button size="sm" onPress={() =>
            openGroupEdit("Edit Education Details", e, [
              {label:"Tenth School Name", path:["education","tenth","schoolName"]},
              {label:"Tenth Year", path:["education","tenth","year"]},
              {label:"Tenth Board", path:["education","tenth","board"]},
              {label:"Tenth Percentage/CGPA", path:["education","tenth","percentage"]},
              {label:"Twelfth School Name", path:["education","twelfth","schoolName"]},
              {label:"Twelfth Year", path:["education","twelfth","year"]},
              {label:"Twelfth Board", path:["education","twelfth","board"]},
              {label:"Twelfth Stream", path:["education","twelfth","stream"]},
              {label:"Twelfth Percentage/CGPA", path:["education","twelfth","percentage"]},
              {label:"Bachelor College", path:["education","bachelor1","college"]},
              {label:"Bachelor Course", path:["education","bachelor1","course"]},
              {label:"Bachelor CGPA", path:["education","bachelor1","percentage"]},
              {label:"Duration", path:["education","bachelor1","duration"]},
              {label:"Result Date", path:["education","bachelor1","resultDate"], kind:"date"},
              {label:"Medium", path:["education","bachelor1","medium"]},
            ])
          }>
            Edit Section
          </Button>
        }
      >
        <FieldGrid>
          <FieldRow label="Tenth School Name" value={e?.tenth?.schoolName} />
          <FieldRow label="Tenth Year" value={e?.tenth?.year} />
          <FieldRow label="Tenth Board" value={e?.tenth?.board} />
          <FieldRow label="Tenth Percentage/CGPA" value={e?.tenth?.percentage} />
          <FieldRow label="Twelfth School Name" value={e?.twelfth?.schoolName} />
          <FieldRow label="Twelfth Year" value={e?.twelfth?.year} />
          <FieldRow label="Twelfth Board" value={e?.twelfth?.board} />
          <FieldRow label="Twelfth Stream" value={e?.twelfth?.stream} />
          <FieldRow label="Twelfth Percentage/CGPA" value={e?.twelfth?.percentage} />
          <FieldRow label="Bachelor College" value={e?.bachelor1?.college} />
          <FieldRow label="Bachelor Course" value={e?.bachelor1?.course} />
          <FieldRow label="Bachelor CGPA" value={e?.bachelor1?.percentage} />
          <FieldRow label="Duration" value={e?.bachelor1?.duration} />
          <FieldRow label="Result Date" value={e?.bachelor1?.resultDate} />
          <FieldRow label="Medium" value={e?.bachelor1?.medium} />
        </FieldGrid>
      </SectionCard>

      <SectionCard
        title="Family Details"
        actions={
          <Button size="sm" onPress={() =>
            openGroupEdit("Edit Family Details", fam, [
              {label:"Father Name", path:["family","fatherName"]},
              {label:"Father Phone", path:["family","fatherPhone"], kind:"tel"},
              {label:"Father Email", path:["family","fatherEmail"], kind:"email"},
              {label:"Mother Name", path:["family","motherName"]},
              {label:"Mother Phone", path:["family","motherPhone"], kind:"tel"},
              {label:"Mother Email", path:["family","motherEmail"], kind:"email"},
              {label:"Guardian Name", path:["family","guardianName"]},
              {label:"Guardian Phone", path:["family","guardianPhone"], kind:"tel"},
              {label:"Notes", path:["family","notes"], kind:"textarea"},
            ])
          }>
            Edit Section
          </Button>
        }
      >
        <FieldGrid>
          <FieldRow label="Father Name" value={fam?.fatherName} />
          <FieldRow label="Father Phone" value={fam?.fatherPhone} />
          <FieldRow label="Father Email" value={fam?.fatherEmail} />
          <FieldRow label="Mother Name" value={fam?.motherName} />
          <FieldRow label="Mother Phone" value={fam?.motherPhone} />
          <FieldRow label="Mother Email" value={fam?.motherEmail} />
          <FieldRow label="Guardian Name" value={fam?.guardianName} />
          <FieldRow label="Guardian Phone" value={fam?.guardianPhone} />
          <FieldRow label="Notes" value={fam?.notes} />
        </FieldGrid>
      </SectionCard>

      {/* Dialog for group edits */}
      <GroupEditDialog
        open={!!groupEditor}
        title={groupEditor?.title ?? ""}
        baseObject={groupEditor?.base ?? {}}
        fields={groupEditor?.fields ?? []}
        onClose={closeGroupEdit}
        onSave={commitGroup}
      />
    </div>
  );
}

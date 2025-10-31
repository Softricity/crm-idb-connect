import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface LeadData {
  name: string;
  mobile: string;
  email: string;
  type: string;
  city: string;
  purpose: string;
  status: string;
  created_by: string;
  alternate_mobile?: string | null;
  preferred_country?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  assigned_to?: string | null;
  reason?: string | null;
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
  try {
    const leadData: LeadData = await req.json();

    // **Basic Validation**
    if (!leadData.name || !leadData.mobile || !leadData.email || !leadData.created_by) {
      return NextResponse.json(
        { error: "Missing required fields: name, mobile, email, and created_by are required." },
        { status: 400 }
      );
    }

    // **Check for duplicate email or mobile**
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, email, mobile")
      .or(`email.eq.${leadData.email},mobile.eq.${leadData.mobile}`)
      .maybeSingle();

    if (existingLead) {
      return NextResponse.json(
        { 
          error: "Your details already exist in our system. Our team will contact you soon.",
          duplicate: true 
        },
        { status: 409 }
      );
    }

    // **Sanitize Data**: Convert empty strings to null
    const sanitizedLead = Object.fromEntries(
      Object.entries(leadData).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ])
    );

    // **Insert into Supabase**
    const { data, error } = await supabase
      .from("leads")
      .insert([sanitizedLead])
      .select()
      .single();

    if (error) {
      console.error("Supabase Insert Error:", error.message);
      return NextResponse.json({ error: "Failed to create lead." }, { status: 500 });
    }

    // **Success**
    return NextResponse.json(data, { status: 201 });

  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }
    console.error("Unexpected API Error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
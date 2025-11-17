// src/app/api/internal/create-lead/route.ts
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail, generateRandomPassword } from "@/lib/emailService";
import { Lead } from "@/stores/useLeadStore"; // Use your Lead type

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // --- 1. Check for authenticated partner (admin/agent) ---
  const partnerSession = (await cookieStore).get("partner-session");
  if (!partnerSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // --- 2. Get Lead Data (same as public route) ---
    const leadData: Omit<Lead, "id" | "created_at"> = await req.json();

    // ... (Add validation and duplicate checks here, same as public route)

    // --- 3. Generate password ---
    const newPassword = generateRandomPassword();

    const sanitizedLead = Object.fromEntries(
      Object.entries(leadData).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ])
    );
    sanitizedLead.password = newPassword; // Add the password

    // --- 4. Insert into Supabase ---
    const { data, error } = await supabase
      .from("leads")
      .insert([sanitizedLead])
      .select()
      .single();

    if (error) {
      console.error("Supabase Insert Error (Internal):", error.message);
      return NextResponse.json({ error: "Failed to create lead." }, { status: 500 });
    }

    // --- 5. Send Welcome Email ---
    try {
      await sendWelcomeEmail(leadData.email, newPassword);
    } catch (emailError) {
      console.error(`Successfully created lead ${data.id} but failed to send email.`, emailError);
    }

    // **Success**
    return NextResponse.json(data, { status: 201 });

  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }
    console.error("Unexpected API Error (Internal):", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
"use client";

import { useEffect } from "react";
import { usePartnerStore } from "@/stores/usePartnerStore";

export default function NotesTest() {
  const { loading, partners, fetchPartners } = usePartnerStore();

  useEffect(() => {
    fetchPartners(); // call only once on mount
  }, [fetchPartners]);

  return (
    <div className="p-4">
      {loading && <p>Loading...</p>}

      {!loading && partners.length === 0 && <p>No partners found.</p>}

      {!loading &&
        partners.map((partner) => (
          <div key={partner.id} className="border-b border-gray-300 mb-3 pb-2">
            {Object.entries(partner).map(([key, value]) => (
              <li key={key} className="text-gray-700">
                <strong>{key}:</strong> {String(value)}
              </li>
            ))}
          </div>
        ))}
    </div>
  );
}

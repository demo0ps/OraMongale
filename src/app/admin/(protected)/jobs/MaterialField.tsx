"use client";

import { useState } from "react";

interface Props {
  minerals: { id: string; name: string }[];
}

export default function MaterialField({ minerals }: Props) {
  const [custom, setCustom] = useState(false);
  return (
    <div>
      <label className="label">Material</label>
      <select
        className="field"
        defaultValue=""
        name={custom ? "" : "material"}
        onChange={(e) => setCustom(e.currentTarget.value === "__custom__")}
      >
        <option value="">— select or type —</option>
        {minerals.map((m) => (
          <option key={m.id} value={m.name}>{m.name}</option>
        ))}
        <option value="__custom__">+ Other (type custom name)</option>
      </select>
      {custom && (
        <input
          name="material"
          type="text"
          required
          autoFocus
          placeholder="Type custom mineral..."
          className="field mt-2"
        />
      )}
    </div>
  );
}

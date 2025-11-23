# Branch Selector Component

## Overview
The `BranchSelector` component provides a branch selection dropdown that automatically adapts based on user permissions:

- **Super Admin**: Can select from all available branches
- **Regular Users**: Selector is disabled and shows their assigned branch

## Installation

The component is already created at `/components/BranchSelector.tsx`

## Usage

### Basic Usage

```tsx
import BranchSelector from "@/components/BranchSelector";

function MyForm() {
  const [selectedBranch, setSelectedBranch] = useState("");

  return (
    <BranchSelector
      value={selectedBranch}
      onChange={setSelectedBranch}
      label="Select Branch"
      placeholder="Choose a branch"
    />
  );
}
```

### In Lead Creation Form

```tsx
import BranchSelector from "@/components/BranchSelector";

// Inside your form component
const [formData, setFormData] = useState({
  name: "",
  email: "",
  // ... other fields
  branch_id: user?.branch_id || "",
});

<BranchSelector
  value={formData.branch_id}
  onChange={(branchId) => setFormData(prev => ({ ...prev, branch_id: branchId }))}
/>
```

### In Partner/User Creation Form

```tsx
<BranchSelector
  value={partnerData.branch_id}
  onChange={(branchId) => {
    setPartnerData(prev => ({ ...prev, branch_id: branchId }));
  }}
  label="Assign to Branch"
  placeholder="Select branch assignment"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `undefined` | The currently selected branch ID |
| `onChange` | `(branchId: string) => void` | `undefined` | Callback when selection changes |
| `className` | `string` | `""` | Additional CSS classes |
| `label` | `string` | `"Branch"` | Label for the select component |
| `placeholder` | `string` | `"Select branch"` | Placeholder text |

## Behavior

### Super Admin
- Determined by `isSuperAdmin()` utility function
- Has 3+ high-level permissions (LEAD_MANAGE, APPLICATION_MANAGE, etc.)
- Can select any branch from the dropdown
- Dropdown is enabled and fully interactive

### Regular User
- Belongs to a single branch (`user.branch_id`)
- Dropdown is **disabled**
- Shows description: "You are assigned to {branch_name}"
- Selection is locked to their assigned branch

## Store Integration

The component uses two stores:

1. **useAuthStore** - Gets current user and their permissions
2. **useBranchStore** - Manages branch data and selected branch

```tsx
const { user } = useAuthStore();
const { branches, fetchBranches, setSelectedBranch } = useBranchStore();
```

## Backend Integration

The component fetches branches from:
```
GET /branches
```

According to API_DOC.md, this endpoint:
- Requires JWT authentication
- Returns all branches with hierarchy
- Super admins can see all branches
- Regular users see their branch context

## Styling

Uses HeroUI components:
- `<Select>` with `variant="bordered"`
- Shows branch name, code, and type
- Auto-disables when user is not super admin

## Example: Complete Form Integration

```tsx
"use client";

import { useState } from "react";
import BranchSelector from "@/components/BranchSelector";
import { Button } from "@heroui/react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function CreatePartnerForm() {
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role_id: "",
    branch_id: user?.branch_id || "", // Default to user's branch
  });

  const handleSubmit = async () => {
    // Submit with branch_id
    const payload = {
      ...formData,
      // branch_id is included
    };
    // API call...
  };

  return (
    <form>
      <BranchSelector
        value={formData.branch_id}
        onChange={(branchId) => 
          setFormData(prev => ({ ...prev, branch_id: branchId }))
        }
        label="Assign to Branch"
      />
      
      <Button onClick={handleSubmit}>Create Partner</Button>
    </form>
  );
}
```

## Notes

- Component automatically fetches branches on mount
- Selected branch is stored in `useBranchStore` for global access
- User's branch info comes from JWT payload (branch_id, branch_name, branch_type)
- Branch scoping is handled automatically by backend based on user's permissions

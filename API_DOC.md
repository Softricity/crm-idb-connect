Looking at your documentation, I can see the **Agents API**, **Leads API updates**, and **Commissions API** sections are already present in the document. However, they need consolidation and clarification based on your new specifications.

Here's the rewritten content for these sections with the hybrid ownership model integrated:

---

## 🕵️ Agents API

Handles external B2B partners (Agents), their onboarding, document verification, and regional assignment.

### 1. Onboard New Agent (Public)

-   **Route:** `POST /agents/onboard`
-   **Authentication:** **None (Public)**
-   **Description:** Allows external users (agents) to register themselves in the system. Now supports linking to a specific branch.
-   **Request Body:**
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@agency.com",
      "mobile": "+919876543210",
      "password": "securePassword123",
      "agency_name": "Global Education Consultants",
      "website": "https://globaledu.com",           // Optional
      "region": "South Asia",
      "country": "India",
      "state": "Delhi",
      "city": "New Delhi",
      "address": "123 Business Park, Andheri East",
      "branch_id": "uuid-of-branch",               // New Field: Optional branch assignment
      "business_reg_no": "GSTIN123456789"          // Optional
    }
    ```
-   **Returns:** 
    ```json
    {
      "id": "uuid-string",
      "name": "John Doe",
      "email": "john.doe@agency.com",
      "status": "PENDING",
      "created_at": "2023-10-27T10:00:00.000Z"
    }
    ```
-   **Errors:**
    -   `400 Bad Request`: Validation failed (missing required fields).
    -   `409 Conflict`: Agent with this email or mobile already exists.

### 2. Get All Agents
-   **Route:** `GET /agents`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Query Params:** `?status=PENDING` (Filter by status: PENDING, APPROVED, REJECTED)
-   **Returns:** Array of agent objects with documents list.

### 3. Get Agent Details
-   **Route:** `GET /agents/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Returns:** Full agent profile including nested documents array.

### 4. Update Agent Status
-   **Route:** `PATCH /agents/:id/status`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:**
    ```json
    {
      "status": "APPROVED",  // or "REJECTED"
      "reason": "Documents verified successfully."  // Optional
    }
    ```
-   **Returns:** Updated agent object.

### 5. Delete Agent
-   **Route:** `DELETE /agents/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Description:** Permanently removes agent and associated documents.

---

## 👨‍💼 Leads API

This module handles lead creation, management, and bulk operations. Updated to support the **Hybrid Ownership Model** (Internal Partners vs. External Agents).

### Create a New Lead (Public/Internal - Unified)

-   **Route:** `POST /leads`
-   **Authentication:** **None (Public)** or **JWT (Internal)**
-   **Description:** Creates a new lead. Smart endpoint that assigns ownership based on who is creating the lead.
    - **If Public:** No ownership assigned, `created_by` remains null.
    - **If Agent logs in:** Saves Agent ID to `agent_id`.
    - **If Partner logs in:** Saves Partner ID to `created_by`.
    - **Duplicate Check:** Validates that `email` and `mobile` do not already exist.
    - **Password Generation:** Generates a random **plaintext** password.
    - **Security:** Hashes the password and saves the hashed version to the database.
    - **Defaults:** Sets `status='new'`, `type='lead'`, and `is_flagged=false` if not provided.
    - **Async Side-effect:** Triggers `MailService` to send the **plaintext** password to the lead's email.
    - **Async Side-effect:** Logs `LEAD_CREATED` to the Timeline.

-   **Request Body:**
    ```json
    {
      // --- 5 Core Inquiry Fields ---
      "name": "John Doe",                // Required
      "mobile": "9876543210",            // Required, Unique
      "email": "john@example.com",       // Required, Unique
      "preferred_course": "Bachelors in CS", // Required
      "preferred_country": "Finland",    // Optional

      // --- Optional / Internal Fields ---
      "utm_source": "Instagram",         // Optional tracking
      "status": "new"                    // Optional (Defaults to 'new')
    }
    ```

-   **Returns:** The newly created lead object (including the generated ID).
    ```json
    {
      "id": "uuid-1234...",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "new",
      "agent_id": "uuid-agent",          // Populated if created by agent
      "created_by": "uuid-partner",      // Populated if created by partner
      "created_at": "2025-11-20T..."
      // ... other fields
    }
    ```

-   **Errors:**
    -   `409 Conflict`: Lead with this email or mobile already exists.
    -   `500 Internal Server Error`: Database insertion failed.

### Get All Leads
-   **Route:** `GET /leads`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves all leads, ordered by newest first. Includes `assigned_partner` object (name, email). **Important:** Results are scoped to the user's Branch (for internal partners) or linked Agents (for admins).

### Get Single Lead
-   **Route:** `GET /leads/:id`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves a single lead by ID.
-   **Validation:** `id` must be a valid UUID (32 or 36 chars).

### Update Lead
-   **Route:** `PATCH /leads/:id`
-   **Authentication:** **JWT Required**
-   **Description:** Updates specific fields.
-   **Request Body:** (Partial lead object)
    ```json
    {
      "status": "contacted",
      "reason": "Called but no answer",
      "assigned_to": "counsellor-uuid"
    }
    ```
-   **Side-effects:**
    -   Updating `status` logs `LEAD_STATUS_CHANGED` in Timeline.
    -   Updating `assigned_to` logs `LEAD_OWNER_CHANGED` in Timeline.

### Delete Lead
-   **Route:** `DELETE /leads/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Description:** Permanently removes a lead and its associated timeline/notes.

### Bulk Actions (Admin/Counsellor)
-   **Bulk Assign:** `POST /leads/bulk/assign`
    -   **Body:** `{ "leadIds": ["uuid-1", "uuid-2"], "counsellorId": "uuid" }`
-   **Bulk Status:** `POST /leads/bulk/status`
    -   **Body:** `{ "leadIds": ["uuid-1"], "status": "cold", "reason": "..." }`
-   **Bulk Message:** `POST /leads/bulk/message`
    -   **Body:** `{ "leadIds": ["uuid-1"], "message": "Hello!" }`
-   **Bulk Delete:** `POST /leads/bulk/delete` (**Admin Only**)
    -   **Body:** `{ "leadIds": ["uuid-1", "uuid-2"] }`

### Get My Applications (Leads, Apps, Visas)

Retrieves a consolidated list of records that are either **Leads**, **Applications**, or **Visa** stages. This endpoint supports the hybrid ownership model and returns records owned by the logged-in Agent or Partner.

-   **Route:** `GET /leads/my-applications`
-   **Authentication:** **JWT Required (Admin, Counsellor, Agent, Super Admin)**
-   **Query Params:**
    -   `created_by` (UUID, Optional): Filters records created by a specific user. If omitted, returns all records accessible to the logged-in user.
-   **Example:** `GET /leads/my-applications?created_by=8d0f0726-4a33-4748-ad00-050b6821db20`
-   **Returns:** Array of mixed record types (Leads, Applications, Visas).
    ```json
    [
        {
        "id": "lead-uuid-1",
        "name": "Student A",
        "email": "studentA@example.com",
        "mobile": "+919876543210",
        "type": "lead",
        "status": "new",
        "agent_id": "uuid-agent",          // Populated if owned by agent
        "created_by": "uuid-partner",      // Populated if owned by partner
        "created_at": "2023-10-25T10:00:00.000Z",
        "assigned_partner": {
            "name": "Counsellor Name",
            "email": "counsellor@agency.com"
        }
        },
        {
        "id": "lead-uuid-2",
        "name": "Student B",
        "type": "application",
        "status": "applied",
        "agent_id": "uuid-agent",
        "created_at": "2023-10-24T14:30:00.000Z",
        "assigned_partner": null
        }
    ]
    ```

---

## 💰 Commissions API

Manages commission tracking and payments for agents. Automatically links commissions to agents based on lead/application ownership.

### Create Commission
-   **Route:** `POST /commissions`
-   **Authentication:** **JWT Required (Admin, Super Admin)**
-   **Description:** Manually creates a commission record for a Lead or Application. The system automatically links the commission to the Agent who created the Lead/Application.
-   **Request Body:**
    ```json
    {
      "lead_id": "uuid-of-lead",
      "application_id": null,
      "amount": 5000,
      "currency": "INR",
      "status": "PENDING",
      "remarks": "Commission for Spring Intake admission"
    }
    ```
    *Note: Provide either `lead_id` OR `application_id`.*
-   **Returns:**
    ```json
    {
      "id": "comm-uuid",
      "lead_id": "uuid-of-lead",
      "agent_id": "uuid-of-agent",
      "amount": 5000,
      "currency": "INR",
      "status": "PENDING",
      "agent": {
        "name": "John Doe",
        "agency_name": "Global Edu"
      }
    }
    ```

### Get All Commissions
-   **Route:** `GET /commissions`
-   **Authentication:** **JWT Required (Admin, Super Admin)**
-   **Description:** Retrieves a master list of all commissions across all agents.
-   **Returns:** Array of commission objects with nested agent and lead details.

### Get My Commissions
-   **Route:** `GET /commissions/my-commissions`
-   **Authentication:** **JWT Required (Agent)**
-   **Description:** Retrieves commissions linked to the currently logged-in Agent. Used for the B2B Dashboard.
-   **Returns:**
    ```json
    [
      {
        "id": "comm-uuid-2",
        "amount": 5000,
        "currency": "INR",
        "status": "PENDING",
        "remarks": "Awaiting University confirmation",
        "lead": {
          "name": "Student B"
        },
        "application": {
          "student_id": "STU-2024-001",
          "application_stage": "Offer Letter Received"
        }
      }
    ]
    ```

### Get Single Commission
-   **Route:** `GET /commissions/:id`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves details of a specific commission.

### Update Commission
-   **Route:** `PATCH /commissions/:id`
-   **Authentication:** **JWT Required (Admin, Super Admin)**
-   **Description:** Updates commission status or remarks.
-   **Request Body:**
    ```json
    {
      "status": "PAID",
      "remarks": "Transaction ID: TXN123456"
    }
    ```
-   **Valid Statuses:** `PENDING`, `APPROVED`, `PAID`, `REJECTED`
-   **Returns:** Updated commission object.

### Delete Commission
-   **Route:** `DELETE /commissions/:id`
-   **Authentication:** **JWT Required (Admin, Super Admin)**
-   **Description:** Permanently removes a commission record.

---

## ⚙️ Dropdowns API

### Get All Categories & Options

Retrieves the entire dropdown structure: categories (tabs) and their nested options (items). Used for the "Customize" page.

-   **Route:** `GET /dropdowns/categories`
-   **Authentication:** **JWT Required (Admin, Super Admin)**
-   **Returns:**
    ```json
    [
      {
        "id": "uuid-cat-1",
        "name": "reasons",
        "label": "Reasons",
        "is_system": true,
        "options": [
          {
            "id": "uuid-opt-1",
            "label": "Not Interested",
            "value": "not_interested",
            "is_active": true
          },
          {
            "id": "uuid-opt-2",
            "label": "Too Expensive",
            "value": "expensive",
            "is_active": true
          }
        ]
      },
      {
        "id": "uuid-cat-2",
        "name": "intakes",
        "label": "Intake Months",
        "is_system": false,
        "options": []
      }
    ]
    ```

### Create New Category

Adds a new category (tab) for organizing dropdown options.

-   **Route:** `POST /dropdowns/categories`
-   **Authentication:** **JWT Required (Admin, Super Admin)**
-   **Request Body:**
    ```json
    {
      "name": "lead_sources",
      "label": "Lead Sources"
    }
    ```
-   **Returns:** Created category object.

### Delete Category

Removes a category and all associated options. System categories cannot be deleted.

-   **Route:** `DELETE /dropdowns/categories/:id`
-   **Authentication:** **JWT Required (Admin, Super Admin)**
-   **Returns:** Deleted category object.

### Add Option to Category

Adds a new dropdown item to a specific category.

-   **Route:** `POST /dropdowns/options`
-   **Authentication:** **JWT Required (Admin, Super Admin)**
-   **Request Body:**
    ```json
    {
      "category_id": "uuid-cat-1",
      "label": "Instagram Ads",
      "value": "ig_ads"
    }
    ```
-   **Returns:** Created option object.

### Delete Option

Removes a specific dropdown item from a category.

-   **Route:** `DELETE /dropdowns/options/:id`
-   **Authentication:** **JWT Required (Admin, Super Admin)**
-   **Returns:** Deleted option object.

---

## 💬 Chat System (Socket.io)

Real-time messaging system for communication between leads and counsellors.

**Endpoint URL:** `ws://localhost:5005`  
**Namespace:** `/chat`

### Authentication

Socket connection requires a valid JWT token passed during handshake.

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5005/chat", {
    auth: {
        token: "Bearer <YOUR_JWT_TOKEN>"
    }
});

socket.on("connect_error", (err) => {
    console.log(err.message); // "No token" or "Invalid token"
});
```

### Load Chat History

Retrieve previous messages for a lead before connecting to socket.

-   **Route:** `GET /chat/history/:leadId`
-   **Authentication:** **JWT Required**
-   **Returns:**
    ```json
        [
            {
                "id": "msg-uuid-1",
                "message": "Hello, I need help with my visa.",
                "sender_type": "LEAD",
                "created_at": "2023-10-27T10:00:00Z",
                "is_read": true
            },
            {
                "id": "msg-uuid-2",
                "message": "Sure, I can help you.",
                "sender_type": "PARTNER",
                "partner": { "name": "Counsellor John" }
            }
        ]
    ```

### Client → Server Events

Events emitted from the frontend.

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ "lead_id": "uuid" }` | (Staff Only) Join student's chat room. Students auto-join on connect. |
| `send_message` | `{ "lead_id": "uuid", "message": "Hi" }` | Send a message. |
| `typing` | `{ "lead_id": "uuid", "isTyping": true }` | Send typing status (true/false). |
| `mark_read` | `{ "lead_id": "uuid" }` | Mark unread messages as read. |

### Server → Client Events

Events to listen for on the frontend.

**receive_message**

Triggered when a message is sent in the room.

```javascript
socket.on("receive_message", (data) => {
    // { id, message, sender_type, created_at, partner: {...} }
    console.log("New Message:", data);
});
```

**user_typing**

Triggered when the other person starts/stops typing.

```javascript
socket.on("user_typing", (data) => {
    // { user: "John Doe", isTyping: true }
    console.log(data);
});
```

### Frontend Implementation Flow

1. **On Page Load:**
     - Call `GET /chat/history/:leadId`
     - Connect to socket
     - If counsellor: Emit `join_room` with lead_id
     - Scroll to bottom

2. **Sending Messages:**
     - User types → Emit `typing { isTyping: true }`
     - User stops → Emit `typing { isTyping: false }`
     - User submits → Emit `send_message`
     - Optimistic UI: Append message immediately (greyed out)
     - Confirm when `receive_message` returns

3. **Receiving Messages:**
     - Listen for `receive_message` → Append to list
     - If chat window open → Emit `mark_read`

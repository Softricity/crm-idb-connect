# API Documentation

This document provides a complete reference for all the APIs available in the backend application.

---

## ⚡ General Information

### Authentication
Most endpoints are protected by **JWT Authentication**.
-   **Public Endpoints:** `POST /auth/login` and `POST /leads`.
-   **Protected Endpoints:** Require a valid Bearer Token in the Authorization header: `Authorization: Bearer <access_token>`.
-   **Role Based Access Control (RBAC):** Endpoints verify if the user has the required role (`admin`, `counsellor`, `agent`) or specific permissions.

### Base URL
All routes are relative to the NestJS server URL (e.g., `http://localhost:5005`).

### Error Codes
-   **400 Bad Request:** Invalid input (e.g., invalid UUID format).
-   **401 Unauthorized:** Missing or invalid JWT token.
-   **403 Forbidden:** Authenticated but lacks permission (e.g., Agent deleting a Partner).
-   **404 Not Found:** Resource does not exist.
-   **409 Conflict:** Unique constraint violation (e.g., Email/Mobile exists).
-   **422 Unprocessable Entity:** Validation failed.
-   **500 Internal Server Error:** Server-side failure.

---

## 🏠 App API

### Health Check
-   **Route:** `GET /`
-   **Authentication:** None
-   **Description:** Simple health check.
-   **Returns:** "Hello World!"

---

## 🔐 Auth API

### Partner Login
-   **Route:** `POST /auth/login`
-   **Authentication:** **None (Public)**
-   **Description:** Authenticates a partner using email and password.
-   **Request Body:**
    ```json
    {
      "email": "admin@example.com",
      "password": "password123"
    }
    ```
-   **Returns:** Includes the token, the user's profile info, and **branch context**.
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1Ni...",
      "partner": {
        "id": "uuid",
        "name": "Admin User",
        "role": "admin",
        "email": "admin@example.com",
        "branch_id": "uuid-of-branch",      // Added
        "branch_name": "Head Office",       // Added
        "branch_type": "HeadOffice"         // Added
      }
    }
    ```
### Agent Login (Unified)

Agents use the same login endpoint as internal staff. The system automatically detects if the email belongs to an Agent or a Partner.

-   **Route:** `POST /auth/login`
-   **Authentication:** **None (Public)**
-   **Description:** Authenticates an agent using email and password. The system automatically identifies whether the user is an Agent or Partner.
-   **Request Body:**
    ```json
    {
      "email": "john.doe@agency.com",
      "password": "securePassword123"
    }
    ```
-   **Returns:** JWT token and user details.
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR...",
      "partner": {
        "id": "8d0f0726-4a33-4748-ad00-050b6821db20",
        "name": "John Doe",
        "email": "john.doe@agency.com",
        "role": "agent",
        "type": "agent",
        "permissions": []
      }
    }
    ```

---

## 🏢 Branches API

Manage office locations (Head Office, Regional, Local Branches).

### Create Branch
-   **Route:** `POST /branches`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Description:** Creates a new organizational branch.
-   **Request Body:**
    ```json
    {
      "name": "Delhi Branch",
      "code": "DEL-001",
      "type": "Branch", // Options: "HeadOffice", "Regional", "Branch"
      "address": "Connaught Place, Delhi",
      "phone": "011-23456789",
      "parent_id": "uuid-of-regional-office" // Optional hierarchy
    }
    ```
-   **Returns:** The newly created branch object.

### Get All Branches
-   **Route:** `GET /branches`
-   **Authentication:** **JWT Required**
-   **Description:** Returns all branches with their parent/children hierarchy structure. Used for dropdowns and organizational charts.

### Get Single Branch
-   **Route:** `GET /branches/:id`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves details of a specific branch.

### Update Branch
-   **Route:** `PATCH /branches/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Description:** Updates branch details.
-   **Request Body:** Partial branch object.

### Delete Branch
-   **Route:** `DELETE /branches/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Description:** Deletes a branch.
-   **Note:** Cannot delete a branch if it has active users or leads assigned to it.

---

## 🛡️ Permissions & Roles API

System-level configuration for Role-Based Access Control (RBAC).

### 1. Roles

-   **Create Role:** `POST /roles`
    -   **Auth:** Admin Only
    -   **Body:** `{ "name": "SuperAdmin", "description": "Has full access" }`
-   **Get All Roles:** `GET /roles`
    -   **Auth:** Admin, Counsellor
-   **Get Single Role:** `GET /roles/:id`
    -   **Auth:** Admin, Counsellor
-   **Update Role:** `PATCH /roles/:id`
    -   **Auth:** Admin Only
-   **Delete Role:** `DELETE /roles/:id`
    -   **Auth:** Admin Only

### 2. Permissions

-   **Create Permission:** `POST /permissions`
    -   **Auth:** Admin Only
    -   **Body:** `{ "name": "leads.delete", "permission_group_id": "uuid" }`
-   **Get All Permissions:** `GET /permissions`
    -   **Auth:** Admin, Counsellor
-   **Get Single Permission:** `GET /permissions/:id`
    -   **Auth:** Admin, Counsellor
-   **Update Permission:** `PATCH /permissions/:id`
    -   **Auth:** Admin Only
-   **Delete Permission:** `DELETE /permissions/:id`
    -   **Auth:** Admin Only

### 3. Permission Groups

-   **Create Group:** `POST /permission-groups`
    -   **Auth:** Admin Only
    -   **Body:** `{ "name": "Leads Management" }`
-   **Get All Groups:** `GET /permission-groups`
    -   **Auth:** Admin, Counsellor
-   **Update Group:** `PATCH /permission-groups/:id`
    -   **Auth:** Admin Only
-   **Delete Group:** `DELETE /permission-groups/:id`
    -   **Auth:** Admin Only

### 4. Role-Permission Assignments

-   **Assign Permissions:** `POST /roles/assign-permissions`
    -   **Auth:** Admin Only
    -   **Body:** `{ "roleId": "uuid", "permissionIds": ["uuid1", "uuid2"] }`
-   **Get Role Permissions:** `GET /roles/:id/permissions`
    -   **Auth:** Admin, Counsellor
-   **Remove Permission from Role:** `DELETE /roles/:roleId/permissions/:permissionId`
    -   **Auth:** Admin Only

---

## 👨‍💼 Leads API

This module handles lead creation, management, and bulk operations.

### Create a New Lead (Public/Internal)

-   **Route:** `POST /leads`
-   **Authentication:** **None (Public)**
-   **Description:** Creates a new lead. This endpoint is used by both public inquiry forms and internal panels.
    1.  **Duplicate Check:** Validates that `email` and `mobile` do not already exist.
    2.  **Password Generation:** Generates a random **plaintext** password.
    3.  **Security:** Hashes the password and saves the hashed version to the database.
    4.  **Defaults:** Sets `status='new'`, `type='lead'`, and `is_flagged=false` if not provided.
    5.  **Async Side-effect:** Triggers `MailService` to send the **plaintext** password to the lead's email.
    6.  **Async Side-effect:** Logs `LEAD_CREATED` to the Timeline.

-   **Request Body:**
    *Note: `city`, `purpose`, and `alternate_mobile` have been removed in favor of `preferred_course`.*
    ```json
    {
      // --- 5 Core Inquiry Fields ---
      "name": "John Doe",                // Required
      "mobile": "9876543210",            // Required, Unique
      "email": "john@example.com",       // Required, Unique
      "preferred_course": "Bachelors in CS", // Required (Replaces 'purpose')
      "preferred_country": "Finland",    // Optional

      // --- Optional / Internal Fields ---
      "utm_source": "Instagram",         // Optional tracking
      "created_by": "uuid-of-partner",   // Required for internal creation (Admin/Agent)
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
-   **Description:** Retrieves all leads, ordered by newest first. Includes `assigned_partner` object (name, email). **Important:** Results are scoped to the user's Branch.

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

Retrieves a consolidated list of records that are either **Leads**, **Applications**, or **Visa** stages. This is useful for a unified view of all student files.

-   **Route:** `GET /leads/my-applications`
-   **Authentication:** **JWT Required (Admin, Counsellor, Super Admin)**
-   **Query Params:**
    -   `created_by` (UUID, Optional): Filters records created by a specific user. If omitted, returns all records.
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
        "created_at": "2023-10-24T14:30:00.000Z",
        "assigned_partner": null
        }
    ]
    ```

---

## 🤝 Partners API

### Create Partner
-   **Route:** `POST /partners`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Description:** Creates a new partner user (Admin, Counsellor, or Agent) and links them to a specific Role ID.
-   **Request Body:**
    ```json
    {
      "role_id": "uuid-of-role", // ⚠️ Changed from "role" string to "role_id" UUID
      "name": "Agent Smith",
      "email": "agent@example.com",
      "mobile": "9876543210",
      "password": "securePassword123",
      "address": "123 Agent St",
      "city": "New York",
      "state": "NY",
      "area": "Manhattan",
      "zone": "East",
      "agency_name": "Smith Agencies", // Optional
      "branch_id": "uuid-of-branch"    // Optional: Admin can assign specific branch
    }
    ```
-   **Returns:** Created partner object (excluding password), including the `role` object.
-   **Errors:** - `400 Bad Request`: Invalid Role ID.
    - `409 Conflict`: Email or mobile already exists.

### Get All Partners
-   **Route:** `GET /partners`
-   **Query Params:** `?role=agent` or `?role=counsellor` (Filters by Role Name)
-   **Authentication:** **JWT Required**
-   **Returns:** Array of partner objects with nested role details. **Scoped:** Admins see users in their branch hierarchy.
    ```json
    [
      {
        "id": "uuid...",
        "name": "Agent Smith",
        "email": "agent@example.com",
        "role_id": "uuid-of-role",
        "role": {
          "id": "uuid-of-role",
          "name": "agent"
        },
        // ... other fields
      }
    ]
    ```

### Get Single Partner
-   **Route:** `GET /partners/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Returns:** Single partner object with full nested `role` details.

### Update Partner
-   **Route:** `PATCH /partners/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:** (Partial update)
    ```json
    {
      "name": "Agent Smith Jr.",
      "role_id": "new-uuid-role" // Can re-assign role
    }
    ```

### Delete Partner
-   **Route:** `DELETE /partners/:id`
-   **Authentication:** **JWT Required (Admin Only)**

### Bulk Delete Partners
-   **Route:** `POST /partners/bulk/delete`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Body:** `{ "partnerIds": ["uuid-1", "uuid-2"] }`

---

## 🕵️ Agents API

### 1. Onboard New Agent (Public)

-   **Route:** `POST /agents/onboard`
-   **Authentication:** **None (Public)**
-   **Description:** Allows external users (agents) to register themselves in the system.
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
      "state": "Maharashtra",
      "city": "Mumbai",
      "address": "123 Business Park, Andheri East",
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

## 💰 Commissions API

Manages commission tracking and payments for agents.

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
-   **Authentication:** **JWT Required**
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

## 💬 Engagement API

### Notes
-   **Create Note:** `POST /notes`
    -   **Body:** `{ "text": "Note content", "lead_id": "uuid" }`
    -   **Side-effect:** Logs `LEAD_NOTE_ADDED`.
-   **Get Notes:** `GET /leads/:leadId/notes`
    -   **Auth:** Any authenticated user with access to the lead.
-   **Update Note:** `PATCH /notes/:id`
    -   **Auth:** **Creator OR Admin Only**.
-   **Delete Note:** `DELETE /notes/:id`
    -   **Auth:** **Creator OR Admin Only**.

### Follow-ups
-   **Create Follow-up:** `POST /followups`
    -   **Body:** `{ "title": "...", "lead_id": "uuid", "due_date": "ISO" }`
    -   **Side-effect:** Logs `LEAD_FOLLOWUP_ADDED`.
-   **Get Follow-ups:** `GET /leads/:leadId/followups`
    -   **Auth:** Any authenticated user with access to the lead.
-   **Update Follow-up:** `PATCH /followups/:id`
    -   **Auth:** **Creator OR Admin Only**.
-   **Delete Follow-up:** `DELETE /followups/:id`
    -   **Auth:** **Creator OR Admin Only**.

### Follow-up Comments
-   **Add Comment:** `POST /followups/:id/comments`
    -   **Returns:** Comment object including `created_by` user ID and timestamp.
-   **Update/Delete Comment:** `PATCH` / `DELETE` `/comments/:id`
    -   **Auth:** **Creator OR Admin Only**.

---

## 📝 Applications API

**General Behavior:**
* **Lead Driven:** All endpoints identify the application by the **`leadId`** (not the application ID).
* **Upsert Logic:** If an application record does not exist for the given Lead ID, any `PATCH` request will automatically **create** it before updating the specific section.
* **Returns:** All update endpoints return the **Full Application Object** (including all nested sections) after the update.
* **Scope:** All updates require the user to have access to the specific `leadId` based on Branch Scope.

### 1. Get Full Application
-   **Route:** `GET /applications/:leadId`
-   **Authentication:** **JWT Required**
-   **Description:** Returns the complete application tree with all nested relations.
-   **Returns:** `null` if the application has not been started, otherwise the full object.

### 2. Update Personal Details
-   **Route:** `PATCH /applications/:leadId/personal`
-   **Content-Type:** `application/json`
-   **Description:** Updates the applicant's basic profile and family details.
-   **Request Body:**
    ```json
    {
      "given_name": "John",
      "surname": "Doe",
      "gender": "Male",
      "dob": "1999-05-15T00:00:00.000Z",
      "marital_status": "Single",
      "phone": "9876543210",
      "alternate_phone": "9800000000",
      "email": "john@example.com",
      "address": "123 Main St, Downtown",
      "city": "Kathmandu",
      "state": "Bagmati",
      "country": "Nepal",
      "citizenship": "Nepal",
      "national_id": "123-456-789",
      "current_status": "Student",
      "gap_years": 1,
      "referral_source": "Facebook",
      
      "father_name": "Robert Doe",
      "mother_name": "Mary Doe",
      "emergency_contact_name": "Robert Doe",
      "emergency_contact_number": "9870000000"
    }
    ```

### 3. Update Education History
-   **Route:** `PATCH /applications/:leadId/education`
-   **Content-Type:** `application/json`
-   **Description:** Handles the list of educational qualifications.
-   **Behavior:**
    -   Include `id` to update an existing record.
    -   Omit `id` to create a new record.
-   **Request Body:**
    ```json
    {
      "records": [
        {
          "id": "uuid-existing-record", // Optional
          "level": "Bachelor",
          "institution_name": "Tribhuvan University",
          "board_university": "TU",
          "country_of_study": "Nepal",
          "major_stream": "Computer Science",
          "percentage_gpa": "3.8",
          "year_of_passing": "2023",
          "medium_of_instruction": "English",
          "backlogs": 0,
          "certificate_url": "[https://s3.aws.com/cert.pdf](https://s3.aws.com/cert.pdf)" // URL from a previous upload
        }
      ]
    }
    ```

### 4. Update Preferences
-   **Route:** `PATCH /applications/:leadId/preferences`
-   **Content-Type:** `application/json`
-   **Description:** Updates study abroad preferences and financial info. Supports multiple preference records.
-   **Behavior:**
    -   Include `id` to update an existing preference record.
    -   Omit `id` to create a new preference record.
-   **Request Body:**
    ```json
    {
      "records": [
        {
          "id": "uuid-existing-record", // Optional
          "preferred_country": "Canada",
          "preferred_course_type": "Post-Graduate",
          "preferred_course_name": "Data Science",
          "preferred_intake": "Sept 2025",
          "preferred_university": "University of Toronto",
          "backup_country": "Australia",
          "study_mode": "On-campus",
          "budget_range": "20000-30000 USD",
          "scholarship_interest": true,
          "travel_history": "Visited Thailand in 2022 for tourism."
        }
      ]
    }
    ```

### 5. Update Language & Aptitude Tests
-   **Route:** `PATCH /applications/:leadId/tests`
-   **Content-Type:** `application/json`
-   **Description:** Handles test scores (IELTS, PTE, TOEFL, etc.).
-   **Request Body:**
    ```json
    {
      "records": [
        {
          "test_type": "IELTS",
          "test_date": "2024-01-10T00:00:00.000Z",
          "overall_score": 7.5,
          "listening": 8.0,
          "reading": 7.5,
          "writing": 7.0,
          "speaking": 7.5,
          "trf_number": "12345ABC"
        }
      ]
    }
    ```

### 6. Update Work Experience
-   **Route:** `PATCH /applications/:leadId/work-experience`
-   **Content-Type:** `application/json`
-   **Description:** Handles employment history.
-   **Request Body:**
    ```json
    {
      "records": [
        {
          "company_name": "Tech Solutions Ltd",
          "designation": "Junior Developer",
          "start_date": "2023-06-01T00:00:00.000Z",
          "end_date": "2024-01-01T00:00:00.000Z",
          "job_duties": "Developed backend APIs...",
          "certificate_url": "[https://s3.aws.com/work-exp.pdf](https://s3.aws.com/work-exp.pdf)"
        }
      ]
    }
    ```

### 7. Update Visa & Passport Details
-   **Route:** `PATCH /applications/:leadId/visa`
-   **Content-Type:** `application/json`
-   **Description:** Updates passport information and previous visa history.
-   **Request Body:**
    ```json
    {
      "passport_number": "A1234567",
      "passport_issue_date": "2020-01-01T00:00:00.000Z",
      "passport_expiry_date": "2030-01-01T00:00:00.000Z",
      "passport_place_of_issue": "Kathmandu",
      "passport_nationality": "Nepalese",
      "country_applied_for": "USA",
      "previous_visa_type": "Student",
      "visa_status": "Refused",
      "visa_refusal_reason": "Insufficient funds",
      "travelled_countries": "India, Thailand",
      "is_visa_rejected_past": true
    }
    ```

### 8. Update Documents (File Upload)
-   **Route:** `PATCH /applications/:leadId/documents`
-   **Content-Type:** `multipart/form-data`
-   **Description:** Uploads files directly. The server uploads them to Supabase Storage and saves the returned URLs in the database.
-   **Form Data Fields:**
    * `profile_photo` (File)
    * `passport_copy` (File)
    * `academic_documents` (Files - Max 10)
    * `english_test_cert` (File)
    * `sop` (File)
    * `cv_resume` (File)
    * `recommendation_letters` (Files - Max 5)
    * `financial_documents` (File)
    * `other_documents` (File)

---

---

## 💸 Offline Payments API

Manages manual payment records (Cash, Bank Transfer, etc.) and stores proof of payment (slips) using Supabase Storage.

### Create Payment (Upload Slip)
-   **Route:** `POST /offline-payments`
-   **Authentication:** **JWT Required**
-   **Content-Type:** `multipart/form-data`
-   **Description:** Creates a new payment record and uploads the payment slip (file) to the `payment-slips` bucket.
-   **Form Data Fields:**
    * `amount`: Number (Required) - e.g., `5000`
    * `currency`: String (Required) - e.g., `USD`, `NPR`
    * `payment_mode`: String (Optional) - e.g., `Cash`, `Bank Transfer`
    * `payment_type`: String (Required) - e.g., `Application Fee`, `Tuition Fee`
    * `receiver`: UUID (Required) - The Partner ID who received the money.
    * `lead_id`: UUID (Optional) - The Lead associated with this payment.
    * `reference_id`: String (Optional) - Bank transaction ID or Receipt No.
    * `status`: String (Optional) - e.g., `Pending`, `Verified`.
    * `file`: **File** (Optional) - The image/PDF of the payment slip.

### Get Payments by Lead
-   **Route:** `GET /leads/:leadId/offline-payments`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves a history of all offline payments made by a specific lead.
-   **Returns:** Array of payment objects including `file` URL.

### Get Payments by Receiver (Partner)
-   **Route:** `GET /partners/:receiverId/offline-payments`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves all payments collected by a specific partner/counsellor.

### Update Payment
-   **Route:** `PATCH /offline-payments/:id`
-   **Authentication:** **JWT Required**
-   **Content-Type:** `application/json`
-   **Request Body:** (Partial update)
    ```json
    {
      "amount": 6000,
      "status": "Verified",
      "reference_id": "TXN-99999"
    }
    ```

### Delete Payment
-   **Route:** `DELETE /offline-payments/:id`
-   **Authentication:** **JWT Required**
-   **Description:** Deletes the payment record from the database.
-   **Note:** Currently, this removes the database record. (Frontend may need to handle file deletion if strict cleanup is required).

---

## 📊 Dashboard API

### Get Dashboard Stats
-   **Route:** `GET /dashboard/stats`
-   **Authentication:** **JWT Required (Admin, Counsellor)**
-   **Description:** Returns statistics **filtered by the user's branch**.
-   **Returns:**
    ```json
    {
      "metrics": { "total": 100, "todaysLeads": 5, "converted": 10, "rejected": 2 },
      "byStatus": { "new": 10, "contacted": 5 },
      "bySource": { "google": 20, "referral": 5 },
      "last7Days": [ { "label": "Nov 16", "count": 3 } ]
    }
    ```
---

## 🏳️ Countries API

Manages the list of countries for study abroad destinations.

### Create Country
-   **Route:** `POST /countries`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:**
    ```json
    {
      "name": "Finland",
      "flag": "[https://example.com/finland-flag.png](https://example.com/finland-flag.png)"
    }
    ```
-   **Returns:** Created country object.
-   **Errors:** `409 Conflict` if country name already exists.

### Get All Countries
-   **Route:** `GET /countries`
-   **Authentication:** **None (Public)**
-   **Description:** Retrieves a list of all countries, sorted alphabetically. Used to populate dropdowns on the frontend.
-   **Returns:** Array of country objects.

### Get Single Country
-   **Route:** `GET /countries/:id`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves a single country by ID, including a list of its universities.

### Update Country
-   **Route:** `PATCH /countries/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:** (Partial)
    ```json
    {
      "name": "Republic of Finland"
    }
    ```

### Delete Country
-   **Route:** `DELETE /countries/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Note:** This will cascade delete all Universities and Courses linked to this country.

---

## 🏫 Universities API

Manages universities linked to countries.

### Create University
-   **Route:** `POST /universities`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:**
    ```json
    {
        "name": "University of Helsinki",
        "countryId": "uuid-of-country",
        "city": "Helsinki",
        "logo": "https://example.com/logo.png",
        "commission_type": "PERCENTAGE", // or "FIXED"
        "commission_value": 15,          // 15% or Flat 1500
        "currency": "EUR",               // Required if FIXED
        "excluded_countries": ["Iran", "North Korea"] // Agents from these countries cannot see this university
    }
    ```
-   **Validation:** `countryId` must be a valid UUID of an existing country.

### Get All Universities
-   **Route:** `GET /universities`
-   **Authentication:** **None (Public)**
-   **Query Params:**
    -   `?countryId=uuid` (Optional: Filter universities by a specific country).
-   **Description:** Retrieves a list of universities.
-   **Returns:** Array of university objects with their associated `country` data.

### Get Single University
-   **Route:** `GET /universities/:id`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves a single university, including its `country` and list of `courses`.

### Update University
-   **Route:** `PATCH /universities/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:** (Partial)
    ```json
    {
        "name": "Updated Uni Name",          // Optional
        "logo": "https://...",               // Optional
        "city": "Berlin",                    // Optional

        // Commission & Access Control (Optional)
        "commission_type": "FIXED",
        "commission_value": 500,
        "excluded_countries": ["Iran", "North Korea"]
    }
    ```

### Delete University
-   **Route:** `DELETE /universities/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Note:** This will cascade delete all Courses linked to this university.

---

## 🎓 Courses API

Manages courses offered by universities.

### Create Course
-   **Route:** `POST /courses`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:**
    ```json
    {
      "name": "Masters in Computer Science",
      "university_id": "uuid-of-university",
      "level": "Masters",
      "category": "IT",
      "duration": 24,
      "fee": 15000,
      "fee_type": "Per Year",
      "application_fee": 100,
      "intake_month": "September, January",
      "commission": "15%",
      "description": "Comprehensive CS program...",
      "excluded_countries": ["India", "Pakistan"] // Specific blacklist for this course
    }
    ```

### Get All Courses (Search & Filter)
-   **Route:** `GET /courses`
-   **Authentication:** **None (Public)** (or Protected based on config)
-   **Query Params:** (All are optional)
    -   `search`: String (Matches Course Name or University Name)
    -   `country`: Array of strings (e.g., `?country=USA&country=UK`)
    -   `level`: Array of strings (e.g., `?level=Masters`)
    -   `university`: Array of strings (University names)
    -   `intake`: Array of strings (e.g., `?intake=Sep`)
-   **Description:** Returns a filtered list of courses. Includes nested `university` and `country` objects.

### Get Filter Options
-   **Route:** `GET /courses/filters`
-   **Authentication:** **None (Public)**
-   **Description:** Returns available unique values for the frontend sidebar (Countries, Universities, Levels).
-   **Returns:**
    ```json
    {
      "countries": ["Finland", "USA"],
      "universities": ["Helsinki", "Aalto"],
      "levels": ["Bachelors", "Masters"]
    }
    ```

### Get Single Course
-   **Route:** `GET /courses/:id`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves detailed information for a specific course.

### Update Course
-   **Route:** `PATCH /courses/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:** Partial course object.

### Delete Course
-   **Route:** `DELETE /courses/:id`
-   **Authentication:** **JWT Required (Admin Only)**

---

## 💼 University Commission Plans

This feature allows you to define a uniform commission structure for a university (e.g., "All courses give 15%" or "Flat $500"). The system then auto-calculates this amount when a commission record is created for a student application.

### A. Set Commission Plan (Update University)

Define the rules for a specific university.

-   **Route:** `PATCH /universities/:id`
-   **Headers:** `Authorization: Bearer <token>`
-   **Access:** Admin / Super Admin
-   **Request Body:**
    ```json
    {
      "commission_type": "PERCENTAGE",  // Options: "PERCENTAGE" or "FIXED"
      "commission_value": 15,           // If Percentage: 15%. If Fixed: 15 (currency units)
      "currency": "USD"                 // Optional, defaults to "INR" if not sent. Required if type is FIXED.
    }
    ```
-   **Response (200 OK):**
    ```json
    {
      "id": "uuid-uni-1",
      "name": "Technical University of Munich",
      "commission_type": "PERCENTAGE",
      "commission_value": "15",
      "currency": "EUR"
    }
    ```

### B. Create Commission (Auto-Calculation)

Creates a commission record. If amount is omitted, the system calculates it automatically based on the University rules and Course fees.

-   **Route:** `POST /commissions`
-   **Headers:** `Authorization: Bearer <token>`
-   **Access:** Admin / Partner
-   **Request Body (Auto-Calculate Mode):**
    ```json
    {
      "application_id": "uuid-app-1",
      "amount": null,       // Send null (or omit) to trigger auto-calculation
      "status": "PENDING",
      "remarks": "Fall 2025 Intake"
    }
    ```
-   **Request Body (Manual Override):**
    ```json
    {
      "application_id": "uuid-app-1",
      "amount": 500,        // Manually specify amount to override calculation
      "currency": "USD"
    }
    ```
-   **Logic:**
    -   **Agent Detection:** Automatically links the Agent assigned to the Lead.
    -   **Calculation:**
        - If Uni has PERCENTAGE: (Course Tuition Fee * Uni Value) / 100.
        - If Uni has FIXED: Uses the fixed value directly.
    -   **Fallback:** If no rule exists, it defaults to 0.

---

## Financials in A Lead's Application

## 💰 Financials in A Lead's Application

Manages financial documentation and approval workflow for student applications.

### Get Financial Data
-   **Route:** `GET /financials/:leadId`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves the financial status and all associated notes for a lead's application.
-   **Returns:**
    ```json
    {
      "id": "uuid-financial-record",
      "status": "SENT_TO_UNIVERSITY",
      "notes": [
        {
          "id": "note-uuid-1",
          "stage": "PENDING",
          "content": "Documents verified.",
          "created_at": "2024-01-15T10:30:00.000Z",
          "partner": {
            "name": "Agent Smith"
          }
        },
        {
          "id": "note-uuid-2",
          "stage": "APPROVED",
          "content": "Loan sanction letter received.",
          "created_at": "2024-01-16T14:00:00.000Z",
          "partner": {
            "name": "Admin"
          }
        }
      ]
    }
    ```
-   **Frontend Logic:** Filter the notes array by stage to render them in specific UI cards (e.g., `notes.filter(n => n.stage === 'PENDING')`).

### Update Financial Status
-   **Route:** `PATCH /financials/:leadId/status`
-   **Authentication:** **JWT Required**
-   **Description:** Updates the overall financial status for the lead's application.
-   **Request Body:**
    ```json
    {
      "status": "APPROVED"
    }
    ```
-   **Valid Statuses:** `PENDING`, `SENT_TO_UNIVERSITY`, `APPROVED`, `REJECTED`
-   **Returns:** Updated financial object.

### Add Financial Note
-   **Route:** `POST /financials/:leadId/notes`
-   **Authentication:** **JWT Required**
-   **Description:** Adds a note at a specific financial stage.
-   **Request Body:**
    ```json
    {
      "stage": "SENT_TO_UNIVERSITY",
      "content": "Courier tracking ID: 123456"
    }
    ```
-   **Returns:** Created note object with timestamp and associated partner details.

---

## Announcements API

Manage announcements for user or branch

### Create Announcement
-   **Route:** `POST /announcements`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:**
    ```json
    {
      "title": "New Feature Released",
      "content": "We have launched a new feature...",
      "target_audience": "user", // or "branch"
      "branch_id": "uuid-of-branch", // Optional, required if target_audience is "branch"
      "users": ["uuid1", "uuid2"] // Optional, list of user IDs if target_audience is "user"
    }
    ```
-   **Returns:** Created announcement object.

### Get Announcements
-   **Route:** `GET /announcements`
-   **Authentication:** **JWT Required**
-   **Query Params:**
    -   `?target_audience=user` or `?target_audience=branch`
    -   `?branch_id=uuid` (if target_audience is "branch")
-   **Description:** Retrieves announcements based on target audience.
-   **Returns:** Array of announcement objects.

### Update Announcement
-   **Route:** `PATCH /announcements/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:** Partial announcement object.

### Delete Announcement
-   **Route:** `DELETE /announcements/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Returns:** Deleted announcement object.

### Mark Announcement as Read
-   **Route:** `POST /announcements/:id/mark-read`
-   **Authentication:** **JWT Required**
-   **Description:** Marks the announcement as read for the authenticated user.

### Get Unread Announcements Count
-   **Route:** `GET /announcements/unread-count`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves the count of unread announcements for the authenticated user.

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

## 🛠️ Support Ticket API

Manage support cases, inquiries, and issue tracking.

### 1. Create Ticket
- **Route:** `POST /support`
- **Authentication:** JWT Required
- **Description:** Creates a new support case.
- **Request Body:**
    ```json
    {
      "topic": "Agent Portal Management",    // From Dropdown
      "category": "Bank Details Upload",     // From Dropdown
      "institution_id": "uuid-uni-1",        // Optional, from Dropdown
      "subject": "Unable to upload document",
      "description": "I get a 500 error when uploading...",
      "priority": "HIGH",                    // Optional (LOW, MEDIUM, HIGH, URGENT)
      "attachment_urls": ["https://s3.../error.png"] // Optional
    }
    ```
- **Returns:**
    ```json
    {
      "id": "uuid",
      "case_number": 1005,
      "status": "OPEN",
      "created_at": "..."
    }
    ```

### 2. Get All Tickets
- **Route:** `GET /support`
- **Query Params:** `?status=OPEN` (Optional)
- **Behavior:**
    - **Agents:** Returns only their tickets.
    - **Admins:** Returns all tickets.
- **Returns:** Array of ticket summaries.

### 3. Get Ticket Details (Conversation)
- **Route:** `GET /support/:id`
- **Description:** Fetches the ticket details along with the full conversation history.
- **Returns:**
    ```json
    {
      "id": "uuid",
      "case_number": 1005,
      "subject": "Unable to upload document",
      "status": "IN_PROGRESS",
      "partner": { "name": "Agent Smith" },
      "comments": [
        {
          "id": "c1",
          "sender_type": "PARTNER",
          "sender_name": "Agent Smith",
          "message": "I get a 500 error...",
          "created_at": "..."
        },
        {
          "id": "c2",
          "sender_type": "ADMIN",
          "sender_name": "Support Staff",
          "message": "Can you please clear your cache?",
          "created_at": "..."
        }
      ]
    }
    ```

### 4. Add Comment (Reply)
- **Route:** `POST /support/:id/comments`
- **Request Body:**
    ```json
    {
      "message": "Still not working. See attached.",
      "attachment_urls": ["https://..."]
    }
    ```
- **Side-effect:** This usually should trigger a notification (email/socket) to the other party (implementation dependent).

### 5. Update Ticket Status
- **Route:** `PATCH /support/:id/status`
- **Request Body:**
    ```json
    {
      "status": "RESOLVED" // OPEN, IN_PROGRESS, AWAITING_REPLY, RESOLVED, CLOSED
    }
    ```

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

---


## 🌍 Region, Country & Exclusion Access Control

This module restricts Agents to viewing only Universities and Courses based on their location permissions and specific blacklists.

### A. Logic Hierarchy (Priority Order)

**Permission Check (Can I see this region?):**
- If Agent is assigned Region: Europe, they can see universities in Germany, France, etc.
- If Agent is assigned Country: India, they can only see universities in India.

**Exclusion Check (Am I blocked?):**
- Even if an Agent has permission for a region, if their specific Country is listed in the `excluded_countries` array of a University or Course, that item is hidden.

### B. Get Universities (Restricted)
-   **Route:** `GET /universities`
-   **Response Behavior:**
    -   **Admin:** Sees all universities.
    -   **Agent:** Filters by Agent's Region/Country AND excludes universities where `excluded_countries` contains Agent's Country.

### C. Get Courses (Restricted)
-   **Route:** `GET /courses`
-   **Response Behavior:**
    -   Filters by Agent's Region/Country.
    -   Excludes courses where `excluded_countries` (on the Course OR the University) contains Agent's Country.

**Example:** An Agent from India searches for courses.
- University A (Global) → Visible.
- University B (Global) → Visible.
- Course 1 (MBBS) with `excluded_countries: ["India"]` → Hidden.
- Course 2 (BBA) with `excluded_countries: []` → Visible.
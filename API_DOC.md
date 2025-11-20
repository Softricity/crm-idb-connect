# API Documentation

This document provides a complete reference for all the APIs available in the backend application.

---

## ⚡ General Information

### Authentication
Most endpoints are protected by **JWT Authentication**.
-   **Public Endpoints:** `POST /auth/login` and `POST /leads`.
-   **Protected Endpoints:** Require a valid Bearer Token in the Authorization header: `Authorization: Bearer <access_token>`.
-   **Role Based Access Control (RBAC):** Endpoints verify if the user has the required role (`admin`, `counsellor`, `agent`).

### Base URL
All routes are relative to the NestJS server URL (e.g., `http://localhost:3000`).

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
-   **Returns:** Includes both the token and the user's profile info.
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1Ni...",
      "partner": {
        "id": "uuid",
        "name": "Admin User",
        "role": "admin",
        "email": "admin@example.com"
      }
    }
    ```

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
-   **Description:** Retrieves all leads, ordered by newest first. Includes `assigned_partner` object (name, email).

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
      "agency_name": "Smith Agencies" // Optional
    }
    ```
-   **Returns:** Created partner object (excluding password), including the `role` object.
-   **Errors:** - `400 Bad Request`: Invalid Role ID.
    - `409 Conflict`: Email or mobile already exists.

### Get All Partners
-   **Route:** `GET /partners`
-   **Query Params:** `?role=agent` or `?role=counsellor` (Filters by Role Name)
-   **Authentication:** **JWT Required**
-   **Returns:** Array of partner objects with nested role details.
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
-   **Description:** Updates study abroad preferences and financial info.
-   **Request Body:**
    ```json
    {
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

## 📊 Dashboard API

### Get Dashboard Stats
-   **Route:** `GET /dashboard/stats`
-   **Authentication:** **JWT Required (Admin, Counsellor)**
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
      "logo": "[https://example.com/logo.png](https://example.com/logo.png)"
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
      "city": "Espoo",
      "logo": "https://new-logo-url.com"
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
      "description": "Comprehensive CS program..."
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
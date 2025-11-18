# Permissions Module API Documentation

## Overview
The Permissions module provides a complete RBAC (Role-Based Access Control) system with support for:
- **Permissions**: Individual access rights
- **Permission Groups**: Logical grouping of permissions
- **Roles**: Collections of permissions assigned to users
- **Role Permissions**: Many-to-many relationships between roles and permissions

All endpoints require JWT authentication. Admin-only endpoints are marked with 🔒.

---

## Permissions Endpoints

### Create Permission 🔒
**POST** `/permissions`

Create a new permission.

**Request Body:**
```json
{
  "name": "string (required)",
  "permission_group_id": "uuid (optional)"
}
```

**Response:** Permission object with group details

---

### Get All Permissions
**GET** `/permissions`

Retrieve all permissions with their groups and assigned roles.

**Access:** Admin, Counsellor

**Response:** Array of permission objects

---

### Get Permission by ID
**GET** `/permissions/:id`

Get a specific permission by UUID.

**Access:** Admin, Counsellor

**Response:** Permission object with group and role assignments

---

### Update Permission 🔒
**PATCH** `/permissions/:id`

Update permission details.

**Request Body:**
```json
{
  "name": "string (optional)",
  "permission_group_id": "uuid (optional)"
}
```

**Response:** Updated permission object

---

### Delete Permission 🔒
**DELETE** `/permissions/:id`

Delete a permission by UUID.

**Response:** Deleted permission object

---

## Permission Groups Endpoints

### Create Permission Group 🔒
**POST** `/permission-groups`

Create a new permission group.

**Request Body:**
```json
{
  "name": "string (required)"
}
```

**Response:** Permission group object

---

### Get All Permission Groups
**GET** `/permission-groups`

Retrieve all permission groups with their permissions.

**Access:** Admin, Counsellor

**Response:** Array of permission group objects

---

### Get Permission Group by ID
**GET** `/permission-groups/:id`

Get a specific permission group by UUID.

**Access:** Admin, Counsellor

**Response:** Permission group object with permissions

---

### Update Permission Group 🔒
**PATCH** `/permission-groups/:id`

Update permission group name.

**Request Body:**
```json
{
  "name": "string (optional)"
}
```

**Response:** Updated permission group object

---

### Delete Permission Group 🔒
**DELETE** `/permission-groups/:id`

Delete a permission group by UUID.

**Response:** Deleted permission group object

---

## Roles Endpoints

### Create Role 🔒
**POST** `/roles`

Create a new role.

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)"
}
```

**Response:** Role object with permissions

---

### Get All Roles
**GET** `/roles`

Retrieve all roles with their assigned permissions.

**Access:** Admin, Counsellor

**Response:** Array of role objects

---

### Get Role by ID
**GET** `/roles/:id`

Get a specific role by UUID.

**Access:** Admin, Counsellor

**Response:** Role object with permissions

---

### Update Role 🔒
**PATCH** `/roles/:id`

Update role details.

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)"
}
```

**Response:** Updated role object

---

### Delete Role 🔒
**DELETE** `/roles/:id`

Delete a role by UUID. This will cascade delete all role_permission associations.

**Response:** Deleted role object

---

## Role Permissions Endpoints

### Assign Permissions to Role 🔒
**POST** `/roles/assign-permissions`

Assign multiple permissions to a role. This replaces all existing permissions for the role.

**Request Body:**
```json
{
  "role_id": "uuid (required)",
  "permission_ids": ["uuid", "uuid", ...] (required)
}
```

**Response:** Updated role object with new permissions

---

### Get Role Permissions
**GET** `/roles/:id/permissions`

Get all permissions assigned to a specific role.

**Access:** Admin, Counsellor

**Response:** Role object with permissions

---

### Remove Permission from Role 🔒
**DELETE** `/roles/:roleId/permissions/:permissionId`

Remove a specific permission from a role.

**Response:** Deleted role_permission object

---

## Database Schema

### permission
- `id`: UUID (primary key)
- `name`: String (unique)
- `permission_group_id`: UUID (foreign key, optional)

### permission_group
- `id`: UUID (primary key)
- `name`: String (unique)

### role
- `id`: UUID (primary key)
- `name`: String (unique)
- `description`: String (optional)

### role_permission
- `role_id`: UUID (primary key, foreign key)
- `permission_id`: UUID (primary key, foreign key)
- Composite primary key on (role_id, permission_id)

---

## Error Responses

### 404 Not Found
Resource not found by ID.

### 409 Conflict
Unique constraint violation (duplicate name).

### 401 Unauthorized
Missing or invalid JWT token.

### 403 Forbidden
Insufficient permissions for the operation.

---

## Usage Examples

### Create a complete permission structure:

1. **Create a permission group:**
```bash
POST /permission-groups
{
  "name": "Lead Management"
}
```

2. **Create permissions in that group:**
```bash
POST /permissions
{
  "name": "lead.create",
  "permission_group_id": "<group_id>"
}
```

3. **Create a role:**
```bash
POST /roles
{
  "name": "Sales Manager",
  "description": "Can manage all lead operations"
}
```

4. **Assign permissions to role:**
```bash
POST /roles/assign-permissions
{
  "role_id": "<role_id>",
  "permission_ids": ["<perm_id_1>", "<perm_id_2>", ...]
}
```

---

## Notes

- All UUIDs are generated using PostgreSQL's `gen_random_uuid()`
- Deleting a permission group does NOT cascade delete permissions (they become unassigned)
- Deleting a role DOES cascade delete all role_permission associations
- Permission and role names must be unique across the system
- The service uses Prisma ORM for database operations

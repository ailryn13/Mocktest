import { apiFetch } from "./api";

export interface Department {
  id: number;
  name: string;
  address: string;
  code: string;
  isActive: boolean;
  adminName: string;
  adminEmail: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description: string;
  address: string;
  code: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export async function getDepartments(): Promise<Department[]> {
  return apiFetch<Department[]>("/super-admin/departments");
}

export async function createDepartment(data: CreateDepartmentRequest): Promise<Department> {
  return apiFetch<Department>("/super-admin/departments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDepartment(id: number, data: Partial<CreateDepartmentRequest>): Promise<Department> {
  return apiFetch<Department>(`/super-admin/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteDepartment(id: number): Promise<void> {
  return apiFetch<void>(`/super-admin/departments/${id}`, {
    method: "DELETE",
  });
}

export async function toggleDepartmentStatus(id: number, isActive: boolean): Promise<Department> {
  return apiFetch<Department>(`/super-admin/departments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

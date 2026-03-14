import { apiFetch } from "./api";

export interface Department {
  id: number;
  name: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description: string;
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  password?: string;
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

export async function createDepartmentAdmin(departmentId: number, data: CreateAdminRequest): Promise<any> {
    return apiFetch<any>(`/super-admin/departments/${departmentId}/admins`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

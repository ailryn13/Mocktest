import { apiFetch } from "./api";

export interface Department {
  id: number;
  name: string;
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

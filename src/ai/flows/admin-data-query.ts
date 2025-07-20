'use server';
/**
 * @fileOverview A client-facing server action to help admins query system data.
 *
 * - adminDataQuery - A function that answers questions about system metrics.
 * - AdminDataQueryInput - The input type for the adminDataQuery function.
 * - AdminDataQueryOutput - The return type for the adminDataQuery function.
 */
import {
  adminDataQueryFlow,
  AdminDataQueryInput,
  AdminDataQueryOutput,
} from './lib/admin-data-query-flow';

export type { AdminDataQueryInput, AdminDataQueryOutput };

export async function adminDataQuery(
  input: AdminDataQueryInput
): Promise<AdminDataQueryOutput> {
  return adminDataQueryFlow(input);
}

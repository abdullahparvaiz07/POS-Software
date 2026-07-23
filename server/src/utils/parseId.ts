import { BadRequestError } from "../errors";

export function parseId(idParam: any): number {
  if (!idParam) throw new BadRequestError("Invalid ID provided.");
  const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
  const id = Number(idStr);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError("Invalid ID provided.");
  }
  return id;
}

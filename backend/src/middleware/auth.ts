import { NextFunction, Request, Response } from "express";
import { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseClient } from "../lib/supabase";
import { AppRole, isAppRole } from "../lib/roles";

export interface AuthRequest extends Request {
  userId?: string;
  accessToken?: string;
  supabase?: SupabaseClient;
  requestedRole?: AppRole;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  const supabase = createSupabaseClient(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Unauthorized - invalid token" });
  }

  req.userId = user.id;
  req.accessToken = token;
  req.supabase = supabase;
  req.requestedRole = isAppRole(req.headers["x-agrilink-role"])
    ? req.headers["x-agrilink-role"]
    : undefined;
  next();
}

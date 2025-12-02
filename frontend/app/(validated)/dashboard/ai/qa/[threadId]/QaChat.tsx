"use client";

import { useMemo, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {} from "./actions";
import {} from "@/lib/ai-chat-message";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type QaChatProps = {
  threadId: string;
  workspaceId: string;
  workspaceName: string;
  history: object[];
};

export default function QaChat({ threadId, workspaceId, workspaceName }: QaChatProps) {
  return <>{/* You wil ltake in  */}</>;
}

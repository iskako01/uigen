"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  state: string;
  args: Record<string, unknown>;
}

function getFilename(path: unknown): string {
  if (typeof path !== "string" || !path) return "";
  return path.split("/").pop() ?? path;
}

export function getToolLabel(tool: ToolInvocation): string {
  const { toolName, args } = tool;

  if (toolName === "str_replace_editor") {
    const filename = getFilename(args.path);
    switch (args.command) {
      case "create":    return `Creating ${filename}`;
      case "str_replace":
      case "insert":    return `Editing ${filename}`;
      case "view":      return `Reading ${filename}`;
      case "undo_edit": return `Undoing edit in ${filename}`;
      default:          return `Editing ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    const filename = getFilename(args.path);
    switch (args.command) {
      case "rename": return `Renaming ${filename} to ${getFilename(args.new_path)}`;
      case "delete": return `Deleting ${filename}`;
      default:       return toolName;
    }
  }

  return toolName;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const isDone = toolInvocation.state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" aria-label="loading" />
      )}
      <span className="text-neutral-700">{getToolLabel(toolInvocation)}</span>
    </div>
  );
}

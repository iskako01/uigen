import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getToolLabel } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

test("getToolLabel: str_replace_editor create", () => {
  expect(getToolLabel({ toolName: "str_replace_editor", state: "call", args: { command: "create", path: "src/Card.jsx" } }))
    .toBe("Creating Card.jsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  expect(getToolLabel({ toolName: "str_replace_editor", state: "call", args: { command: "str_replace", path: "src/App.jsx" } }))
    .toBe("Editing App.jsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  expect(getToolLabel({ toolName: "str_replace_editor", state: "call", args: { command: "insert", path: "src/App.jsx" } }))
    .toBe("Editing App.jsx");
});

test("getToolLabel: str_replace_editor view", () => {
  expect(getToolLabel({ toolName: "str_replace_editor", state: "call", args: { command: "view", path: "src/index.js" } }))
    .toBe("Reading index.js");
});

test("getToolLabel: str_replace_editor undo_edit", () => {
  expect(getToolLabel({ toolName: "str_replace_editor", state: "call", args: { command: "undo_edit", path: "src/utils.ts" } }))
    .toBe("Undoing edit in utils.ts");
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel({ toolName: "file_manager", state: "call", args: { command: "rename", path: "src/Old.jsx", new_path: "src/New.jsx" } }))
    .toBe("Renaming Old.jsx to New.jsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel({ toolName: "file_manager", state: "call", args: { command: "delete", path: "src/Unused.jsx" } }))
    .toBe("Deleting Unused.jsx");
});

test("getToolLabel: unknown tool falls back to tool name", () => {
  expect(getToolLabel({ toolName: "some_other_tool", state: "call", args: {} }))
    .toBe("some_other_tool");
});

test("getToolLabel: uses only the filename, not the full path", () => {
  expect(getToolLabel({ toolName: "str_replace_editor", state: "call", args: { command: "create", path: "very/deep/nested/Button.tsx" } }))
    .toBe("Creating Button.tsx");
});

// --- ToolCallBadge rendering tests ---

test("ToolCallBadge shows label for create command", () => {
  render(<ToolCallBadge toolInvocation={{ toolName: "str_replace_editor", state: "call", args: { command: "create", path: "src/Card.jsx" } }} />);
  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
});

test("ToolCallBadge shows label for str_replace command", () => {
  render(<ToolCallBadge toolInvocation={{ toolName: "str_replace_editor", state: "result", args: { command: "str_replace", path: "src/App.jsx" } }} />);
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

test("ToolCallBadge shows spinner when not done", () => {
  render(<ToolCallBadge toolInvocation={{ toolName: "str_replace_editor", state: "call", args: { command: "create", path: "src/Card.jsx" } }} />);
  expect(screen.getByLabelText("loading")).toBeDefined();
});

test("ToolCallBadge shows green dot when done", () => {
  const { container } = render(<ToolCallBadge toolInvocation={{ toolName: "str_replace_editor", state: "result", args: { command: "create", path: "src/Card.jsx" } }} />);
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("ToolCallBadge does not show spinner when done", () => {
  render(<ToolCallBadge toolInvocation={{ toolName: "str_replace_editor", state: "result", args: { command: "create", path: "src/Card.jsx" } }} />);
  expect(screen.queryByLabelText("loading")).toBeNull();
});

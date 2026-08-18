import {describe, expect, it, vi} from "vitest";
import {runTasksDirectly} from "./runCommand.js";

describe("runTasksDirectly", () => {
  it("runs enabled tasks sequentially without a task renderer", async () => {
    const calls = [];
    const first = vi.fn(async () => calls.push("first"));
    const second = vi.fn(async () => calls.push("second"));

    await runTasksDirectly([{task: first}, {enabled: () => false, task: vi.fn()}, {skip: () => true, task: vi.fn()}, {task: second}], {
      name: "context"
    });

    expect(calls).toEqual(["first", "second"]);
    expect(first).toHaveBeenCalledWith({name: "context"});
    expect(second).toHaveBeenCalledWith({name: "context"});
  });
});

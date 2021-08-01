import { NotFoundError } from "isomorphic-fs";
import { WebFileSystem } from "../fs/WebFileSystem";

const fs = new WebFileSystem("/isomorphic-fs-test", 50 * 1024 * 1024);

describe("basic", () => {
  it("rootdir", async () => {
    const stat = await fs.head("/");
    expect(stat.size).toBeUndefined();
  });

  it("nothing", async () => {
    try {
      await fs.stat("/nothing");
      fail("/nothing exists");
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundError);
    }
  });

  it("file", async () => {
    await fs.writeAll("/file", Buffer.alloc(1, 0).buffer);
    const stat = await fs.stat("/file");
    expect(stat.size).toBe(1);
  });
});

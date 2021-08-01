import { NotFoundError, NotReadableError } from "isomorphic-fs";
import { WebFileSystem } from "../fs/WebFileSystem";

const fs = new WebFileSystem("/isomorphic-fs-test", 50 * 1024 * 1024);

describe("basic", () => {
  it("rootdir", async () => {
    const list = await fs.list("/");
    expect(list.length).toBe(0);
  });

  it("nothing", async () => {
    try {
      await fs.list("/nothing");
      fail("/nothing exists");
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundError);
    }
  });

  it("file", async () => {
    await fs.writeAll("/file", Buffer.alloc(1, 0).buffer);
    try {
      await fs.list("/file");
      fail("/nothing exists");
    } catch (e) {
      expect(e).toBeInstanceOf(NotReadableError);
    }
  });
});

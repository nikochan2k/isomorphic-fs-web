import {
  AbstractFile,
  AbstractReadStream,
  AbstractWriteStream,
  OpenOptions,
  util,
} from "isomorphic-fs";
import { convertError, WebFileSystem } from "./WebFileSystem";

export class WebFile extends AbstractFile {
  constructor(private wfs: WebFileSystem, path: string) {
    super(wfs, path);
  }

  public _createReadStream(options: OpenOptions): Promise<AbstractReadStream> {
    throw new Error("Method not implemented.");
  }

  public _createWriteStream(
    options: OpenOptions
  ): Promise<AbstractWriteStream> {
    throw new Error("Method not implemented.");
  }

  public _rm(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const fullPath = util.joinPaths(this.fs.repository, this.path);
      this.wfs.fs.root.getFile(
        fullPath,
        { create: false },
        (entry) =>
          entry.remove(resolve, (err) =>
            reject(convertError(this.fs.repository, this.path, err))
          ),
        (err) => reject(convertError(this.fs.repository, this.path, err))
      );
    });
  }
}

import {
  AbstractFile,
  AbstractReadStream,
  AbstractWriteStream,
  OpenOptions,
  util,
} from "isomorphic-fs";
import { convertError, WebFileSystem } from "./WebFileSystem";

export class WebFile extends AbstractFile {
  private file?: File;

  constructor(public wfs: WebFileSystem, path: string) {
    super(wfs, path);
  }

  public _close() {
    this.file = undefined;
  }

  public _createReadStream(options: OpenOptions): Promise<AbstractReadStream> {
    throw new Error("Method not implemented.");
  }

  public _createWriteStream(
    options: OpenOptions
  ): Promise<AbstractWriteStream> {
    throw new Error("Method not implemented.");
  }

  public _open(): Promise<File> {
    return new Promise<File>(async (resolve, reject) => {
      if (this.file) {
        resolve(this.file);
        return;
      }
      const handle = (err: FileError) =>
        reject(convertError(this.fs.repository, this.path, err));
      const fullPath = util.joinPaths(this.fs.repository, this.path);
      const fs = await this.wfs._getFS();
      fs.root.getFile(
        fullPath,
        { create: false },
        (entry) => {
          entry.file((file) => {
            this.file = file;
            resolve(this.file);
          }, handle);
        },
        handle
      );
    });
  }

  public _rm(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const fullPath = util.joinPaths(this.fs.repository, this.path);
      const fs = await this.wfs._getFS();
      fs.root.getFile(
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

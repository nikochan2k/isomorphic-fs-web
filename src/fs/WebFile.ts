import {
  AbstractFile,
  AbstractReadStream,
  AbstractWriteStream,
  OpenOptions,
  OpenWriteOptions,
  util,
} from "isomorphic-fs";
import { convertError, WebFileSystem } from "./WebFileSystem";
import { WebReadStream } from "./WebReadStream";
import { WebWriteStream } from "./WebWriteStream";

export class WebFile extends AbstractFile {
  constructor(public wfs: WebFileSystem, path: string) {
    super(wfs, path);
  }

  public async _createReadStream(
    options: OpenOptions
  ): Promise<AbstractReadStream> {
    return new WebReadStream(this, options);
  }

  public async _createWriteStream(
    options: OpenWriteOptions
  ): Promise<AbstractWriteStream> {
    return new WebWriteStream(this, options);
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

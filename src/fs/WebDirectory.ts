import { AbstractDirectory, util } from "isomorphic-fs";
import { convertError, WebFileSystem } from "./WebFileSystem";

export class WebDirectory extends AbstractDirectory {
  constructor(private wfs: WebFileSystem, path: string) {
    super(wfs, path);
  }

  public _list(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const fullPath = util.joinPaths(this.fs.repository, this.path);
      this.wfs.fs.root.getDirectory(
        fullPath,
        { create: true },
        (directory) => {
          const reader = directory.createReader();
          reader.readEntries(
            (entries) => {
              const list: string[] = [];
              const from = this.fs.repository.length;
              for (const entry of entries) {
                list.push(entry.fullPath.substr(from));
              }
              resolve(list);
            },
            (err) => reject(convertError(this.fs.repository, this.path, err))
          );
        },
        (err) => reject(convertError(this.fs.repository, this.path, err))
      );
    });
  }

  public _mkcol(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const fullPath = util.joinPaths(this.fs.repository, this.path);
      this.wfs.fs.root.getDirectory(
        fullPath,
        { create: true },
        () => resolve,
        (err) => reject(convertError(this.fs.repository, this.path, err))
      );
    });
  }

  public _rmdir(): Promise<void> {
    return this._rd(false);
  }

  public _rmdirRecursively(): Promise<void> {
    return this._rd(true);
  }

  private _rd(recursive: boolean): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const fullPath = util.joinPaths(this.fs.repository, this.path);
      this.wfs.fs.root.getDirectory(
        fullPath,
        { create: false },
        (entry) => {
          const handle = (err: FileError) =>
            reject(convertError(this.fs.repository, this.path, err));
          if (recursive) {
            entry.removeRecursively(resolve, handle);
          } else {
            entry.remove(resolve, handle);
          }
        },
        (err) => reject(convertError(this.fs.repository, this.path, err))
      );
    });
  }
}

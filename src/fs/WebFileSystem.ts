import {
  AbortError,
  AbstractFileSystem,
  Directory,
  EncodingError,
  File,
  FileSystemOptions,
  HeadOptions,
  InvalidStateError,
  NoModificationAllowedError,
  NotFoundError,
  NotReadableError,
  NotSupportedError,
  PatchOptions,
  PathExistsError,
  Props,
  QuotaExceededError,
  SecurityError,
  Stats,
  SyntaxError,
  TypeMismatchError,
  URLType,
  util,
} from "isomorphic-fs";
import { WebDirectory } from "./WebDirectory";
import { WebFile } from "./WebFile";

export function convertError(repository: string, path: string, err: FileError) {
  switch (err.code) {
    case FileError.NOT_FOUND_ERR:
      throw new NotFoundError(repository, path, err);
    case FileError.SECURITY_ERR:
      throw new SecurityError(repository, path, err);
    case FileError.ABORT_ERR:
      throw new AbortError(repository, path, err);
    case FileError.NOT_READABLE_ERR:
      throw new NotReadableError(repository, path, err);
    case FileError.ENCODING_ERR:
      throw new EncodingError(repository, path, err);
    case FileError.NO_MODIFICATION_ALLOWED_ERR:
      throw new NoModificationAllowedError(repository, path, err);
    case FileError.INVALID_STATE_ERR:
      throw new InvalidStateError(repository, path, err);
    case FileError.SYNTAX_ERR:
      throw new SyntaxError(repository, path, err);
    case FileError.INVALID_MODIFICATION_ERR:
      throw new InvalidStateError(repository, path, err);
    case FileError.QUOTA_EXCEEDED_ERR:
      throw new QuotaExceededError(repository, path, err);
    case FileError.TYPE_MISMATCH_ERR:
      throw new TypeMismatchError(repository, path, err);
    case FileError.PATH_EXISTS_ERR:
      throw new PathExistsError(repository, path, err);
    default:
      throw new NotSupportedError(repository, path, err);
  }
}

export class WebFileSystem extends AbstractFileSystem {
  private fs?: FileSystem;
  private rootDir: string;

  constructor(
    rootDir: string,
    private size: number,
    options?: FileSystemOptions
  ) {
    super(util.normalizePath(rootDir), options);
    this.rootDir = this.repository;
  }

  public async _getFS() {
    if (this.fs) {
      return this.fs;
    }
    this.fs = await new Promise<FileSystem>((resolve, reject) => {
      window.requestFileSystem(
        window.PERSISTENT,
        this.size,
        (fs) => resolve(fs),
        (err) => reject(err)
      );
    });
    return this.fs;
  }

  public _head(path: string, _options: HeadOptions): Promise<Stats> {
    return new Promise<Stats>(async (resolve, reject) => {
      const entry = await this.getEntry(path);
      entry.getMetadata(
        (metadata) =>
          resolve({
            modified: metadata.modificationTime.getTime(),
            size: metadata.size,
          }),
        (err) => reject(convertError(this.repository, path, err))
      );
    });
  }

  public _patch(
    _path: string,
    _props: Props,
    _options: PatchOptions
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async getDirectory(path: string): Promise<Directory> {
    return new WebDirectory(this, path);
  }

  public async getFile(path: string): Promise<File> {
    return new WebFile(this, path);
  }

  public async toURL(path: string, urlType: URLType = "GET"): Promise<string> {
    if (urlType !== "GET") {
      throw new NotSupportedError(
        this.repository,
        path,
        `"${urlType}" is not supported`
      );
    }
    const entry = await this.getEntry(path);
    return entry.toURL();
  }

  private async getEntry(path: string) {
    const fs = await this._getFS();
    const fullPath = util.joinPaths(this.rootDir, path);
    return new Promise<FileEntry | DirectoryEntry>((resolve, reject) => {
      let rejected: FileError;
      const handle = (err: FileError) => {
        if (rejected) reject(convertError(this.repository, path, rejected));
        rejected = err;
      };
      fs.root.getFile(fullPath, { create: false }, resolve, handle);
      fs.root.getDirectory(fullPath, { create: false }, resolve, handle);
    });
  }
}

// Just enough of the GitHub REST API to read guest files and land one commit
// on a branch. fetch is injected so tests never touch the network.
export class GitHubError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
  }
}

export interface CommitFile {
  path: string;
  content: string | Uint8Array;
}

export interface GitHub {
  /** The branch's current commit sha. */
  head(): Promise<string>;
  /** File text at that commit. */
  readFile(path: string, sha: string): Promise<string>;
  /** File names in a folder at that commit, [] if the folder doesn't exist. */
  listDir(path: string, sha: string): Promise<string[]>;
  /** One commit on top of `parent`. Fails (422) if the branch moved. */
  commit(parent: string, files: CommitFile[], message: string): Promise<string>;
}

const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

function base64(content: string | Uint8Array): string {
  return Buffer.from(typeof content === "string" ? new TextEncoder().encode(content) : content).toString("base64");
}

export function gitHub(deps: { token: string; repo: string; branch: string; fetch?: typeof fetch }): GitHub {
  const doFetch = deps.fetch ?? fetch;
  const api = `https://api.github.com/repos/${deps.repo}`;
  const branch = encodePath(deps.branch);

  async function call(method: string, path: string, body?: unknown, accept = "application/vnd.github+json"): Promise<Response> {
    const response = await doFetch(`${api}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${deps.token}`,
        accept,
        "x-github-api-version": "2022-11-28",
        "user-agent": "townergodpawrents-admin",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      throw new GitHubError(response.status, `${method} ${path}: ${response.status} ${await response.text().catch(() => "")}`.trim());
    }
    return response;
  }

  const send = async <T>(method: string, path: string, body?: unknown): Promise<T> =>
    (await call(method, path, body)).json() as Promise<T>;

  return {
    async head() {
      return (await send<{ object: { sha: string } }>("GET", `/git/ref/heads/${branch}`)).object.sha;
    },

    async readFile(path, sha) {
      return (await call("GET", `/contents/${encodePath(path)}?ref=${sha}`, undefined, "application/vnd.github.raw+json")).text();
    },

    async listDir(path, sha) {
      try {
        const items = await send<{ name: string }[]>("GET", `/contents/${encodePath(path)}?ref=${sha}`);
        return Array.isArray(items) ? items.map((item) => item.name) : [];
      } catch (error) {
        if (error instanceof GitHubError && error.status === 404) return [];
        throw error;
      }
    },

    async commit(parent, files, message) {
      const { tree } = await send<{ tree: { sha: string } }>("GET", `/git/commits/${parent}`);
      const blobs = await Promise.all(
        files.map((file) => send<{ sha: string }>("POST", "/git/blobs", { content: base64(file.content), encoding: "base64" })),
      );
      const newTree = await send<{ sha: string }>("POST", "/git/trees", {
        base_tree: tree.sha,
        tree: files.map((file, i) => ({ path: file.path, mode: "100644", type: "blob", sha: blobs[i].sha })),
      });
      const commit = await send<{ sha: string }>("POST", "/git/commits", { message, tree: newTree.sha, parents: [parent] });
      await send("PATCH", `/git/refs/heads/${branch}`, { sha: commit.sha, force: false });
      return commit.sha;
    },
  };
}

# ADR 0011: An entry can mix prints and one clip

An entry may contain up to four media items in total, with at most one clip, in the order they are written. This supersedes [ADR 0003](0003-print-clip-exclusive.md): the dimensions sidecar from `prep-video.sh` now gives each clip its own aspect ratio at build time, removing the fixed-16:9 sizing problem that kept prints and clips apart.

The diary page and homepage teaser use the existing print grid for mixed entries. A clip plays inline with native controls on a level cream mat; photos keep their tilt and tap-to-zoom. Any card containing a clip stays level to avoid video flicker, and a mixed entry's caption goes on a slip beneath the grid.

Mixing is available only for entries filed by an agent. `/admin` still accepts up to four photos or one video, because photos commit through the GitHub API while video uses Blob storage and the `admin-video.yml` Action. Combining those posting pipelines is outside this change.

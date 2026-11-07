# ADR 0011: An entry can mix prints and one clip

An entry may contain up to four media items in total, with at most one clip, in the order they are written. This supersedes [ADR 0003](0003-print-clip-exclusive.md): the dimensions sidecar from `prep-video.sh` now gives each clip its own aspect ratio at build time, removing the fixed-16:9 sizing problem that kept prints and clips apart.

The diary page and homepage teaser use the existing print grid for mixed entries. A clip uses native controls on a level cream mat (on iPhone it opens fullscreen, as before); photos keep their tilt and tap-to-zoom. Any card containing a clip stays level to avoid video flicker, and a mixed entry's caption goes on a slip beneath the grid.

`/admin` can post a mix too: up to four items, at most one video, in the order they were added. A post with no video still commits straight through the GitHub API. A post with a video goes entirely through the `admin-video.yml` Action: the server uploads its photos to Blob beside the clip, writes their alt text, and dispatches an ordered `media` list, so the whole entry lands in one commit a few minutes later. Rearranging items before posting is left for later.

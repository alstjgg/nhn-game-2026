# Request-first evaluation fixture

`soso-last-note-full.jpg` is the fixed image used by the request-first v2 API
baseline. It was drawn with the demo's browser canvas and then cropped from the
visible canvas, so it exercises the same kind of input a player submits.

The image is reused unchanged for all three live runs. Evaluation artifacts
record its MIME type, dimensions and SHA-256 hash, but never duplicate the
image as a base64 request body.

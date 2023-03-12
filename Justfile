_default:
    @just --list

serve:
    #!/bin/bash
    SERVE_DIR=`cat default_serve.txt`
    live-server --port=8765 --no-browser --open=$SERVE_DIR --watch="$SERVE_DIR/*"

# serve-dir DIR:

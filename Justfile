_default:
    @just --list

serve:
    #!/bin/bash
    SERVE_DIR=`cat default_serve.txt`
    echo Will try to serve $SERVE_DIR
    live-server --port=8765 --no-browser --open="$SERVE_DIR" --watch="$SERVE_DIR/*"
    echo default_serve.txt method doesn't seem to work, but you can navigate
    echo to the desired directory to launch an 'app'.

# serve-dir DIR:

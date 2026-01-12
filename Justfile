# Default task - show help
default:
    @just --list

# Install dependencies (Node.js)
install:
    npm install

# Run with Tokyo Station coordinates (example) - Deno
run-tokyo-deno:
    deno run --allow-net main.ts 139.7671 35.6812

# Run with Tokyo Station coordinates (example) - Node.js
run-tokyo:
    node main.mjs 139.7671 35.6812

# Run with Tokyo Station at zoom 15
run-tokyo-z15:
    node main.mjs 139.7671 35.6812 15

# Run with Shibuya coordinates
run-shibuya:
    node main.mjs 139.7016 35.6598

# Run with custom coordinates
run lon lat zoom="14":
    node main.mjs {{lon}} {{lat}} {{zoom}}

# Run with New York coordinates (Times Square)
run-ny:
    node main.mjs -73.9855 40.7580

# Run with London coordinates (Big Ben)
run-london:
    node main.mjs -0.1246 51.5007

# Run and save output to file
run-save lon lat zoom="14" output="output.md":
    node main.mjs {{lon}} {{lat}} {{zoom}} > {{output}}

# Format code (Deno)
fmt:
    deno fmt

# Check code (Deno)
check:
    deno check main.ts

# Cache dependencies (Deno)
cache:
    deno cache main.ts

# Show help
help:
    @echo "loc2ssd - Location to Subjective Spatial Description"
    @echo ""
    @echo "Usage examples:"
    @echo "  just install            # Install Node.js dependencies"
    @echo "  just run-tokyo          # Run with Tokyo Station (Node.js)"
    @echo "  just run 139.77 35.68   # Run with custom coordinates"
    @echo "  just run-save 139.77 35.68 14 output.md  # Save to file"

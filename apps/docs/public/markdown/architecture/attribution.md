# Attribution and provenance

HIG code: MIT. @radix-ui/react-dialog, dropdown-menu, popover, tooltip: MIT, consumed as dependencies without copied engine code. @bloxwap/chart/sfx/haptic: independent upstream packages; optional integration only (chart through the separate `@bloxwap/hig-chart` adapter). @bloxwap/font: OFL-1.1, binaries stay in its pinned package. Brand SVG/geometry derives from Font docs, exact upstream commit in `evidence/upstream-inventory.json`; do not imply arbitrary trademark relicensing. Utility CheckIcon is original simple geometry. Full icons catalogs are excluded.

## Generated favicon and social preview

`npm run generate` derives unchanged SVG favicons and a 1200×630 SVG social preview from the approved mark. Source SHA256 and derivative paths are in `planning/brand-artifacts.json`; lint rejects stale outputs. The derived preview declares its lineage and omits the source credential metadata; unchanged source/favicons retain it. Hosts whose social crawlers require raster images must render a PNG from this same SVG instead of redrawing the mark. This preview uses a generic font rather than embedding the full font asset.

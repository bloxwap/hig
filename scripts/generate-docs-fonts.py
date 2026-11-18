"""Regenerate the checked-in docs fonts with uv run --script scripts/generate-docs-fonts.py."""
# /// script
# dependencies = ["fonttools[woff]==4.61.1", "brotli==1.2.1"]
# ///
from hashlib import sha256
from pathlib import Path
from shutil import copyfile
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
source = root / "node_modules/@bloxwap/font/fonts"
output = root / "apps/docs/fonts"
output.mkdir(exist_ok=True)
# Keep this set aligned with the common-face unicode-range in src/fonts.css.
common = set(range(0x20, 0x7f)) | {
    0xa0, 0xa3, 0xb7, 0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d,
    0x2026, 0x20ac, 0x2192, 0x2197,
}
hashes = {
    "Sans": "96f6be58023b1d22152c797336282a4330a47ab4a3c0ab87451be887903746b7",
    "Mono": "fa66e41575807c3d260d8f5b493be349cac127836b0174976c7d4876237d2632",
}
for kind, expected in hashes.items():
    family = f"Bloxwap{kind}"
    path = source / family / f"{family}-Variable.woff2"
    if sha256(path.read_bytes()).hexdigest() != expected:
        raise ValueError(f"Unexpected upstream face: {path}")
    for portion in ["common", "extended"]:
        font = TTFont(path, recalcTimestamp=False)
        chars = set(font.getBestCmap())
        keep = chars & common if portion == "common" else chars - common
        options = subset.Options()
        options.layout_features += ["tnum", "zero", "frac", "numr", "dnom", "ordn",
                                    "sups", "subs", "pnum", "lnum", "onum"]
        builder = subset.Subsetter(options=options)
        builder.populate(unicodes=keep)
        builder.subset(font)
        # The upstream OFL reserves the original family name for unmodified faces.
        for entry in font["name"].names:
            if entry.nameID in {1, 3, 4, 6, 16, 21, 25} or entry.nameID > 255:
                text = entry.toUnicode().replace("Bloxwap", "HIG Docs")
                if entry.nameID in {3, 6, 25}:
                    text = text.replace(" ", "")
                entry.string = text.encode(entry.getEncoding())
        dest = output / f"docs-{kind.lower()}-{portion}.woff2"
        font.save(dest)
        with TTFont(dest) as saved:
            assert set(saved.getBestCmap()) == keep
            assert [(axis.axisTag, axis.minValue, axis.maxValue) for axis in saved["fvar"].axes] == [("wght", 100, 900)]
license_path = root / "apps/docs/public/fonts/LICENSE.txt"
license_path.parent.mkdir(exist_ok=True)
copyfile(source / "BloxwapSans/LICENSE", license_path)

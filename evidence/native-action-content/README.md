# Native host action anatomy and links

Native Button now supports direct custom child layout while keeping its root guard/ref/feedback contract. Native Link keeps link semantics and delegates once to a host navigation callback, retaining the Linking default when omitted. Four Chromium/WebKit cases verify layout, focus, one navigation, disabled/busy state and axe at 390/1280 widths.

[Report](report.json) records exact source fingerprints and passing checks. Native Button adds 33 gzip bytes against c32; a standalone native Link is 1,662 bytes below the unchanged 2,200 native-control cap. Pure forwardRef annotations allow either export to be tree shaken independently. No physical observations, publication or owner approval are claimed.

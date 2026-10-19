# Native switch row adoption

`SwitchRow` is an optional named export from `@bloxwap/hig-native/switch` and `selection`. Hosts keep their visible label, description and decorative track inside one HIG switch owner. The required label, controlled/default state, disabled guard and accepted-change feedback contract are retained.

The existing Switch renderer stays unchanged; its standalone import remains 2,153 gzip bytes. SwitchRow measures 921 bytes against the same unchanged 2,200-byte cap. [Report](report.json) retains source fingerprints, complete source checks and the four-case browser proof. The standard browser gate now runs this regression.

No physical-device certification, publication or owner acceptance is claimed.

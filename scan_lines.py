import os

root = os.path.dirname(os.path.abspath(__file__))
skip = {'venv', 'migrations', '__pycache__', '.git', 'node_modules', '.next', 'dist'}
exts = ('.py', '.tsx', '.ts', '.jsx', '.js')

results = []
for dp, dn, fns in os.walk(root):
    dn[:] = [d for d in dn if d not in skip]
    for f in fns:
        if f.endswith(exts):
            fp = os.path.join(dp, f)
            try:
                with open(fp, encoding='utf-8', errors='ignore') as fh:
                    lines = sum(1 for _ in fh)
            except Exception:
                lines = 0
            if lines > 200:
                rel = os.path.relpath(fp, root).replace('\\', '/')
                results.append((lines, rel))

results.sort(key=lambda x: -x[0])

with open(os.path.join(root, 'scan_out.txt'), 'w', encoding='utf-8') as out:
    out.write(f"{'Lines':>6}  File\n")
    out.write("-" * 70 + "\n")
    for c, p in results:
        marker = "  <<<< OVER 600" if c > 600 else ""
        out.write(f"{c:>6}  {p}{marker}\n")

print("Done. Results in scan_out.txt")

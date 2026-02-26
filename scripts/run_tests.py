"""Run tests via subprocess - saved for PowerShell to execute."""

# Run from worldlabs-mcp root:
# python scripts/run_tests.py
import os
import subprocess
import sys

os.chdir(r"D:\Dev\repos\worldlabs-mcp")
result = subprocess.run(
    [sys.executable, "-m", "pytest", "tests/", "-v", "--tb=short"],
    capture_output=True,
    text=True,
    timeout=120,
)
with open(r"D:\Dev\repos\temp\wl_test_results.txt", "w", encoding="utf-8") as f:
    f.write(result.stdout)
    f.write(result.stderr)
    f.write(f"\nRC: {result.returncode}\n")
print(result.stdout[-4000:])
print(result.stderr[-1000:])
print("RC:", result.returncode)

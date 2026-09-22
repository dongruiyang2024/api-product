#!/usr/bin/env python3
"""保留每个测试进程 60 秒硬超时，将大型 service 套件分片执行。"""

import argparse
import re
import subprocess
import tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
SERVICE_BATCH_SIZE = 40
TEST_TIMEOUT = "60s"
PROCESS_TIMEOUT_SECONDS = 75
SERVICE_DIR = BACKEND_DIR / "internal/service"


def run_command(command, *, capture=False, cwd=BACKEND_DIR, timeout=None):
    print("+ " + " ".join(command), flush=True)
    result = subprocess.run(
        command, cwd=cwd, timeout=timeout, check=True, text=True,
        stdout=subprocess.PIPE if capture else None,
    )
    return result.stdout if capture else None


def run_suite(tags=None, *, service_only=False):
    build_flags = [f"-tags={tags}"] if tags else []
    packages = run_command(["go", "list", *build_flags, "./..."], capture=True).splitlines()
    service_packages = [package for package in packages if package.endswith("/internal/service")]
    if len(service_packages) != 1:
        raise RuntimeError("Expected exactly one internal/service package")
    service_package = service_packages[0]
    other_packages = [package for package in packages if package != service_package]
    if not service_only and other_packages:
        run_command(["go", "test", f"-timeout={TEST_TIMEOUT}", *build_flags, *other_packages])

    # 编译一次后重复运行同一测试二进制，避免每片重新链接大型 service 包。
    with tempfile.TemporaryDirectory(prefix="sub2api-service-tests-") as directory:
        binary = str(Path(directory) / "service.test")
        run_command(["go", "test", *build_flags, "-c", "-o", binary, service_package])
        listing = run_command(
            [binary, "-test.list=.", f"-test.timeout={TEST_TIMEOUT}"],
            capture=True, cwd=SERVICE_DIR, timeout=PROCESS_TIMEOUT_SECONDS,
        )
        tests = [line for line in listing.splitlines() if re.fullmatch(r"(?:Test|Example|Fuzz)\w+", line)]
        if not tests or len(tests) != len(set(tests)):
            raise RuntimeError("Service test enumeration is empty or contains duplicate names")
        total = (len(tests) + SERVICE_BATCH_SIZE - 1) // SERVICE_BATCH_SIZE
        for offset in range(0, len(tests), SERVICE_BATCH_SIZE):
            batch = tests[offset:offset + SERVICE_BATCH_SIZE]
            print(f"Service shard {offset // SERVICE_BATCH_SIZE + 1}/{total}: "
                  f"{len(batch)} tests ({batch[0]} ... {batch[-1]})", flush=True)
            pattern = "^(" + "|".join(re.escape(name) for name in batch) + ")$"
            run_command(
                [binary, f"-test.run={pattern}", f"-test.timeout={TEST_TIMEOUT}"],
                cwd=SERVICE_DIR, timeout=PROCESS_TIMEOUT_SECONDS,
            )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tags", help="Go build tags used for package discovery and compilation")
    parser.add_argument("--service-only", action="store_true", help="Only run service shards")
    args = parser.parse_args()
    run_suite(args.tags, service_only=args.service_only)


if __name__ == "__main__":
    main()

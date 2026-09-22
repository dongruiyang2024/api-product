"""验证测试入口覆盖全部测试名、严格超时和失败传播。"""
import importlib.util
import re
import subprocess
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("run_tests", Path(__file__).with_name("run-tests.py"))
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class TestServiceShards(unittest.TestCase):
    def test_all_tests_and_fuzz_seeds_run_exactly_once_with_tags_and_timeout(self):
        names = [f"TestCase{i}" for i in range(81)] + ["ExampleGateway", "FuzzRoute"]
        commands = []

        def fake(command, *, capture=False, **kwargs):
            commands.append(command)
            if command[0] != "go":
                self.assertEqual(kwargs["cwd"], runner.SERVICE_DIR)
                self.assertEqual(kwargs["timeout"], 75)
            if command[1] == "list":
                return "module/internal/service\nmodule/internal/config\n"
            if "-test.list=." in command:
                return "setup log\n" + "\n".join(names)

        with patch.object(runner, "run_command", side_effect=fake):
            runner.run_suite("unit")
        self.assertIn(["go", "list", "-tags=unit", "./..."], commands)
        self.assertIn(["go", "test", "-timeout=60s", "-tags=unit", "module/internal/config"], commands)
        compile_commands = [c for c in commands if "-c" in c]
        self.assertEqual(len(compile_commands), 1)
        self.assertIn("-tags=unit", compile_commands[0])
        shards = [c for c in commands if any(a.startswith("-test.run=") for a in c)]
        self.assertEqual(len(shards), 3)
        matched = []
        for command in shards:
            self.assertIn("-test.timeout=60s", command)
            pattern = next(a.removeprefix("-test.run=") for a in command if a.startswith("-test.run="))
            matched.extend(name for name in names if re.fullmatch(pattern, name))
            self.assertIsNone(re.fullmatch(pattern, "TestCase0Extra"))
        self.assertEqual(matched, names)

    def test_failed_shard_stops_and_empty_discovery_fails(self):
        for empty in (False, True):
            commands = []
            failure = subprocess.CalledProcessError(1, "service.test")

            def fake(command, *, capture=False, **kwargs):
                commands.append(command)
                if command[1] == "list":
                    return "module/internal/service\n"
                if "-test.list=." in command:
                    return "" if empty else "\n".join(f"TestCase{i}" for i in range(81))
                if any(a.startswith("-test.run=") for a in command):
                    raise failure

            with patch.object(runner, "run_command", side_effect=fake):
                with self.assertRaises(RuntimeError if empty else subprocess.CalledProcessError):
                    runner.run_suite(service_only=True)
            shards = [c for c in commands if any(a.startswith("-test.run=") for a in c)]
            self.assertEqual(len(shards), 0 if empty else 1)


if __name__ == "__main__":
    unittest.main()

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .pipeline import PipelineConfig, build_plan
from .prompts import load_prompt


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="pi-mono skill extraction planner")
    sub = parser.add_subparsers(dest="command", required=True)

    run = sub.add_parser("run", help="Build plan and render prompts")
    run.add_argument("--input", required=True, help="Path to book file (pdf/md/txt)")
    run.add_argument("--skill-name", required=True, help="Output skill folder name")
    run.add_argument("--domain", required=True, help="Skill domain, e.g. business")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "run":
        cfg = PipelineConfig(
            input_path=Path(args.input),
            skill_name=args.skill_name,
            domain=args.domain,
        )
        plan = build_plan(cfg)
        print(json.dumps(plan, indent=2))
        print("\n--- rendered prompts ---")
        for step in plan:
            prompt_name = Path(step["prompt"]).name
            print(f"\n## {step['stage']} :: {prompt_name}")
            print(
                load_prompt(
                    prompt_name,
                    INPUT_PATH=str(cfg.input_path),
                    SKILL_NAME=cfg.skill_name,
                    DOMAIN=cfg.domain,
                )
            )


if __name__ == "__main__":
    main()

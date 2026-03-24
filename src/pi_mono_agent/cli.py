from __future__ import annotations

import argparse
import json
from pathlib import Path

from .llm import LLMSettings, build_llm_client
from .pipeline import PipelineConfig, build_plan, execute_plan
from .prompts import load_prompt


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="pi-mono skill extraction planner")
    sub = parser.add_subparsers(dest="command", required=True)

    run = sub.add_parser("run", help="Build plan and render prompts")
    run.add_argument("--input", required=True, help="Path to book file (pdf/md/txt)")
    run.add_argument("--skill-name", required=True, help="Output skill folder name")
    run.add_argument("--domain", required=True, help="Skill domain, e.g. business")

    execute = sub.add_parser("execute", help="Execute full pipeline with an LLM provider")
    execute.add_argument("--input", required=True, help="Path to book file (pdf/md/txt)")
    execute.add_argument("--skill-name", required=True, help="Output skill folder name")
    execute.add_argument("--domain", required=True, help="Skill domain, e.g. business")
    execute.add_argument(
        "--provider",
        default="mock",
        choices=["mock", "openai"],
        help="LLM provider adapter to use",
    )
    execute.add_argument("--model", default="gpt-4.1-mini", help="Model identifier for provider")
    execute.add_argument(
        "--output-dir",
        default="outputs",
        help="Folder where stage outputs will be written",
    )

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

    if args.command == "execute":
        cfg = PipelineConfig(
            input_path=Path(args.input),
            skill_name=args.skill_name,
            domain=args.domain,
        )
        settings = LLMSettings(provider=args.provider, model=args.model)
        llm_client = build_llm_client(settings)
        results = execute_plan(cfg, llm_client, output_root=Path(args.output_dir))

        summary = [
            {
                "stage": result.stage,
                "prompt": result.prompt_path,
                "output_path": str(result.output_path),
            }
            for result in results
        ]
        print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

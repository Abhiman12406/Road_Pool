#!/usr/bin/env python3
"""
RidePool AI - Skills Downloader
Downloads curated agent skills for the RidePool AI project using the open Skills CLI (npx skills).
"""

import sys
import subprocess
import time
from typing import List, Dict

# Curated skills tailored for RidePool AI's full-stack architecture:
# (FastAPI backend, React/Vite/TS/Tailwind frontend, OR-Tools optimization, Pytest)
SKILLS_TO_INSTALL: List[Dict[str, str]] = [
    {
        "repo": "vercel-labs/agent-skills",
        "skill": "vercel-react-best-practices",
        "category": "Frontend",
        "description": "React & Next.js performance and UI architecture best practices"
    },
    {
        "repo": "vercel-labs/agent-skills",
        "skill": "vercel-composition-patterns",
        "category": "Frontend",
        "description": "Clean component composition and reusable UI patterns"
    },
    {
        "repo": "wshobson/agents",
        "skill": "fastapi-templates",
        "category": "Backend",
        "description": "FastAPI production architecture, routing, and Pydantic schemas"
    },
    {
        "repo": "wshobson/agents",
        "skill": "tailwind-design-system",
        "category": "Design/UI",
        "description": "Tailwind CSS design token system matching Kinetic Glow"
    },
    {
        "repo": "wshobson/agents",
        "skill": "python-testing-patterns",
        "category": "Testing",
        "description": "Pytest testing patterns for algorithmic validation and APIs"
    },
    {
        "repo": "anthropics/skills",
        "skill": "web-artifacts-builder",
        "category": "Architecture",
        "description": "Complex multi-screen interactive web application builder"
    },
    {
        "repo": "vercel-labs/agent-skills",
        "skill": "web-design-guidelines",
        "category": "Design/UI",
        "description": "Vercel web design guidelines, typography, visual hierarchy, and accessibility"
    },
    {
        "repo": "nextlevelbuilder/ui-ux-pro-max-skill",
        "skill": "ui-ux-pro-max",
        "category": "Design/UI",
        "description": "Comprehensive UI/UX usability heuristics and simplified workflows"
    },
    {
        "repo": "pbakaus/impeccable",
        "skill": "impeccable",
        "category": "Design/UI",
        "description": "Interface craft, decluttering, aesthetic polish, and micro-interactions"
    },
    {
        "repo": "addyosmani/agent-skills",
        "skill": "performance-optimization",
        "category": "Performance",
        "description": "Web performance optimization, debloating, and rendering speed"
    },
    {
        "repo": "vercel-labs/agent-skills",
        "skill": "vercel-optimize",
        "category": "Performance",
        "description": "Bundle optimization, code splitting, and bundle reduction"
    }
]

def run_command(cmd: List[str]) -> bool:
    """Run a shell command, streaming stdout and stderr."""
    print(f"Executing: {' '.join(cmd)}")
    try:
        proc = subprocess.run(cmd, check=True, text=True, capture_output=True, shell=True)
        print(proc.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error (code {e.returncode}):\n{e.stderr or e.stdout}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Exception: {e}", file=sys.stderr)
        return False

def main():
    print("=" * 68)
    print("      RidePool AI - Project Skills Downloader (npx skills)       ")
    print("=" * 68)
    print(f"Identified {len(SKILLS_TO_INSTALL)} specialized skills for RidePool AI:")
    for i, item in enumerate(SKILLS_TO_INSTALL, start=1):
        print(f"  {i}. [{item['category']}] {item['skill']} (from {item['repo']})")
        print(f"     -> {item['description']}")
    print("-" * 68)

    results = []
    start_time = time.time()

    for item in SKILLS_TO_INSTALL:
        repo = item["repo"]
        skill = item["skill"]
        category = item["category"]

        print(f"\n--> Installing [{category}] {skill} from {repo}...")
        cmd = ["npx", "-y", "skills", "add", repo, "--skill", skill, "-y"]
        success = run_command(cmd)
        results.append((skill, category, success))

    total_time = time.time() - start_time
    print("\n" + "=" * 68)
    print("Installation Summary:")
    print("=" * 68)
    success_count = sum(1 for _, _, ok in results if ok)
    for skill, cat, ok in results:
        status = "[SUCCESS]" if ok else "[FAILED]"
        print(f"  {status} [{cat}] {skill}")

    print(f"\nCompleted in {total_time:.1f}s ({success_count}/{len(results)} skills installed).")
    print("Installed skills are located in: .agents/skills/")

if __name__ == "__main__":
    main()

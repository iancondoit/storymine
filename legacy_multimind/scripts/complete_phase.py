#!/usr/bin/env python3
"""
Project-specific completion script for StoryMine.

This script provides a convenient way to report phase completions without
having to navigate to the root directory or remember the full command syntax.
"""

import argparse
import os
import subprocess
import sys

# Configuration
PROJECT_NAME = "StoryMine"
MULTIMIND_SCRIPT = "../../multimind.py"  # Path to the multimind.py script from the project directory

def main():
    """Parse command line arguments and execute the completion command."""
    parser = argparse.ArgumentParser(
        description=f"Report phase completion for StoryMine"
    )
    parser.add_argument(
        "phase",
        help="The phase identifier (e.g., Phase1, Phase2, etc.)"
    )
    args = parser.parse_args()

    # Validate phase ID
    phase_id = args.phase
    if not phase_id:
        print("Error: Phase identifier is required")
        sys.exit(1)

    # Check if the multimind.py script exists
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    multimind_path = os.path.join(root_dir, "multimind.py")
    if not os.path.exists(multimind_path):
        print(f"Error: Could not find the MultiMind script at {multimind_path}")
        print("Make sure you are running this script from the project directory.")
        sys.exit(1)

    # Check for completion marker
    completion_marker = os.path.join(root_dir, "StoryMine", "output", "completions", f"StoryMine-{phase_id}-complete.md")
    if not os.path.exists(completion_marker):
        print(f"Error: Completion marker file not found at {completion_marker}")
        print("Please create a completion marker before reporting phase completion.")
        print(f"See {os.path.join(root_dir, 'MultiMindPM', 'rules', 'completion_reporting.md')} for instructions.")
        sys.exit(1)

    # Execute the multimind.py complete command from the root directory
    try:
        print(f"Reporting completion of {phase_id} for StoryMine...")
        # Change to the root directory where multimind.py and config.json are located
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
        result = subprocess.run(
            [sys.executable, "multimind.py", "complete", PROJECT_NAME, phase_id, "--only-project"],
            cwd=root_dir,
            check=True,
            text=True,
            capture_output=True
        )
        print(result.stdout)
        print(f"Successfully reported completion of {phase_id} for StoryMine")
    except subprocess.CalledProcessError as e:
        print(f"Error executing completion command: {e}")
        if e.stdout:
            print("Output:")
            print(e.stdout)
        if e.stderr:
            print("Error output:")
            print(e.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main() 
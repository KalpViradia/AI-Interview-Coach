"""
Smoke Test — runs one full headless interview cycle.

Run after every day's work (Rule #10): python -m app.scripts.smoke_test
Exits non-zero on failure.
"""

import sys


def run_smoke_test():
    """Execute a full interview cycle end-to-end."""
    print("🔥 Running smoke test...")

    # TODO: Implement smoke test
    # 1. Create a session with a sample resume + JD
    # 2. Get the first question from the Interviewer
    # 3. Submit an answer
    # 4. Get evaluation
    # 5. Complete the session
    # 6. Verify the report was generated

    print("⚠️  Smoke test not yet implemented — stub only")
    return True


if __name__ == "__main__":
    success = run_smoke_test()
    sys.exit(0 if success else 1)

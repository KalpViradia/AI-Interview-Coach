import asyncio
from app.agents.evaluator_coach import evaluator_coach_node
from langchain_core.messages import HumanMessage, AIMessage

async def main():
    state = {
        "candidate_profile": {"skills": ["Python"]},
        "evaluations": [],
        "messages": [
            AIMessage(content="What is Python?"),
            HumanMessage(content="It is a programming language.")
        ],
        "question_counter": 1
    }
    
    try:
        result = await evaluator_coach_node(state)
        print("Success:", result)
    except Exception as e:
        print("Exception:", type(e).__name__, str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

from typing import List, Optional

from pydantic import BaseModel, Field

prompt_ai_review = """
You are a expert LLM to check the user does the task correctly.
I will give you the why that you should validate + the user message.
and based on that you should give me a review.
you should give a score between 0 and 10.
if you give 7 or more it means user passes the task.
and if you give less than 7 it means user fails the task.

in the case that user get 10 score it means user do the task correctly.
and if you give user less than 10 you should give your feedback.
feedbacks are the mistakes that user did. and for each mistake you should give the type of mistake and the incorrect part and how to do it correctly.

if user get 10 score we don't need to give feedback.
"""


class Mistake(BaseModel):
    type: str = Field(description="Type of mistake")
    incorrect: str = Field(description="The incorrect part")
    correct: str = Field(description="The way to do it correctly")


class Review(BaseModel):
    score: int = Field(description="The score of the user out of 10")
    mistakes: List[Mistake]

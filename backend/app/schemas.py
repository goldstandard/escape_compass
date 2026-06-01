from __future__ import annotations

from typing import Dict, List, Literal

from pydantic import BaseModel, Field, field_validator

AnswerOption = Literal["A", "B", "C", "D"]


class UserAnswer(BaseModel):
    question_id: str = Field(..., examples=["q1"])
    option: AnswerOption


class QuestionnaireState(BaseModel):
    answered_questions: Dict[str, AnswerOption] = Field(default_factory=dict)

    @field_validator("answered_questions")
    @classmethod
    def validate_question_ids(cls, value: Dict[str, AnswerOption]) -> Dict[str, AnswerOption]:
        for question_id in value:
            if not question_id.startswith("q"):
                raise ValueError("Question keys must start with 'q', e.g. q1")
        return value


class CountryScore(BaseModel):
    iso3: str
    country: str
    score: float
    hard_constraints_passed: bool
    matched: float
    considered: float


class FilterRequest(QuestionnaireState):
    pass


class FilterResponse(BaseModel):
    remaining_countries: List[str]
    top_recommendations: List[CountryScore]


class QuestionOption(BaseModel):
    key: AnswerOption
    text: str


class QuestionItem(BaseModel):
    id: str
    number: int
    prompt: str
    options: List[QuestionOption]


class QuestionCategory(BaseModel):
    id: str
    title: str
    questions: List[QuestionItem]


class QuestionsResponse(BaseModel):
    version: str
    categories: List[QuestionCategory]

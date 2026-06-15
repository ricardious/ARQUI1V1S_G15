from pydantic import BaseModel


class CsvGenerationResponse(BaseModel):
    message: str
    path: str
    rows: int


class Arm64RunResponse(BaseModel):
    message: str
    results: dict[str, str]

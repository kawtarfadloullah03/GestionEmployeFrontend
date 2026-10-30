import csv
from pathlib import Path

import pytest

from agentic.services.rag_engine import RAGAssistant


@pytest.fixture
def rag(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    assistant = RAGAssistant()
    # Keep these tests isolated from a developer's local database.
    assistant._refresh_persisted_documents = lambda force=False: None
    return assistant


def ask(rag, text):
    return rag.query(text)


def test_department_means_are_calculated_from_real_public_csv(rag):
    response = ask(rag, "Quels sont les salaires moyens par département à Norfolk ?")
    path = Path(__file__).resolve().parents[1] / "data" / "norfolk_public_payroll_summary.csv"
    with path.open(newline="", encoding="utf-8-sig") as file:
        rows = list(csv.DictReader(file))
    expected_departments = {row["department"] for row in rows}

    assert response["generation_mode"] == "structured_csv"
    assert len(expected_departments) > 1
    for department in expected_departments:
        assert department in response["answer"]
    assert response["retrieved_context"][0]["source"].endswith("norfolk_public_payroll_summary.csv")
    assert "USD" in response["answer"]
    assert response["retrieved_context"][0]["source"].endswith("norfolk_public_payroll_summary.csv")
    assert 0 < response["retrieved_context"][0]["score"] < 1


def test_job_title_salary_comes_from_fy2027_classification_table(rag):
    response = ask(rag, "Quel est le salaire du Public Information Specialist I ?")
    assert "49,152.78" in response["answer"]
    assert "82,348.05" in response["answer"]
    assert "pas le salaire d’une personne" in response["answer"]
    assert response["retrieved_context"][0]["source"].endswith("norfolk_compensation_bands_fy2027.csv")
    assert any(source["source"].endswith("norfolk_compensation_plan_fy2027.pdf") for source in response["retrieved_context"])


@pytest.mark.parametrize(
    "question,required_phrase",
    [
        ("Donne-moi le salaire individuel de John Smith.", "ni noms ni salaires individuels"),
        ("Quelle est la politique salariale de notre entreprise ?", "Aucune politique salariale interne officielle"),
        ("Quel est le salaire minimum légal en France ?", "aucune source juridique française"),
        ("Quels sont mes droits aux congés payés ?", "Aucune règle RH officielle"),
    ],
)
def test_unsupported_sensitive_questions_abstain(rag, question, required_phrase):
    response = ask(rag, question)
    assert required_phrase.casefold() in response["answer"].casefold()
    assert response["generation_mode"] == "abstention"


def test_public_and_synthetic_data_are_distinguished(rag):
    response = ask(rag, "Quelle est la différence entre les données publiques et les données synthétiques ?")
    assert "agrégé" in response["answer"]
    assert "synthétiques" in response["answer"]
    assert {source["doc_id"] for source in response["retrieved_context"]} == {
        "doc_norfolk_payroll_data_dictionary", "doc_demo_data_notice"
    }


def test_excluded_small_groups_explain_incomplete_payroll_total(rag):
    response = ask(rag, "Pourquoi les sommes disponibles ne représentent-elles pas la masse salariale complète ?")
    assert "moins de trois personnes" in response["answer"]
    assert "pas d’un total exhaustif" in response["answer"]


def test_retrieval_deduplicates_passages_and_rejects_unrelated_queries(rag):
    matches = rag.vector_store.search_similarity("Public Information Specialist I Norfolk salary", top_k=10)
    doc_ids = [chunk.doc_id for chunk, _ in matches]
    assert len(doc_ids) == len(set(doc_ids))
    assert any(doc_id.startswith("doc_norfolk_band_") for doc_id in doc_ids)

    response = ask(rag, "Quel est le meilleur restaurant sur Mars ?")
    assert response["generation_mode"] == "abstention"
    assert response["retrieved_context"] == []


def test_pdf_extraction_is_verified_and_classification_is_indexed(rag):
    plan = next(doc for doc in rag.default_docs if doc["id"] == "doc_norfolk_compensation_plan_fy2027")
    assert "Public Information Specialist I" in plan["content"]
    assert "49,152.78" in plan["content"]
    assert any(doc["id"] == "doc_norfolk_band_100375" for doc in rag.default_docs)

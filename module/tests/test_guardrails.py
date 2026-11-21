"""
Automated unit tests for EcoLens Forensic Engine Guardrails, Schemas, and Bounds.
Uses standard Python unittest (zero extra test dependencies).
"""

import io
import base64
import unittest
from PIL import Image

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from schemas import (
    AnalysisResult,
    CompositionItem,
    GroundingMetadata,
    GroundingSource,
    GuardrailReport,
)
from engine import decode_image_data, clean_json_text


class TestEcoLensGuardrails(unittest.TestCase):
    def test_schema_clamping_stars(self):
        """Verify that stars outside 1.0 - 5.0 are clamped strictly."""
        data = {
            "product_name": "Test Plastic Bottle",
            "product_category": "Packaging",
            "summary": "Polymer bottle analysis",
            "recyclability_stars": 6.8,  # Out of bounds (>5)
            "recyclability_reasoning": "High curb recyclability",
            "reusability_stars": 0.2,    # Out of bounds (<1)
            "reusability_reasoning": "Single use",
            "reducibility_stars": 3.75,
            "reducibility_reasoning": "Moderate reduction potential",
            "compositions_table": [
                {
                    "component": "Body",
                    "material": "PET #1",
                    "estimated_percentage": 90.0,
                    "recyclable": "Widely Recyclable",
                    "stream": "Curbside Blue Bin",
                    "notes": "Clear resin"
                }
            ],
            "is_donation_worthy": False,
            "donation_rationale": "Empty packaging cannot be donated",
            "is_diy_worthy": True,
            "diy_rationale": "Can be upcycled into planter",
            "suggested_diy_ideas": ["Self-watering planter"],
            "guardrail": {
                "is_valid_physical_object": True,
                "guardrail_status": "PASSED",
                "confidence_score": 0.98,
                "guardrail_notes": None
            },
            "grounding": {
                "search_queries": ["PET recycling rates 2026"],
                "sources": [{"title": "EPA Recycling", "url": "https://epa.gov"}],
                "verified_facts": ["PET #1 is widely accepted curbside"]
            },
            "provider": "groq",
            "model": "llama-3.2-11b-vision-preview"
        }

        result = AnalysisResult(**data)
        self.assertEqual(result.recyclability_stars, 5.0)  # Clamped down from 6.8
        self.assertEqual(result.reusability_stars, 1.0)    # Clamped up from 0.2
        self.assertEqual(result.reducibility_stars, 3.8)   # Clamped and rounded
        self.assertFalse(result.is_donation_worthy)
        self.assertTrue(result.is_diy_worthy)

    def test_image_guardrail_too_small(self):
        """Verify guardrail catches tiny or empty payloads."""
        with self.assertRaises(ValueError):
            decode_image_data("data:image/jpeg;base64,AAAA")

    def test_image_guardrail_valid_png(self):
        """Verify a valid image decodes properly."""
        img = Image.new("RGB", (100, 100), color="green")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
        data_uri = f"data:image/png;base64,{b64_str}"

        raw_bytes, mime, clean_b64 = decode_image_data(data_uri)
        self.assertEqual(mime, "image/png")
        self.assertGreater(len(raw_bytes), 0)
        self.assertGreater(len(clean_b64), 0)

    def test_clean_json_text(self):
        """Verify markdown code block stripping."""
        raw = "```json\n{\"product_name\": \"Cotton T-Shirt\"}\n```"
        cleaned = clean_json_text(raw)
        self.assertEqual(cleaned, '{"product_name": "Cotton T-Shirt"}')


if __name__ == "__main__":
    unittest.main()

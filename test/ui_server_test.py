import importlib.util
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("director_ui", ROOT / "app.py")
APP = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(APP)


class ProjectPayloadTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.original_projects_root = APP.PROJECTS_ROOT
        self.original_testing = APP.app.testing
        APP.PROJECTS_ROOT = Path(self.temporary_directory.name) / "projects"
        APP.app.testing = True
        self.client = APP.app.test_client()

    def tearDown(self):
        APP.PROJECTS_ROOT = self.original_projects_root
        APP.app.testing = self.original_testing
        self.temporary_directory.cleanup()

    def test_accepts_external_voiceover_project(self):
        payload = APP.validate_project_payload({
            "projectId": "strasbourg-dance",
            "source": "Verified source notes.",
            "aspect": "9:16",
            "duration": 60,
            "style": "classic",
            "theme": "light",
            "externalVoiceover": True,
            "subtitleFormat": "srt",
        })

        self.assertEqual(payload["projectId"], "strasbourg-dance")
        self.assertTrue(payload["externalVoiceover"])

    def test_rejects_non_ten_second_duration(self):
        with self.assertRaises(APP.ApiError):
            APP.validate_project_payload({
                "projectId": "bad-duration",
                "source": "Verified source notes.",
                "aspect": "9:16",
                "duration": 55,
                "style": "classic",
                "theme": "light",
            })

    def test_creates_project_and_returns_phase_a_handoff(self):
        response = self.client.post("/api/projects", json={
            "projectId": "ui-flow",
            "source": "A small action can interrupt a loop of hesitation.",
            "aspect": "9:16",
            "duration": 30,
            "style": "classic",
            "theme": "light",
            "externalVoiceover": True,
            "subtitleFormat": "srt",
        })

        payload = response.get_json()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(payload["id"], "ui-flow")
        self.assertIn("Create Phase A only", payload["phaseARequest"])
        self.assertTrue(payload["state"]["settings"]["externalVoiceover"])

    def test_serves_the_browser_shell_and_stylesheet(self):
        index = self.client.get("/")
        stylesheet = self.client.get("/static/styles.css")

        self.assertEqual(index.status_code, 200)
        self.assertIn(b"Stickman Video Director", index.data)
        self.assertEqual(stylesheet.status_code, 200)
        self.assertIn(b"--background", stylesheet.data)
        index.close()
        stylesheet.close()


if __name__ == "__main__":
    unittest.main()

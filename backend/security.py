import json
import os
from typing import List, Optional
from models import CommandResult

HACKS_DB_PATH = os.path.join(os.path.dirname(__file__), "database", "hacks.json")

class SecurityEngine:
    def __init__(self):
        self.hacks = self._load_hacks()

    def _load_hacks(self) -> List[dict]:
        if not os.path.exists(HACKS_DB_PATH):
            return []
        try:
            with open(HACKS_DB_PATH, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading hacks.json: {e}")
            return []

    def check_trusted_intent(self, intent: str) -> Optional[CommandResult]:
        """
        Checks if the intent matches a known description in hacks.json.
        Returns a CommandResult if found, None otherwise.
        """
        normalized_intent = intent.lower().strip()
        
        for hack in self.hacks:
            # Simple keyword matching or exact match - for now exact match or substring
            # In a real app, we might use vector embeddings or fuzzy search.
            # Here we'll do a simple substring check or exact match on "intent" field
            if normalized_intent == hack.get("intent", "").lower():
               return CommandResult(
                   id=hack["id"],
                   intent=hack["intent"],
                   description=hack["description"],
                   command=hack["command"],
                   type=hack["type"],
                   requires_admin=hack.get("requires_admin", False),
                   safety_tier=1,
                   source="Local Trusted DB"
               )
        return None

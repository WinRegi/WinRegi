import abc
import ollama
from typing import Optional
from models import CommandResult, SummaryResult

class AIProvider(abc.ABC):
    @abc.abstractmethod
    def generate_command(self, intent: str, system_prompt: str) -> CommandResult:
        pass

    @abc.abstractmethod
    def generate_summary(self, intent: str, output: str, system_prompt: str) -> SummaryResult:
        pass

class OllamaProvider(AIProvider):
    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name

    def generate_command(self, intent: str, system_prompt: str) -> CommandResult:
        try:
            # Construct a prompt that forces JSON output or specific format
            full_prompt = f"{system_prompt}\n\nUser Intent: {intent}\n\nRespond with a valid PowerShell command only."
            
            # Simple interaction with Ollama
            # In a real impl, we'd use Structured Outputs if available or parsing
            response = ollama.chat(model=self.model_name, messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': intent},
            ])
            
            content = response['message']['content']
            
            # Very basic parsing - assuming the LLM follows instructions
            # For production, we need rigorous parsing/validation
            return CommandResult(
                id="gen_" + str(hash(intent)),
                intent=intent,
                description="AI Generated via Ollama",
                command=content.strip("`").replace("powershell", "").strip(),
                type="powershell",
                requires_admin=False, # AI generated, assume safe? No, need check.
                safety_tier=2,
                source="Ollama"
            )
        except Exception as e:
            print(f"Ollama Error: {e}")
            return CommandResult(
                id="error",
                intent=intent,
                description=f"Error: {str(e)}",
                command="Write-Host 'Error generating command'",
                type="powershell",
                requires_admin=False,
                safety_tier=2,
                source="Ollama Error"
            )
            
    def generate_summary(self, intent: str, output: str, system_prompt: str) -> SummaryResult:
        try:
            full_prompt = f"{system_prompt}\n\nUser Question: {intent}\nCommand Output: {output}"
            response = ollama.chat(model=self.model_name, messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': full_prompt},
            ])
            return SummaryResult(summary=response['message']['content'])
        except Exception as e:
            return SummaryResult(summary=f"Failed to summarize: {str(e)}")

from google import genai

class GeminiProvider(AIProvider):
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)

    def generate_command(self, intent: str, system_prompt: str) -> CommandResult:
        try:
            full_prompt = f"{system_prompt}\n\nUser Intent: {intent}"
            response = self.client.models.generate_content(
                model='gemini-2.0-flash',
                contents=full_prompt
            )
            content = response.text
             # Basic cleanup
            content = content.strip().replace("```powershell", "").replace("```", "").strip()

            return CommandResult(
                id="gen_gemini_" + str(hash(intent)),
                intent=intent,
                description="AI Generated via Gemini",
                command=content,
                type="powershell",
                requires_admin=False, 
                safety_tier=2,
                source="Gemini"
            )
        except Exception as e:
            error_msg = str(e)
            friendly_msg = f"Error: {error_msg}"
            
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                friendly_msg = "Rate Limit Exceeded (Free Tier). Please wait 1 minute or switch to Ollama."
            elif "404" in error_msg:
                 friendly_msg = "Model not found. Please check API key project settings."

            print(f"Gemini Error: {e}")
            return CommandResult(
                id="error",
                intent=intent,
                description=friendly_msg,
                command=f"Write-Host '{friendly_msg}'",
                type="powershell",
                requires_admin=False,
                safety_tier=2,
                source="Gemini System"
            )

    def generate_summary(self, intent: str, output: str, system_prompt: str) -> SummaryResult:
        try:
            full_prompt = f"{system_prompt}\n\nUser Question: {intent}\nCommand Output: {output}"
            response = self.client.models.generate_content(
                model='gemini-2.0-flash',
                contents=full_prompt
            )
            return SummaryResult(summary=response.text)
        except Exception as e:
             return SummaryResult(summary=f"Failed to summarize via Gemini: {str(e)}")


class AIEngine:
    def __init__(self):
        self.ollama = OllamaProvider()
        self.gemini = None # init when key provided

    def set_gemini_key(self, key: str):
        if key:
            self.gemini = GeminiProvider(key)

    def generate(self, intent: str, provider: str = "ollama") -> CommandResult:
        system_prompt = """
        You are a Windows System Administrator Expert. 
        Your task is to convert the user's natural language intent into a specific PowerShell command.
        1. Return ONLY the PowerShell command.
        2. Do not include markdown formatting like ```powershell.
        3. Ensure the command is safe.
        4. If the command requires Admin privileges, it is acceptable, but try to be efficient.
        5. PREFER standard networking cmdlets: Use 'Test-NetConnection' or 'ping' for connectivity checks. Avoid 'Test-Path' for URLs.
        """
        
        if provider == "gemini" and self.gemini:
            return self.gemini.generate_command(intent, system_prompt)
        else:
            return self.ollama.generate_command(intent, system_prompt)
            
    def summarize(self, intent: str, output: str, provider: str = "ollama") -> SummaryResult:
        system_prompt = """
        You are a helpful IT Assistant.
        The user asked a question or requested an action.
        A PowerShell command was executed, and here is the output.
        Your task is to read the Intent and the Output, and provide a clear, human-readable Answer or Summary.
        
        Formatting Rules:
        1. Use bullet points for lists (like IP addresses, services, etc).
        2. Keep it concise but well-formatted.
        3. Do NOT just dump the raw text back. Format it nicely.
        4. If the output is a single value, just state it clearly.
        5. Use simple Markdown (bolding key values).
        """
        if provider == "gemini" and self.gemini:
            return self.gemini.generate_summary(intent, output, system_prompt)
        else:
            return self.ollama.generate_summary(intent, output, system_prompt)

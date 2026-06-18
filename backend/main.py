import os
import json
import traceback
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel
from anthropic import Anthropic
from supabase import create_client, Client
from typing import Union

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Carvia API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
)

# ── Auth ──────────────────────────────────────────────────────────────────────

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth.split(" ", 1)[1]
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": user.user.id, "email": user.user.email}
    except Exception:
        raise HTTPException(status_code=401, detail="Token verification failed")

# ── Models ────────────────────────────────────────────────────────────────────

class ResumeRequest(BaseModel):
    resume_text: Union[str, None] = None
    resume_pdf_base64: Union[str, None] = None
    job_description: str
    linkedin: Union[str, None] = None
    github: Union[str, None] = None
    portfolio: Union[str, None] = None

class CoverLetterRequest(BaseModel):
    resume_text: Union[str, None] = None
    resume_pdf_base64: Union[str, None] = None
    job_description: str
    hiring_manager: Union[str, None] = None
    company: Union[str, None] = None
    tone: Union[str, None] = "professional"
    length: Union[str, None] = "standard"

class AnalyzeRequest(BaseModel):
    resume_text: Union[str, None] = None
    resume_pdf_base64: Union[str, None] = None
    job_description: str

class InterviewRequest(BaseModel):
    resume_text: Union[str, None] = None
    resume_pdf_base64: Union[str, None] = None
    job_description: str

class StatusUpdate(BaseModel):
    status: str

# ── System Prompts ────────────────────────────────────────────────────────────

RESUME_SYSTEM = (
    "You are an elite ATS resume writer specializing in high-conversion software engineering and AI/ML resumes. "
    "Transform the candidate's existing resume into a recruiter-ready, ATS-optimized, visually polished resume tailored specifically to the provided job description. "
    "PRIMARY OBJECTIVES: "
    "1) Maximize ATS keyword match score using exact terminology, tools, frameworks, and skills from the job description. "
    "2) Rewrite bullet points to emphasize relevant technical impact, measurable outcomes, scalability, and business value. "
    "3) Prioritize relevance over completeness — compress or remove less relevant information. "
    "4) Keep the final resume compact enough to fit within 1 page whenever possible, maximum 1.5 pages. "
    "5) Ensure the resume looks like a professionally designed modern tech resume rather than generic plain text. "
    "VISUAL FORMATTING REQUIREMENTS: "
    "6) The output must be formatted for proper DOCX/PDF rendering with professional spacing and hierarchy. "
    "7) Do NOT use markdown symbols like ** or * anywhere in the resume output. The frontend will handle all visual styling. "
    "8) Bold only meaningful/high-value content — avoid overusing bold formatting. "
    "9) Project names must always be bolded. "
    "10) Key technologies, AI/ML tools, cloud platforms, frameworks, and measurable achievements should be selectively bolded where impactful. "
    "11) Section headers must be plain uppercase text only, without markdown symbols. Example: SUMMARY, SKILLS, EXPERIENCE. "
    "HEADER FORMAT RULES: "
    "12) Candidate name must appear alone at the top in prominent formatting style. "
    "13) The contact line directly below the name must stay on ONE SINGLE LINE. "
    "Only include links that are provided. Use clean labels not full URLs: LinkedIn | GitHub | Portfolio. "
    "If a link is not provided, do not include it. "
    "14) LinkedIn, GitHub, and Portfolio links must appear minimized/clean in the contact line only. "
    "15) Never place raw standalone links elsewhere in the resume body. "
    "SECTION RULES: "
    "16) Use these exact section headers only when applicable: "
    "SUMMARY, SKILLS, EXPERIENCE, PROJECTS, EDUCATION, CERTIFICATIONS, ACHIEVEMENTS "
    "17) Each experience entry MUST follow this exact one-line structure: "
    "Job Title | Company | Location | Date Range "
    "• Concise impact-focused bullet point "
    "• Concise impact-focused bullet point "
    "18) Every bullet must begin with • and remain concise (1–2 lines max). "
    "19) Avoid long paragraphs, excessive whitespace, markdown tables, emojis, or decorative symbols. "
    "TAILORING REQUIREMENTS: "
    "20) Rewrite the SUMMARY specifically for the target role using JD keywords naturally. "
    "21) Reorder and prioritize SKILLS based on the job description requirements. "
    "22) Naturally inject ATS keywords without keyword stuffing. "
    "23) Emphasize AI/ML systems, inference optimization, backend systems, APIs, cloud infrastructure, distributed systems, or full-stack engineering depending on JD alignment. "
    "24) Preserve measurable metrics already present in the original resume. "
    "TRUTHFULNESS RULES: "
    "25) Never invent experience, skills, metrics, certifications, or technologies not present in the original resume. "
    "26) Only enhance, reorganize, compress, and tailor existing information. "
    "FINAL OUTPUT RULES: "
    "27) Return ONLY the final formatted resume content. "
    "28) No explanations, no markdown fences, no commentary. "
    "29) The output should be immediately usable for generating a properly formatted DOCX or PDF resume with visible bold formatting."
    "30) CRITICAL: Use actual newlines between every section, every job entry, every bullet point, and every line. Never use | as a line separator. Each bullet point must be on its own separate line. Each section header must be on its own separate line."
    "31) CRITICAL: Never start a bullet point with **bold text**: — instead write the category name in bold INLINE within the sentence or just list items without a bold label prefix."
    "32) CRITICAL: The entire resume MUST fit on ONE A4 page. To achieve this: max 3 bullets per job, each bullet max 15 words, skills as single comma-separated lines, summary max 3 sentences."
    "33) STRICT FORMAT: Do not use **bold**, *italic*, markdown tables, markdown headings, or markdown bullets. Use only plain text section headers and bullet character • for bullet points."
    "34) NEVER put a bullet before job titles, project names, education, or certifications. Bullets are only for achievement statements under jobs/projects."
    "35) In SKILLS section, bold ONLY the category labels before the colon."
    "36) In PROJECTS section, bold ONLY the project name before the dash."
)

COVER_SYSTEM = (
    "You are an expert career coach and cover letter writer. Write a compelling, personalized "
    "cover letter that opens with a strong hook, connects the candidate's experience to the role, "
    "highlights 2-3 standout achievements, shows genuine enthusiasm, and closes with a confident "
    "call to action. Match the requested tone and length exactly. "
    "Return ONLY the cover letter text. No commentary, no markdown fences."
)

ANALYZE_SYSTEM = (
    "You are an expert ATS analyst and career coach. Analyze the match between a resume and a job description. "
    "Return ONLY a valid JSON object with exactly these keys: "
    "{ "
    "\"match_score\": <integer 0-100>, "
    "\"verdict\": <\"APPLY\" or \"SKIP\">, "
    "\"h1b_signal\": <\"Likely\" or \"Unlikely\" or \"Unclear\">, "
    "\"matched_keywords\": [<list of strings>], "
    "\"missing_keywords\": [<list of strings>], "
    "\"strengths\": [<list of 3 strings>], "
    "\"gaps\": [<list of 3 strings>], "
    "\"recommendation\": <one sentence string> "
    "} "
    "No explanation, no markdown fences, no commentary. Pure JSON only."
)

INTERVIEW_SYSTEM = (
    "You are an expert technical interviewer and career coach. Generate 10 targeted interview questions "
    "based on the candidate's resume and the job description. Mix question types: Technical, Behavioral, Situational, Role-Specific. "
    "Return ONLY a valid JSON object with exactly these keys: "
    "{ "
    "\"role\": <job title string>, "
    "\"questions\": [ "
    "{ \"question\": <string>, \"category\": <\"Technical\"|\"Behavioral\"|\"Situational\"|\"Role-Specific\">, \"answer\": <model answer string>, \"tip\": <short interviewer tip string> } "
    "] "
    "} "
    "No explanation, no markdown fences, no commentary. Pure JSON only."
)

LENGTH_MAP = {"concise": "3 paragraphs", "standard": "4 paragraphs", "detailed": "5 paragraphs"}

# ── Helpers ───────────────────────────────────────────────────────────────────

def extract_job_title(jd: str) -> str:
    for line in jd.strip().splitlines():
        if line.strip():
            return line.strip()[:100]
    return "Untitled Role"

def build_messages(resume_text, resume_pdf_base64, extra_text):
    if resume_pdf_base64:
        return [{"role": "user", "content": [
            {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": resume_pdf_base64}},
            {"type": "text", "text": extra_text}
        ]}]
    return [{"role": "user", "content": f"My resume:\n\n{resume_text}\n\n{extra_text}"}]

def parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/tailor")
@limiter.limit("20/hour")
async def tailor_resume(body: ResumeRequest, request: Request, user: dict = Depends(get_current_user)):
    if not body.resume_text and not body.resume_pdf_base64:
        raise HTTPException(status_code=400, detail="Resume text or PDF required")
    links = ""
    if body.linkedin: links += f"\nLinkedIn"
    if body.github: links += f"\nGitHub"
    if body.portfolio: links += f"\nPortfolio"
    if links: links = "\n\nInclude these links as clean labels in the contact line only (not full URLs):" + links
    extra = f"Job description:\n\n{body.job_description}{links}\n\nTailor my resume. Return only the tailored resume text."
    messages = build_messages(body.resume_text, body.resume_pdf_base64, extra)
    try:
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=2048,
            system=RESUME_SYSTEM,
            messages=messages,
        )
        tailored = response.content[0].text
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"Claude error: {str(e)}")
    try:
        supabase.table("resumes").insert({
            "user_id": user["id"],
            "original_resume": body.resume_text or "PDF upload",
            "tailored_resume": tailored,
            "job_description": body.job_description,
            "job_title": extract_job_title(body.job_description),
        }).execute()
    except Exception:
        pass
    return {"tailored_resume": tailored}

@app.post("/cover-letter")
@limiter.limit("20/hour")
async def cover_letter(body: CoverLetterRequest, request: Request, user: dict = Depends(get_current_user)):
    if not body.resume_text and not body.resume_pdf_base64:
        raise HTTPException(status_code=400, detail="Resume text or PDF required")
    greeting = f"Dear {body.hiring_manager}" if body.hiring_manager else "Dear Hiring Manager"
    extra = (
        f"Job description:\n\n{body.job_description}\n\n"
        f"Greeting: {greeting}\nCompany: {body.company or 'the company'}\n"
        f"Tone: {body.tone}\nLength: {LENGTH_MAP.get(body.length, '4 paragraphs')}\n\n"
        "Write the cover letter. Return only the cover letter text."
    )
    messages = build_messages(body.resume_text, body.resume_pdf_base64, extra)
    try:
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1024,
            system=COVER_SYSTEM,
            messages=messages,
        )
        return {"cover_letter": response.content[0].text}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"Claude error: {str(e)}")

@app.post("/analyze")
async def analyze_match(body: AnalyzeRequest, request: Request, user: dict = Depends(get_current_user)):
    print("ANALYZE CALLED", body.job_description[:50])
    if not body.resume_text and not body.resume_pdf_base64:
        raise HTTPException(status_code=400, detail="Resume text or PDF required")
    extra = (
        f"Job description:\n\n{body.job_description}\n\n"
        "Analyze the match between my resume and this job description. Return only the JSON object."
    )
    messages = build_messages(body.resume_text, body.resume_pdf_base64, extra)
    try:
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=2048,
            system=ANALYZE_SYSTEM,
            messages=messages,
        )
        print("STOP REASON:", response.stop_reason)
        raw = response.content[0].text
        print("RAW:", raw[:200])
        result = parse_json_response(raw)
        return result
    except json.JSONDecodeError as e:
        print("JSON ERROR:", e)
        raise HTTPException(status_code=502, detail=f"JSON parse error: {str(e)}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"Claude error: {str(e)}")

@app.post("/interview")
@limiter.limit("10/hour")
async def interview_prep(body: InterviewRequest, request: Request, user: dict = Depends(get_current_user)):
    if not body.resume_text and not body.resume_pdf_base64:
        raise HTTPException(status_code=400, detail="Resume text or PDF required")
    extra = (
        f"Job description:\n\n{body.job_description}\n\n"
        "Generate 10 interview questions with model answers for this role based on my resume. Return only the JSON object."
    )
    messages = build_messages(body.resume_text, body.resume_pdf_base64, extra)
    try:
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=2048,
            system=INTERVIEW_SYSTEM,
            messages=messages,
        )
        raw = response.content[0].text
        result = parse_json_response(raw)
        return result
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"JSON parse error: {str(e)}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"Claude error: {str(e)}")

@app.get("/dashboard")
async def get_dashboard(request: Request, user: dict = Depends(get_current_user)):
    result = supabase.table("resumes").select(
        "id, job_title, tailored_resume, job_description, created_at, status"
    ).eq("user_id", user["id"]).order("created_at", desc=True).execute()
    return {"resumes": result.data}

@app.delete("/dashboard/{resume_id}")
async def delete_resume(resume_id: str, request: Request, user: dict = Depends(get_current_user)):
    supabase.table("resumes").delete().eq("id", resume_id).eq("user_id", user["id"]).execute()
    return {"deleted": True}

@app.patch("/dashboard/{resume_id}/status")
async def update_status(resume_id: str, body: StatusUpdate, request: Request, user: dict = Depends(get_current_user)):
    supabase.table("resumes").update({"status": body.status}).eq("id", resume_id).eq("user_id", user["id"]).execute()
    return {"updated": True}
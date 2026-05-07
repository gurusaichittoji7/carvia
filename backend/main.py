import os
import base64
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel
from anthropic import Anthropic
from supabase import create_client, Client
from typing import Optional, Union

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

RESUME_SYSTEM = (
    "You are an expert resume writer. Tailor the given resume to the job description by "
    "naturally weaving in JD keywords, reframing bullet points to highlight relevance, "
    "strengthening the professional summary, and optimizing for ATS. "
    "Be truthful — only use skills and experience already in the resume. "
    "Return ONLY the complete tailored resume text. No commentary, no markdown fences."
)

COVER_SYSTEM = (
    "You are an expert career coach and cover letter writer. Write a compelling, personalized "
    "cover letter that opens with a strong hook, connects the candidate's experience to the role, "
    "highlights 2-3 standout achievements, shows genuine enthusiasm, and closes with a confident "
    "call to action. Match the requested tone and length exactly. "
    "Return ONLY the cover letter text. No commentary, no markdown fences."
)

LENGTH_MAP = {"concise": "3 paragraphs", "standard": "4 paragraphs", "detailed": "5 paragraphs"}

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

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/tailor")
@limiter.limit("20/hour")
async def tailor_resume(body: ResumeRequest, request: Request, user: dict = Depends(get_current_user)):
    if not body.resume_text and not body.resume_pdf_base64:
        raise HTTPException(status_code=400, detail="Resume text or PDF required")
    links = ""
    if body.linkedin: links += f"\nLinkedIn: {body.linkedin}"
    if body.github: links += f"\nGitHub: {body.github}"
    if body.portfolio: links += f"\nPortfolio: {body.portfolio}"
    if links: links = "\n\nInclude these links in the header:" + links
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
        raise HTTPException(status_code=502, detail=f"Claude error: {str(e)}")

@app.get("/dashboard")
async def get_dashboard(request: Request, user: dict = Depends(get_current_user)):
    result = supabase.table("resumes").select(
        "id, job_title, tailored_resume, job_description, created_at"
    ).eq("user_id", user["id"]).order("created_at", desc=True).execute()
    return {"resumes": result.data}

@app.delete("/dashboard/{resume_id}")
async def delete_resume(resume_id: str, request: Request, user: dict = Depends(get_current_user)):
    supabase.table("resumes").delete().eq("id", resume_id).eq("user_id", user["id"]).execute()
    return {"deleted": True}
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject

ROOT = Path(__file__).resolve().parents[1]
PRIMARY = ROOT / "public" / "assets" / "img" / "resume.pdf"
SECONDARY = ROOT / "public" / "img" / "resume.pdf"
OUTPUT = ROOT / "output" / "pdf" / "default-gaming-resume.pdf"

REPLACEMENTS = {
    "https://philippeho27.github.io/my-website/": "https://philippeho.dev/",
    "https://philippeho27.github.io/ChatroomWars/": "https://hidden.philippeho.dev",
}

reader = PdfReader(PRIMARY)
writer = PdfWriter()
writer.clone_document_from_reader(reader)
resolved_targets = set()

for page in writer.pages:
    for annotation_ref in page.get("/Annots", []):
        annotation = annotation_ref.get_object()
        action = annotation.get("/A")
        if not action:
            continue
        uri = action.get("/URI")
        if uri in REPLACEMENTS:
            target = REPLACEMENTS[uri]
            action[NameObject("/URI")] = TextStringObject(target)
            resolved_targets.add(target)
        elif uri in REPLACEMENTS.values():
            resolved_targets.add(str(uri))

missing = set(REPLACEMENTS.values()) - resolved_targets
if missing:
    raise SystemExit(f"Expected PDF link targets not found: {sorted(missing)}")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with OUTPUT.open("wb") as stream:
    writer.write(stream)

payload = OUTPUT.read_bytes()
PRIMARY.write_bytes(payload)
SECONDARY.write_bytes(payload)

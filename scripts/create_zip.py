import os
import zipfile
from pathlib import Path

def zip_project(source_dir, output_zip):
    source_path = Path(source_dir).resolve()
    exclude_dirs = {'.git', '.venv', 'venv', 'node_modules', '__pycache__', 'staticfiles', 'dist', '.gemini'}
    exclude_files = {'.env', '.env.local', '.env.production', '.env.example', 'db.sqlite3'}
    exclude_extensions = {'.pyc', '.pyo', '.log', '.zip', '.sqlite3', '.db'}

    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_path):
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
            
            for file in files:
                if file in exclude_files or file.startswith('.env') or any(file.endswith(ext) for ext in exclude_extensions):
                    print(f"EXCLUDED SECRET/DB FILE: {file}")
                    continue
                file_path = Path(root) / file
                arcname = file_path.relative_to(source_path)
                zipf.write(file_path, arcname)
                print(f"Added: {arcname}")

if __name__ == '__main__':
    project_root = r"d:\VsCode Projects\PKPS Project\PKPS SaaS"
    out_file = r"d:\VsCode Projects\PKPS Project\PKPS SaaS\PKPS_SaaS_Production_Grade.zip"
    zip_project(project_root, out_file)
    print(f"\nSuccessfully created project archive at: {out_file}")

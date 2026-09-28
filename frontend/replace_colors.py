import os
import glob

replacements = {
    "'#FCE8E8'": "'rgba(239, 68, 68, 0.15)'",
    "'#FDF3E1'": "'rgba(245, 158, 11, 0.15)'",
    "'#F0F9F0'": "'rgba(16, 185, 129, 0.15)'",
    "'#E6F6EF'": "'rgba(16, 185, 129, 0.15)'",
    '"#FCE8E8"': "'rgba(239, 68, 68, 0.15)'",
    '"#FDF3E1"': "'rgba(245, 158, 11, 0.15)'",
    '"#F0F9F0"': "'rgba(16, 185, 129, 0.15)'",
    '"#E6F6EF"': "'rgba(16, 185, 129, 0.15)'",
}

def replace_in_files(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for old, new in replacements.items():
                    new_content = new_content.replace(old, new)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {path}")

if __name__ == "__main__":
    replace_in_files('c:/Jal_Rakshak/frontend/src')

import os

for root, _, files in os.walk('c:/Jal_Rakshak/frontend/src'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            if 'className="animate-fade-in-up"' in content:
                new_content = content.replace(' className="animate-fade-in-up"', '')
                new_content = new_content.replace('className="animate-fade-in-up" ', '')
                new_content = new_content.replace('className="animate-fade-in-up"', '')
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {path}')
print('Done.')

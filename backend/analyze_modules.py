import os
import ast

apps = ['academic', 'bursary', 'core', 'data_import', 'emails', 'inventory', 'learning', 'library', 'lms', 'schools', 'transport', 'users']
res = ''

for app in apps:
    try:
        with open(f'{app}/models.py', 'r') as f:
            tree = ast.parse(f.read())
            models = [n.name for n in tree.body if isinstance(n, ast.ClassDef)]
            res += f'\n[{app.upper()}]\nModels: {", ".join(models)}'
    except FileNotFoundError:
        pass

# Ensure scratch directory exists
os.makedirs('../scratch', exist_ok=True)
with open('../scratch/module_analysis.txt', 'w') as f:
    f.write(res)

import re

with open('package.json', 'r') as f:
    content = f.read()

content = re.sub(r'<<<<<<< Updated upstream.*?=======.*?>>>>>>> Stashed changes', '', content, flags=re.DOTALL)
# wait, actually the upstream had some stuff we want. let's just write the whole thing.

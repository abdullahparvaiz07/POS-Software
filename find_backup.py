import json
import os

path = r'C:\Users\User\.gemini\antigravity-ide\brain\3fc20d40-49f2-4401-9871-cba510124483\.system_generated\logs\transcript_full.jsonl'
workspace = r'x:\Internship Projects\restaurant-pos\client\src\components\dashboard\MenuWorkspace.tsx'
menuservice = r'x:\Internship Projects\restaurant-pos\client\src\services\menuService.ts'

# Let's search for the last known state of MenuWorkspace.tsx before today.
# We will look for any replace_file_content or write_to_file calls targeting it,
# or if it was just renamed from MenuWizard.tsx.

menu_workspace_content = None
menu_service_content = None

with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE' and 'tool_calls' in data:
                for tc in data['tool_calls']:
                    # Watch for write_to_file or rename
                    if tc['name'] == 'write_to_file':
                        target = tc['arguments'].get('TargetFile', '')
                        if 'MenuWorkspace.tsx' in target:
                            menu_workspace_content = tc['arguments'].get('CodeContent')
                    # We can also track what was inside menuService.ts before we modified it today
        except Exception:
            pass

if menu_workspace_content:
    print("Found MenuWorkspace.tsx content length:", len(menu_workspace_content))
else:
    print("Could not find MenuWorkspace.tsx content via write_to_file")


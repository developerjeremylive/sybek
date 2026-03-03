// ---------------------------------------------------------------------------
// OpenBrowserClaw — Agent Worker
// ---------------------------------------------------------------------------

import type { WorkerInbound, WorkerOutbound, InvokePayload, CompactPayload, ConversationMessage } from './types.js';
import { DEFAULT_GROUP_ID, DEFAULT_MODEL } from './config.js';
import { ulid } from './ulid.js';

// MCP endpoint for AI chat - use Cloudflare Worker proxy
const CHAT_URL = 'https://kilocode-proxy-live.developerjeremylive.workers.dev/api/ai';

const OPFS_ROOT = 'openbrowserclaw';

self.onmessage = async (event: MessageEvent<WorkerInbound>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'invoke':
      await handleInvoke(payload as InvokePayload);
      break;
    case 'compact':
      await handleCompact(payload as CompactPayload);
      break;
    case 'cancel':
      break;
  }
};

// ---------------------------------------------------------------------------
// Tool definitions for the AI
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'read_file',
    description: 'Read content from a file in the workspace',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file', 
    description: 'Write content to a file in the workspace. Creates or overwrites.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'Content to write' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'list_files',
    description: 'List files in a directory',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path (empty for root)' }
      }
    }
  }
];

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------

async function executeTool(name: string, input: any, groupId: string): Promise<string> {
  try {
    switch (name) {
      case 'read_file': {
        const content = await readGroupFile(groupId, input.path);
        return `File ${input.path}:\n${content}`;
      }
      case 'write_file': {
        await writeGroupFile(groupId, input.path, input.content);
        return `File saved: ${input.path}`;
      }
      case 'list_files': {
        const files = await listGroupFiles(groupId, input.path || '.');
        return `Files in ${input.path || '/'}: ${files.join(', ')}`;
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ---------------------------------------------------------------------------
// OPFS helpers
// ---------------------------------------------------------------------------

// Store current session folder - persists in localStorage
let currentSessionFolder = '';

// Load session folder from localStorage (will be set from main thread)
export function setSessionFolder(folder: string): void {
  currentSessionFolder = folder;
}

// Load context folders from localStorage (will be set from main thread)
let contextFolders: string[] = [];

export function setContextFolders(folders: string[]): void {
  contextFolders = folders;
}

// Generate a unique session folder based on timestamp
function getSessionFolder(): string {
  if (!currentSessionFolder) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    currentSessionFolder = `chat-${dateStr}-${timeStr}`;
  }
  return currentSessionFolder;
}

// Get context about existing files in the session folder and additional context folders
async function getSessionFolderContext(groupId: string): Promise<string> {
  let context = '';
  
  // Always include main session folder if it exists
  let allFolders = contextFolders.filter(f => f !== currentSessionFolder);
  if (currentSessionFolder) {
    allFolders = [currentSessionFolder, ...allFolders];
  }
  
  if (allFolders.length === 0) return '';
  
  try {
    for (const folder of allFolders) {
      const files = await listGroupFiles(groupId, folder);
      if (files.length > 0) {
        context += `\n\n## Archivos en "${folder}":\n`;
        for (const file of files) {
          if (!file.endsWith('/')) {
            try {
              const content = await readGroupFile(groupId, `${folder}/${file}`);
              context += `\n### ${file}\n\`\`\`\n${content.slice(0, 1500)}\n\`\`\`\n`;
            } catch {
              context += `\n### ${file}\n(archivo no legible)\n`;
            }
          }
        }
      }
    }
    return context;
  } catch (e) {
    return '';
  }
}

// Auto-save code files from AI response - Edit existing files based on user intent
async function autoSaveCodeFiles(groupId: string, userMessage: string, aiResponse: string): Promise<string[]> {
  const savedFiles: string[] = [];
  const content = aiResponse; // alias for compatibility
  
  // Use context folders if available, otherwise use session folder
  let targetFolders = [...contextFolders];
  if (currentSessionFolder && !targetFolders.includes(currentSessionFolder)) {
    targetFolders = [currentSessionFolder, ...targetFolders];
  }
  
  if (targetFolders.length === 0) {
    targetFolders = [getSessionFolder()];
  }
  
  const targetFolder = targetFolders[0];
  
  // Check what files already exist in the folder
  let existingFiles: string[] = [];
  try {
    existingFiles = await listGroupFiles(groupId, targetFolder);
  } catch {}
  
  const hasHtml = existingFiles.includes('index.html');
  const hasCss = existingFiles.includes('styles.css');
  const hasJs = existingFiles.includes('script.js');
  
  // Detect user intent from message
  const lowerMessage = userMessage.toLowerCase();
  
  // If user wants to remove duplicates or fix issues
  const wantsFixFooter = lowerMessage.includes('footer') && (lowerMessage.includes('eliminar') || lowerMessage.includes('remove') || lowerMessage.includes('delete') || lowerMessage.includes('duplicado') || lowerMessage.includes('duplicate') || lowerMessage.includes('quitar'));
  const wantsFixHeader = lowerMessage.includes('header') && (lowerMessage.includes('eliminar') || lowerMessage.includes('remove') || lowerMessage.includes('delete') || lowerMessage.includes('duplicado') || lowerMessage.includes('duplicate') || lowerMessage.includes('quitar'));
  
  if ((wantsFixFooter || wantsFixHeader) && hasHtml) {
    try {
      const htmlPath = `${targetFolder}/index.html`;
      let htmlContent = await readGroupFile(groupId, htmlPath);
      let modified = false;
      
      // Remove duplicate footers ONLY if specifically asked
      if (wantsFixFooter) {
        const footerMatches = htmlContent.match(/<footer[\s\S]*?<\/footer>/gi);
        if (footerMatches && footerMatches.length > 1) {
          htmlContent = htmlContent.replace(/<footer[\s\S]*?<\/footer>/gi, (match, index) => {
            if (index === 0) return match;
            modified = true;
            return '';
          });
          htmlContent = htmlContent.replace(/\n\s*\n\s*\n/g, '\n\n');
          log(groupId, 'file-updated', 'Footer eliminado', 'Eliminado footer duplicado');
        }
      }
      
      // Remove duplicate headers ONLY if specifically asked
      if (wantsFixHeader) {
        const headerMatches = htmlContent.match(/<header[\s\S]*?<\/header>/gi);
        if (headerMatches && headerMatches.length > 1) {
          htmlContent = htmlContent.replace(/<header[\s\S]*?<\/header>/gi, (match, index) => {
            if (index === 0) return match;
            modified = true;
            return '';
          });
          htmlContent = htmlContent.replace(/\n\s*\n\s*\n/g, '\n\n');
          log(groupId, 'file-updated', 'Header eliminado', 'Eliminado header duplicado');
        }
      }
      
      if (modified) {
        await writeGroupFile(groupId, htmlPath, htmlContent);
        savedFiles.push(htmlPath);
        return savedFiles;
      }
    } catch (e) {
      log(groupId, 'file-error', 'Error fix', String(e));
    }
  }
  
  // If user wants to improve UI/UX design - add modern styles
  const wantsImprove = lowerMessage.includes('mejorar') || lowerMessage.includes('improve') || lowerMessage.includes(' design') || lowerMessage.includes(' ui') || lowerMessage.includes('ux') || lowerMessage.includes('upgrade') || lowerMessage.includes('enhance') || lowerMessage.includes('modern') || lowerMessage.includes('diseno') || lowerMessage.includes('disen') || lowerMessage.includes('dise') || lowerMessage.includes('diseño') || lowerMessage.includes('estilo') || lowerMessage.includes('style');
  
  if (wantsImprove && hasHtml) {
    try {
      const htmlPath = `${targetFolder}/index.html`;
      const cssPath = `${targetFolder}/styles.css`;
      let htmlContent = await readGroupFile(groupId, htmlPath);
      let cssContent = hasCss ? await readGroupFile(groupId, cssPath) : '';
      
      const modernStyles = `
/* Modern UI/UX */
:root {--primary:#6366f1;--primary-dark:#4f46e5;--secondary:#a855f7;--dark:#1a1a2e}*{scroll-behavior:smooth}body{font-family:'Inter',sans-serif;line-height:1.6;color:#334155;margin:0}header{background:#1a1a2e;padding:1rem 0}header+*,main+*{padding-top:0}.header-container{max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;padding:0 2rem}.logo{font-size:1.5rem;font-weight:700;background:linear-gradient(135deg,var(--primary),var(--secondary));-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-decoration:none}header nav ul{display:flex;gap:2rem;list-style:none;margin:0;padding:0}header nav a{color:#e2e8f0;text-decoration:none;font-weight:500;transition:color .3s}header nav a:hover{color:#fff}.hero{min-height:80vh;display:flex;align-items:center;justify-content:center;text-align:center;background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);color:#fff;padding:4rem 2rem}.hero h1{font-size:3rem;font-weight:800;margin-bottom:1rem}.hero p{font-size:1.1rem;opacity:.9;max-width:600px;margin:0 auto 2rem}.btn{display:inline-block;padding:.875rem 2rem;border-radius:50px;font-weight:600;text-decoration:none;transition:all .3s}.btn-primary{background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;box-shadow:0 4px 15px rgba(99,102,241,.4)}.btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(99,102,241,.6)}section{padding:4rem 2rem}.container{max-width:1200px;margin:0 auto}.features{background:#f8fafc}.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem;margin-top:2rem}.feature-card{background:#fff;padding:2rem;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,.05);transition:all .3s}.feature-card:hover{transform:translateY(-5px);box-shadow:0 10px 30px rgba(0,0,0,.1)}footer{background:var(--dark);color:#94a3b8;padding:2rem;text-align:center}@media(max-width:768px){.hero h1{font-size:2rem}header nav{display:none}}`;
      
      if (cssContent && !cssContent.includes('Modern UI/UX')) {
        cssContent += '\n' + modernStyles;
        await writeGroupFile(groupId, cssPath, cssContent);
        savedFiles.push(cssPath);
        log(groupId, 'file-updated', 'UI/UX Mejorado', 'Estilos modernos aplicados');
      } else if (!cssContent) {
        await writeGroupFile(groupId, cssPath, modernStyles);
        savedFiles.push(cssPath);
        log(groupId, 'file-updated', 'UI/UX Creado', 'Estilos modernos creados');
      } else {
        // User requested improvement - apply anyway
        cssContent += '\n' + modernStyles;
        await writeGroupFile(groupId, cssPath, cssContent);
        savedFiles.push(cssPath);
        log(groupId, 'file-updated', 'UI/UX Mejorado', 'Estilos modernos aplicados');
      }
      
      return savedFiles;
    } catch (e) {
      log(groupId, 'file-error', 'Error UI/UX', String(e));
    }
  }
  
  // If user wants to add header/footer - analyze existing content and edit
  if ((lowerMessage.includes('header') || lowerMessage.includes('footer') || lowerMessage.includes('agregar') || lowerMessage.includes('añadir') || lowerMessage.includes('modificar')) && hasHtml) {
    try {
      const htmlPath = `${targetFolder}/index.html`;
      let htmlContent = await readGroupFile(groupId, htmlPath);
      
      // Analyze existing HTML to detect navigation sections
      const sections: string[] = [];
      const sectionRegex = /<section[^>]*id=["']([^"']+)["'][^>]*>/gi;
      let match;
      while ((match = sectionRegex.exec(htmlContent)) !== null) {
        sections.push(match[1]);
      }
      
      // Also detect anchor links in existing content
      const anchorRegex = /<a[^>]+href=["']#([^"']+)["'][^>]*>/gi;
      while ((match = anchorRegex.exec(htmlContent)) !== null) {
        if (!sections.includes(match[1]) && match[1]) {
          sections.push(match[1]);
        }
      }
      
      // Build navigation based on detected sections
      const navLinks = sections.length > 0 
        ? sections.map(s => `<li><a href="#${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</a></li>`).join('\n        ')
        : '<li><a href="#inicio">Inicio</a></li>\n        <li><a href="#servicios">Servicios</a></li>\n        <li><a href="#contacto">Contacto</a></li>';
      
      // Add header if requested - only if not already exists
      if ((lowerMessage.includes('header') || lowerMessage.includes('agregar') || lowerMessage.includes('añadir')) && !htmlContent.includes('<header')) {
        const headerCode = `
  <header>
    <nav>
      <ul>
        <li><a href="#inicio">Inicio</a></li>
        <li><a href="#servicios">Servicios</a></li>
        <li><a href="#contacto">Contacto</a></li>
      </ul>
    </nav>
  </header>`;
        
        // Add header after <body> or at beginning of body content
        if (htmlContent.includes('<body>')) {
          htmlContent = htmlContent.replace('<body>', '<body>\n' + headerCode);
        } else if (htmlContent.includes('<body ')) {
          htmlContent = htmlContent.replace(/<body [^>]*>/, match => match + '\n' + headerCode);
        }
      }
      
      // Add footer if requested - only if not already exists
      if ((lowerMessage.includes('footer') || lowerMessage.includes('pie') || lowerMessage.includes('agregar') || lowerMessage.includes('añadir')) && !htmlContent.includes('<footer')) {
        const footerCode = `
  <footer>
    <p>&copy; 2026 Mi Empresa. Todos los derechos reservados.</p>
  </footer>`;
        
        // Add footer before </body>
        if (htmlContent.includes('</body>')) {
          htmlContent = htmlContent.replace('</body>', footerCode + '\n</body>');
        }
      }
      
      // Save updated HTML
      await writeGroupFile(groupId, htmlPath, htmlContent);
      savedFiles.push(htmlPath);
      log(groupId, 'file-updated', 'Edited HTML', `Agregado header/footer a ${htmlPath}`);
      
      // Also update CSS if needed
      if (hasCss) {
        const cssPath = `${targetFolder}/styles.css`;
        let cssContent = await readGroupFile(groupId, cssPath);
        
        // Add header/footer styles
        const additionalStyles = `
/* Header */
header {
  background: #1a1a2e;
  color: white;
  padding: 1rem;
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
}
header nav ul {
  list-style: none;
  display: flex;
  gap: 1rem;
  margin: 0;
  padding: 0;
}
header nav a {
  color: white;
  text-decoration: none;
}
header nav a:hover {
  color: #6366f1;
}

/* Footer */
footer {
  background: #1a1a2e;
  color: white;
  padding: 2rem;
  text-align: center;
  margin-top: auto;
}`;
        
        if (!cssContent.includes('/* Header */')) {
          cssContent += additionalStyles;
          await writeGroupFile(groupId, cssPath, cssContent);
          savedFiles.push(cssPath);
          log(groupId, 'file-updated', 'Edited CSS', `Agregado estilos a ${cssPath}`);
        }
      }
      
      return savedFiles;
    } catch (e) {
      log(groupId, 'file-error', 'Failed to edit', String(e));
    }
  }
  
  // Original auto-save logic for new files only (only if no existing files)
  
  // Patterns to detect code that should be saved
  const patterns = [
    { regex: /<!DOCTYPE html>[\s\S]*?<\/html>/gi, ext: 'html', name: 'index.html' },
    { regex: /<html[\s\S]*?<\/html>/gi, ext: 'html', name: 'index.html' },
    { regex: /<style>[\s\S]*?<\/style>/gi, ext: 'css', name: 'styles.css' },
    { regex: /<script>[\s\S]*?<\/script>/gi, ext: 'js', name: 'script.js' },
  ];
  
  // Also check for marked code blocks
  const codeBlockRegex = /```(?:html|css|javascript|js)?\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const code = match[1].trim();
    if (code.length < 50) continue; // Skip too short blocks
    
    // Determine file type from content
    let fileName = 'code.txt';
    if (code.includes('<html') || code.includes('<!DOCTYPE')) fileName = 'index.html';
    else if (code.includes('<style') || (code.includes('{') && code.includes(';') && !code.includes('function'))) fileName = 'styles.css';
    else if (code.includes('function') || code.includes('const ') || code.includes('let ') || code.includes('=>')) fileName = 'script.js';
    else if (code.includes('import ') || code.includes('export ')) fileName = 'module.js';
    
    // Skip if file already exists - don't overwrite!
    if (existingFiles.includes(fileName)) {
      log(groupId, 'file-skip', 'File exists', `${targetFolder}/${fileName} - no se Sobrescribe`);
      continue;
    }
    
    try {
      const filePath = `${targetFolder}/${fileName}`;
      await writeGroupFile(groupId, filePath, code);
      savedFiles.push(filePath);
      log(groupId, 'file-saved', 'Auto-saved', filePath);
    } catch (e) {
      log(groupId, 'file-error', 'Failed to save', fileName);
    }
  }
  
  // Check for inline HTML/CSS/JS
  for (const pattern of patterns) {
    const matches = content.match(pattern.regex);
    if (matches) {
      for (const code of matches) {
        const cleanCode = code.replace(/<\/?(style|script)[^>]*>/gi, '');
        if (cleanCode.length < 50) continue;
        
        // Skip if file already exists - don't overwrite!
        if (existingFiles.includes(pattern.name)) {
          log(groupId, 'file-skip', 'File exists', `${targetFolder}/${pattern.name} - no se sobrescribe`);
          continue;
        }
        
        try {
          const filePath = `${targetFolder}/${pattern.name}`;
          await writeGroupFile(groupId, filePath, cleanCode);
          if (!savedFiles.includes(filePath)) {
            savedFiles.push(filePath);
            log(groupId, 'file-saved', 'Auto-saved', filePath);
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  }
  
  return savedFiles;
}

async function getGroupDir(groupId: string): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  const safeId = groupId.replace(/:/g, '-');
  
  let current = await root.getDirectoryHandle(OPFS_ROOT, { create: true });
  current = await current.getDirectoryHandle('groups', { create: true });
  current = await current.getDirectoryHandle(safeId, { create: true });
  // Files directly in group folder, not in workspace subfolder
  return current;
}

function parsePath(filePath: string): { dirs: string[]; filename: string } {
  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 0) throw new Error('Empty file path');
  const filename = parts.pop()!;
  return { dirs: parts, filename };
}

async function readGroupFile(groupId: string, filePath: string): Promise<string> {
  const dir = await getGroupDir(groupId);
  const { dirs, filename } = parsePath(filePath);
  
  let current = dir;
  for (const seg of dirs) {
    current = await current.getDirectoryHandle(seg);
  }
  
  const fileHandle = await current.getFileHandle(filename);
  const file = await fileHandle.getFile();
  return file.text();
}

async function writeGroupFile(groupId: string, filePath: string, content: string): Promise<void> {
  const dir = await getGroupDir(groupId);
  const { dirs, filename } = parsePath(filePath);
  
  let current = dir;
  for (const seg of dirs) {
    current = await current.getDirectoryHandle(seg, { create: true });
  }
  
  const fileHandle = await current.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function listGroupFiles(groupId: string, dirPath: string = '.'): Promise<string[]> {
  const dir = await getGroupDir(groupId);
  
  let current = dir;
  if (dirPath && dirPath !== '.') {
    const parts = dirPath.replace(/\\/g, '/').replace(/^\/+/, '').split('/').filter(Boolean);
    for (const seg of parts) {
      current = await current.getDirectoryHandle(seg);
    }
  }
  
  const entries: string[] = [];
  for await (const [name, handle] of current.entries()) {
    entries.push(handle.kind === 'directory' ? `${name}/` : name);
  }
  return entries.sort();
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

async function handleInvoke(payload: InvokePayload): Promise<void> {
  const { groupId = DEFAULT_GROUP_ID, messages, systemPrompt, model = DEFAULT_MODEL, maxTokens = 4096, sessionFolder, contextFolders, fileContext } = payload;

  // Use first context folder as working folder if available, otherwise use sessionFolder
  if (contextFolders && contextFolders.length > 0) {
    currentSessionFolder = contextFolders[0];
  } else if (sessionFolder) {
    currentSessionFolder = sessionFolder;
  } else if (!currentSessionFolder) {
    getSessionFolder();
  }
  
  // Set context folders from payload
  if (contextFolders) {
    setContextFolders(contextFolders);
  }

  // Use fileContext from payload if available, otherwise build from folders
  const folderContext = fileContext || await getSessionFolderContext(groupId);
  
  // Add explicit instructions about editing existing files
  const editInstructions = folderContext ? `

## 🚨 IMPORTANTE - NO CREES ARCHIVOS NUEVOS:

Los siguientes archivos YA EXISTEN en tu contexto:
${folderContext}

Cuando el usuario pida AGREGAR, MODIFICAR, EDITAR o CAMBIAR algo:
1. NO crees archivos nuevos - los archivos arriba YA EXISTEN
2. Usa write_file para ACTUALIZAR el archivo existente
3. Si el usuario dice "agrega header" - necesitas:
   a) Leer el contenido actual del archivo HTML
   b) Agregar el código al archivo existente
   c) Usar write_file para GUARDAR los cambios

Ejemplo INCORRECTO: "crear nuevo archivo"
Ejemplo CORRECTO: "usar write_file para actualizar index.html existente"

IMPORTANTE: Si ves "file-skip: no se sobrescribe" significa que NO debes guardar ahí.
` : '';
  
  // Append folder context to system prompt
  const fullSystemPrompt = systemPrompt + editInstructions;

  post({ type: 'typing', payload: { groupId } });
  log(groupId, 'info', 'Starting', `Model: ${model}, Session: ${currentSessionFolder}, Files: ${folderContext ? 'yes' : 'no'}`);

  try {
    let currentMessages: ConversationMessage[] = [...messages];
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;

      log(groupId, 'api-call', `API call #${iterations}`, `${currentMessages.length} messages`);

      // Build messages with tools
      const chatMessages = [
        { role: 'system', content: fullSystemPrompt },
        ...currentMessages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : '' }))
      ];

      const requestBody: any = {
        messages: chatMessages,
        model,
        max_tokens: maxTokens,
      };

      // Note: Workers AI doesn't support tools in the same way as Anthropic
      // Tools are handled separately
      // if (iterations === 1) {
      //   requestBody.tools = TOOLS;
      // }

      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`API error ${res.status}: ${errBody}`);
      }

      const result = await res.json();
      
      // Try multiple response formats (Workers AI returns different format)
      let responseContent = '';
      if (result.response) {
        // Anthropic-style or custom format
        responseContent = typeof result.response === 'string' ? result.response : JSON.stringify(result.response);
      } else if (result.result && result.result.response) {
        // Workers AI format
        responseContent = typeof result.result.response === 'string' ? result.result.response : JSON.stringify(result.result.response);
      } else if (result.messages && result.messages.length > 0) {
        // Array of messages
        responseContent = result.messages.map((m: any) => m.content || m.response || '').join('');
      } else if (result.choices && result.choices.length > 0) {
        // OpenAI-style
        responseContent = result.choices[0].message?.content || '';
      } else if (typeof result === 'string') {
        responseContent = result;
      } else {
        // Fallback: stringify everything
        responseContent = JSON.stringify(result);
      }
      
      log(groupId, 'text', 'Response', responseContent.slice(0, 200));

      // Get user's last message for intent detection
      const userMessage = currentMessages.length > 0 
        ? currentMessages[currentMessages.length - 1].content?.toString() || ''
        : '';

      // AUTO-SAVE FILES: Extract code blocks and save them automatically
      const savedFiles = await autoSaveCodeFiles(groupId, userMessage, responseContent);
      
      // Generate summary response - remove code blocks from chat response
      let summaryResponse = responseContent;
      
      // If files were edited/saved, show summary instead of code
      if (savedFiles.length > 0) {
        // Remove code blocks from response
        summaryResponse = responseContent.replace(/```[\s\S]*?```/g, '');
        summaryResponse = summaryResponse.replace(/<style>[\s\S]*?<\/style>/gi, '');
        summaryResponse = summaryResponse.replace(/<script>[\s\S]*?<\/script>/gi, '');
        
        // Extract just the main message (first paragraph or key sentences)
        const lines = summaryResponse.split('\n').filter(l => l.trim() && !l.startsWith('#'));
        const summary = lines.slice(0, 3).join(' ').slice(0, 300);
        
        summaryResponse = `✅ ${savedFiles.length} archivo(s) actualizado(s):\n\n${savedFiles.map(f => `📄 ${f.split('/').pop()}`).join('\n')}\n\nLos cambios se han guardado directamente en los archivos.`;
      }
      
      // Return the cleaned summary response
      currentMessages.push({ role: 'assistant', content: responseContent });
      currentMessages.push({ role: 'user', content: `Tool result: Archivos actualizados` });
      
      // Final response is the summary
      const finalResponse = summaryResponse;

      // Check for tool calls - try multiple formats
      let toolCalls: any[] = [];
      
      if (result.tool_calls && Array.isArray(result.tool_calls)) {
        toolCalls = result.tool_calls;
      } else if (result.tools && Array.isArray(result.tools)) {
        toolCalls = result.tools;
      }
      
      // Also check for tool calls in response content (some APIs return them as text)
      const toolCallMatch = responseContent.match(/<tool_call>(.*?)<\/tool_call>/);
      if (toolCallMatch) {
        try {
          toolCalls = JSON.parse(toolCallMatch[1]);
        } catch {}
      }

      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          let toolName = '';
          let toolInput: Record<string, any> = {};
          
          // Handle different tool call formats
          if (typeof toolCall === 'string') {
            toolName = toolCall;
          } else if (toolCall && typeof toolCall === 'object') {
            toolName = (toolCall as any).name || (toolCall as any).tool || '';
            toolInput = (toolCall as any).input || {};
          }
          
          if (!toolName) continue;
          
          log(groupId, 'tool-call', `Tool: ${toolName}`, JSON.stringify(toolInput).slice(0, 100));
          
          post({ type: 'tool-activity', payload: { groupId, tool: toolName, status: 'running' } });

          // Execute tool
          const toolResult = await executeTool(toolName, toolInput, groupId);
          
          log(groupId, 'tool-result', `Result: ${toolName}`, toolResult.slice(0, 200));
          
          post({ type: 'tool-activity', payload: { groupId, tool: toolName, status: 'done' } });

          currentMessages.push({ role: 'assistant', content: responseContent });
          currentMessages.push({ role: 'user', content: `Tool ${toolName} result: ${toolResult}` });
        }
        
        post({ type: 'typing', payload: { groupId } });
      } else {
        // Final response - no tools - use summary if files were edited
        const cleaned = (finalResponse || responseContent).replace(/<internal>[\s\S]*?<\/internal>/g, '').replace(/```[\s\S]*?```/g, '').replace(/<style>[\s\S]*?<\/style>/gi, '').replace(/<script>[\s\S]*?<\/script>/gi, '').trim();
        post({ type: 'response', payload: { groupId, text: cleaned || '(no response)' } });
        return;
      }
    }

    post({ type: 'response', payload: { groupId, text: '(max iterations reached)' } });
  } catch (err) {
    console.error('[agent-worker] Error:', err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    post({ type: 'error', payload: { groupId, error: errorMsg } });
  }
}

async function handleCompact(payload: CompactPayload): Promise<void> {
  const { groupId } = payload;
  post({ type: 'compact-done', payload: { groupId, summary: 'Compacted' } });
}

function post(msg: WorkerOutbound): void {
  self.postMessage(msg);
}

function log(groupId: string, kind: 'api-call' | 'tool-call' | 'tool-result' | 'text' | 'info' | 'file-saved' | 'file-error' | 'file-created' | 'file-updated' | 'file-skip', label: string, detail: string): void {
  const entry = { groupId, id: ulid(), timestamp: Date.now(), kind, label, detail };
  post({ type: 'thinking-log', payload: entry });
}

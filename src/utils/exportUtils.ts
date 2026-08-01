/**
 * Client-side Report Export Utility Module
 */

export { downloadPPTXPresentation } from './pptxExport';


/**
 * Download raw Markdown string as a .md file
 */
export function downloadMarkdownFile(content: string, filename: string = 'yonetici_raporu.md'): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert Markdown report into a standalone, beautifully styled HTML document and download as .html file
 */
export function downloadHTMLFile(
  markdownText: string,
  filename: string = 'yonetici_raporu.html',
  title: string = 'Gemini AI Yönetici Raporu'
): void {
  let bodyHtml = markdownText
    .replace(/^### (.*$)/gim, '<h3 style="color:#818cf8; font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight:700;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color:#6366f1; font-size: 1.5rem; margin-top: 1.75rem; margin-bottom: 0.75rem; font-weight:800; border-bottom: 1px solid #334155; padding-bottom: 0.5rem;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color:#f8fafc; font-size: 1.875rem; margin-top: 2rem; margin-bottom: 1rem; font-weight:800;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#a5b4fc;">$1</strong>')
    .replace(/^\* (.*$)/gim, '<li style="margin-left: 1.25rem; margin-bottom: 0.25rem; color:#cbd5e1;">$1</li>')
    .replace(/^- (.*$)/gim, '<li style="margin-left: 1.25rem; margin-bottom: 0.25rem; color:#cbd5e1;">$1</li>')
    .replace(/`([^`]+)`/g, '<code style="background-color:#0f172a; color:#34d399; padding:2px 6px; border-radius:4px; font-family:monospace;">$1</code>')
    .replace(/\n\n/g, '<br/><br/>');

  const fullHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: #090d16;
      color: #f8fafc;
      margin: 0;
      padding: 40px 20px;
      line-height: 1.7;
    }
    .report-card {
      max-width: 900px;
      margin: 0 auto;
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .header {
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #f8fafc;
      margin: 0;
    }
    .subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin: 4px 0 0 0;
    }
    .badge {
      background-color: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .content {
      font-size: 15px;
      color: #e2e8f0;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
    }
    @media print {
      body { background-color: #ffffff; color: #000000; padding: 0; }
      .report-card { border: none; box-shadow: none; padding: 0; background: none; }
      h1, h2, h3 { color: #000000 !important; }
      strong { color: #000000 !important; }
      .badge { display: none; }
    }
  </style>
</head>
<body>
  <div class="report-card">
    <div class="header">
      <div>
        <h1 class="title">📊 Gemini AI Yönetici Raporu</h1>
        <p class="subtitle">DataGravity-AI Analyst • Gemini 3.6 Flash Engine</p>
      </div>
      <span class="badge">Otomatik Üretilmiş İş Raporu</span>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      <span>Tarih: ${new Date().toLocaleDateString('tr-TR')}</span>
      <span>DataGravity-AI Data Analytics Platform</span>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFilename = filename.endsWith('.html') ? filename : `${filename}.html`;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger browser print dialog for PDF export
 */
export function triggerPrintOrPDF(): void {
  window.print();
}

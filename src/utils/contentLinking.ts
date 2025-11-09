import { Procedure, System, ConversationScript, KnowledgeArticle } from '../types/database';

interface ContentReference {
  text: string;
  type: 'procedure' | 'system' | 'script' | 'article';
  id: string;
  title: string;
}

export function detectContentReferences(
  text: string,
  procedures: Procedure[],
  systems: System[],
  scripts: ConversationScript[],
  articles: KnowledgeArticle[]
): ContentReference[] {
  const references: ContentReference[] = [];

  procedures.forEach(procedure => {
    const regex = new RegExp(`נוהל\\s+${procedure.title}|${procedure.title}`, 'gi');
    if (regex.test(text)) {
      references.push({
        text: procedure.title,
        type: 'procedure',
        id: procedure.id,
        title: procedure.title
      });
    }
  });

  systems.forEach(system => {
    const regex = new RegExp(`מערכת\\s+${system.name}|${system.name}`, 'gi');
    if (regex.test(text)) {
      references.push({
        text: system.name,
        type: 'system',
        id: system.id,
        title: system.name
      });
    }
  });

  scripts.forEach(script => {
    const regex = new RegExp(`תסריט\\s+${script.title}|${script.title}`, 'gi');
    if (regex.test(text)) {
      references.push({
        text: script.title,
        type: 'script',
        id: script.id,
        title: script.title
      });
    }
  });

  articles.forEach(article => {
    const regex = new RegExp(`מאמר\\s+${article.title}|${article.title}`, 'gi');
    if (regex.test(text)) {
      references.push({
        text: article.title,
        type: 'article',
        id: article.id,
        title: article.title
      });
    }
  });

  return references;
}

export function createSmartLinks(
  text: string,
  procedures: Procedure[],
  systems: System[],
  scripts: ConversationScript[],
  articles: KnowledgeArticle[]
): string {
  let linkedText = text;

  procedures.forEach(procedure => {
    const regex = new RegExp(`(נוהל\\s+${procedure.title}|${procedure.title})`, 'gi');
    linkedText = linkedText.replace(
      regex,
      `<a href="/procedures?id=${procedure.id}" class="smart-link smart-link-procedure" data-type="procedure" data-id="${procedure.id}">$1</a>`
    );
  });

  systems.forEach(system => {
    const regex = new RegExp(`(מערכת\\s+${system.name}|${system.name})`, 'gi');
    linkedText = linkedText.replace(
      regex,
      `<a href="/systems?id=${system.id}" class="smart-link smart-link-system" data-type="system" data-id="${system.id}">$1</a>`
    );
  });

  scripts.forEach(script => {
    const regex = new RegExp(`(תסריט\\s+${script.title}|${script.title})`, 'gi');
    linkedText = linkedText.replace(
      regex,
      `<a href="/scripts?id=${script.id}" class="smart-link smart-link-script" data-type="script" data-id="${script.id}">$1</a>`
    );
  });

  articles.forEach(article => {
    const regex = new RegExp(`(מאמר\\s+${article.title}|${article.title})`, 'gi');
    linkedText = linkedText.replace(
      regex,
      `<a href="/knowledge?id=${article.id}" class="smart-link smart-link-article" data-type="article" data-id="${article.id}">$1</a>`
    );
  });

  return linkedText;
}

export function getReferencedItems(
  text: string,
  procedures: Procedure[],
  systems: System[],
  scripts: ConversationScript[],
  articles: KnowledgeArticle[]
): Array<{type: string; id: string; title: string}> {
  const references = detectContentReferences(text, procedures, systems, scripts, articles);
  return references.map(ref => ({
    type: ref.type,
    id: ref.id,
    title: ref.title
  }));
}

export const SERVICES = [
  { slug: "sites", code: "01", title: "Sites", line: "Institucionais, landing pages e e-commerce rápidos, acessíveis e fáceis de editar.", benefits: ["Carregamento rápido e SEO técnico", "Painel para editar conteúdo", "Design próprio, sem template genérico"] },
  { slug: "apps", code: "02", title: "Aplicativos", line: "Apps web e mobile com foco no fluxo real de quem usa.", benefits: ["Protótipo navegável antes do código", "Login, pagamentos e notificações", "Publicação nas lojas"] },
  { slug: "sistemas", code: "03", title: "Sistemas sob medida", line: "Ferramentas internas, ERPs leves, CRMs e painéis que substituem planilhas.", benefits: ["Permissões por perfil", "Relatórios e exportações", "Integração com o que você já usa"] },
  { slug: "plataformas", code: "04", title: "Plataformas e comunidades", line: "Redes, marketplaces e áreas de membros com conteúdo, chat e moderação.", benefits: ["Perfis, feed e mensagens em tempo real", "Moderação e denúncias", "Base pronta para escalar"] },
  { slug: "automacao", code: "05", title: "Automação e IA", line: "Fluxos que eliminam tarefas repetitivas e assistentes treinados no seu contexto.", benefits: ["Mapeamento do processo atual", "Integrações via API", "IA com limites claros e auditáveis"] },
  { slug: "consultoria", code: "06", title: "Consultoria digital", line: "Diagnóstico técnico, escolha de stack e plano de produto antes de investir.", benefits: ["Auditoria de código e performance", "Roadmap priorizado", "Acompanhamento do time"] },
] as const;

export const METHOD = [
  { step: "descobrir", text: "Conversa sobre o problema, público e restrições. Sai daqui um escopo escrito." },
  { step: "desenhar", text: "Fluxos e telas navegáveis. Você valida antes de qualquer linha de código." },
  { step: "construir", text: "Entregas curtas com links de prévia. Você acompanha o progresso real." },
  { step: "lançar", text: "Publicação, monitoramento e ajustes com dados de uso." },
  { step: "evoluir", text: "Suporte contínuo e novas funcionalidades conforme o produto cresce." },
] as const;

export const PORTFOLIO_CATEGORIES = [
  { value: "all", label: "Todos" },
  { value: "site", label: "Sites" },
  { value: "app", label: "Apps" },
  { value: "sistema", label: "Sistemas" },
  { value: "plataforma", label: "Plataformas" },
  { value: "automacao", label: "Automação" },
  { value: "consultoria", label: "Consultoria" },
] as const;

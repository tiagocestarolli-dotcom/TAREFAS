# Prompt Mestre — App "Tarefas" (TC Development)

> **Como usar este documento:** cole o conteúdo desta seção no início de uma nova conversa com Claude (ou outro LLM) para recriar o app do zero ou continuar o desenvolvimento. Ele contém todo o contexto, decisões e armadilhas aprendidas na construção original.

---

## 1. CONTEXTO E OBJETIVO

Construir um **aplicativo pessoal de registro diário de tarefas realizadas** para o Tiago (TC Development). Não é um todo-list comum — é um diário de produtividade onde se registra **o que foi feito** a cada dia, gerando relatórios periódicos em PDF para revisão.

**Quem usa:** apenas o próprio Tiago, em **desktop (Mac) e iPhone**, com sincronização em tempo real entre os dois dispositivos.

**Premissas críticas:**
- Tiago não é desenvolvedor — qualquer setup precisa ser passo-a-passo e via interface gráfica, sem terminal/código
- Deve ser **100% gratuito**, sem cadastrar cartão de crédito
- Deve funcionar **offline** no celular (PWA)
- Não pode perder dados — backup automático na nuvem desde o primeiro uso

---

## 2. FUNCIONALIDADES (do MVP ao completo)

### Núcleo
- Adicionar tarefa com **data** (datepicker) e **texto livre**
- Lista organizada **por dia**, do mais recente para o mais antigo
- Editar / excluir tarefas (modal)
- **Autocompletar inteligente** baseado no histórico: conforme digita, mostra tarefas frequentes ordenadas por contagem de uso. Setas ↑/↓ navegam, Tab/Enter selecionam
- Estatísticas no topo: total de tarefas, dias com registro, tarefas de hoje

### Categorias coloridas
- Sistema de categorias com nome + cor (default: Geral cinza, Reunião azul, Desenvolvimento verde, Pessoal laranja, Urgente vermelho)
- Selecionável via "chips" coloridos abaixo do input
- Modal de gerenciar categorias (criar/editar/excluir, color picker nativo)
- Toggle **"colorir texto"** por categoria: quando ligado, o texto da tarefa aparece na cor da categoria; quando desligado, só a barra lateral e a etiqueta ficam coloridas

### Fotos
- Botões **📷 Câmera** e **🖼 Galeria** ao adicionar tarefa
- No iPhone, abrem a câmera ou rolo nativamente (`<input capture="environment">`)
- Compressão client-side automática (~800px, JPEG q=0.75, ~50-100KB)
- Salvas como base64 numa **subcoleção do Firestore** (`tarefas/{syncCode}/photos/{photoId}`), **NÃO no Firebase Storage** (ver pitfall #2)
- Thumbnails inline na lista de tarefas, clicar abre viewer fullscreen com navegação
- Fotos podem ser adicionadas/removidas no modal de editar

### Importar de planilha Excel
- Suporta `.xlsx`, `.xls`, `.csv` via biblioteca **SheetJS (xlsx)** do CDN
- Modal pede para escolher: planilha (aba), coluna da data, coluna da tarefa
- Detecção automática de colunas comuns ("Data", "Tarefa", "Dia")
- Pré-visualização com validação antes de importar
- Robusto a formatos brasileiros: `dd/mm/aaaa`, números de série Excel, datas com mês errado (corrige pelo nome da aba)
- Sem duplicar (dedup por data+texto)

### Backup / Restaurar JSON
- Botão **⬇ Backup** baixa JSON completo (tarefas + histórico + categorias)
- Botão **⬆ Restaurar** lê JSON e mescla sem duplicar
- Para migração entre ambientes ou backup manual

### Relatório PDF
- Botão **Exportar PDF** abre pré-visualização tela cheia
- Opções: "Todo o histórico" ou "Intervalo de datas"
- Usa **window.print()** (não jsPDF — ver pitfall #4)
- Capa elegante com título serifado (Georgia), período, estatísticas
- Cada dia em parágrafo justificado, tarefas concatenadas como prosa contínua separadas por ponto final (compacto, economiza papel)
- Categorias indicadas por **pontinho colorido sutil** antes da tarefa (não barra grossa, não texto colorido)
- Cabeçalho de data: sans-serif, 10.5pt, cinza, sem contagem de tarefas
- Legenda de categorias no final
- CSS `@page` para numeração automática e quebras inteligentes
- `@media print` força fundo branco e esconde a chrome do app

### Sincronização (Firebase Firestore)
- Botão "Sync desativado" no canto superior direito
- Modal pede `firebaseConfig` (objeto JS) + código de sincronização (8+ chars)
- Mesmo código nos dois dispositivos = mesmo dado
- Real-time listener no documento `tarefas/{syncCode}` (main) + subcollection `photos`
- **Merge inteligente** na primeira conexão (não sobrescreve dados locais)
- Debounce de 600ms nas escritas pra evitar flood
- Auto-reconnect ao abrir o app se config já salva no localStorage
- Indicador visual: bolinha verde (sincronizado), amarela pulsante (sincronizando), vermelha (erro)

### PWA (instalar no iPhone)
- `manifest.json` com `name`, `short_name`, ícones em todos tamanhos (180, 192, 512, maskable)
- Meta tags Apple para tela cheia: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style="black-translucent"`, `apple-mobile-web-app-title="Tarefas"`
- `viewport-fit=cover` + `env(safe-area-inset-*)` para respeitar Dynamic Island/notch
- Service worker para cache offline (network-first para HTML, cache-first para assets, bypass total para Firebase)
- Service worker NÃO intercepta `firebasestorage.googleapis.com`, `googleapis.com`, `gstatic.com`, `firebaseio.com`, `appspot.com`

### Toques de identidade visual
- Ícone: **monograma TC em dourado** (gradiente #e5c47a→#a88243) sobre **fundo navy escuro** (gradiente #1a2236→#0a0e14), com microtexto "DEVELOPMENT" abaixo das letras e linhas finas decorativas
- Rodapé do app: `TC | DEVELOPMENT · 2026` (serif gradiente dourado + sans-serif espaçada para "DEVELOPMENT", separados por divisor vertical fino)
- Layout: minimalista, neutro, fonte Inter system, cores `--bg #fafafa`, `--surface #fff`, `--accent #2563eb`

---

## 3. ARQUITETURA TÉCNICA

### Stack
- **Single-file HTML** — tudo num só arquivo `tarefas-realizadas.html` (~100KB), inline CSS e JS, sem build step
- **Bibliotecas via CDN** (cdnjs/gstatic):
  - `xlsx@0.18.5` (SheetJS para Excel)
  - `firebase-app-compat@10.7.1` + `firebase-firestore-compat@10.7.1` (Firebase v10 compat = global `firebase`)
  - **NÃO usar** jsPDF (problemas com UTF-8 acentuado em português) — usar `window.print()` em vez disso
  - **NÃO usar** Firebase Storage (ver pitfall #2)
- **Persistência local**: `localStorage` com chaves `tarefas_realizadas_v1`, `tarefas_historico_v1`, `tarefas_categorias_v1`, `tarefas_sync_config`, `tarefas_sync_code`, `tarefas_seed_loaded`
- **Sync**: Firestore com documento principal + subcollection de fotos
- **Hospedagem**: GitHub Pages (público, grátis, sem cartão)

### Estrutura de dados

```javascript
// Task
{
  id: number,           // timestamp + random
  date: string,         // "YYYY-MM-DD"
  text: string,
  categoryId: string | null,
  photos: string[]      // array de IDs de fotos (refs para Firestore subcollection)
}

// Category
{
  id: string,           // "cat-{timestamp}"
  name: string,
  color: string,        // hex "#RRGGBB"
  colorText: boolean    // se true, texto da tarefa fica na cor
}

// Photo (em Firestore subcollection)
{
  dataUrl: string,      // "data:image/jpeg;base64,..."
  ts: number
}

// Firestore main doc: tarefas/{syncCode}
{
  tasks: Task[],
  history: { [text]: count },   // para autocompletar
  categories: Category[],
  updatedAt: number             // anti-eco do próprio listener
}
```

### Regras de segurança Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tarefas/{syncCode} {
      allow read, write: if syncCode.size() >= 8;
      match /photos/{photoId} {
        allow read, write: if syncCode.size() >= 8;
      }
    }
  }
}
```

Segurança via **obscuridade do código de sync** (8+ chars). Não usa Firebase Auth — desnecessário pra app pessoal.

---

## 4. ARMADILHAS ENCONTRADAS (CRÍTICO LER)

### Pitfall #1 — localStorage é por origem
Cada URL/origem (preview do Cowork, file:// no browser, GitHub Pages URL) tem seu próprio localStorage. **Não compartilham**. Implementação: alertar o usuário ANTES de qualquer migração pra fazer backup. Botão de Backup JSON deve estar visível desde o primeiro dia.

### Pitfall #2 — Firebase Storage requer plano Blaze (cartão)
Desde outubro/2024, Cloud Storage for Firebase exige upgrade pra Blaze (pay-as-you-go), mesmo dentro do free tier. Para usuário sem cartão: **armazene fotos como base64 em Firestore subcollection** (não em Storage). Firestore Spark é totalmente grátis, 1GB cabe ~12.000 fotos comprimidas.

### Pitfall #3 — Acentuação portuguesa quebra jsPDF
A fonte Helvetica do jsPDF não suporta UTF-8 corretamente, então "ç", "ã", etc. saem como caracteres estranhos no PDF. **Solução:** usar `window.print()` com HTML/CSS bem feito (`@page` para margens, `@media print` para esconder chrome). Funciona perfeitamente com acentos, fontes nativas do sistema, e o usuário usa "Salvar como PDF" no diálogo de impressão.

### Pitfall #4 — `window.open()` bloqueado em iframes/Cowork
Tentei abrir PDF preview em nova janela com `window.open` — bloqueado pelo popup blocker quando rodando dentro de iframes (Cowork preview, alguns navegadores). **Solução:** renderizar o relatório inline (overlay fullscreen dentro da própria página) e disparar `window.print()` que então usa `@media print` pra mostrar só o relatório.

### Pitfall #5 — `</script>` literal dentro de template string
Se você tem um `<script>...</script>` dentro de uma template literal JS dentro de outro script, o parser HTML fecha o script externo no `</script>` interno. **Solução:** escapar como `<scr` + `ipt>` ou usar `<\/script>`.

### Pitfall #6 — iOS PWA com Dynamic Island
Sem `viewport-fit=cover` e `env(safe-area-inset-*)`, o conteúdo do PWA fica sobreposto ao relógio, bateria e Dynamic Island. Aplicar safe area no `body` e em todos overlays fullscreen (modal, viewer, preview de PDF).

### Pitfall #7 — Service Worker cacheando Firebase
SW que faz cache de tudo bloqueia chamadas em tempo real do Firestore. **Sempre fazer bypass** para `gstatic.com`, `googleapis.com`, `firebaseio.com`, `firebasestorage.googleapis.com`, `firebasestorage.app`, `appspot.com`.

### Pitfall #8 — Interface do Firebase mudou (2026)
A interface mudou: não tem mais menu "Build" e categorias laterais. Agora é **"Bancos de dados e armazenamento"** → "Firestore Database" e "Storage". Ao criar Firestore, agora aparece um wizard de 3 etapas (edição → ID/local → configurar), onde "modo de teste" aparece só na etapa 3.

### Pitfall #9 — Reassignar `save()` para hook
Se você define `function save() {...}` e depois quer fazer hook (`save = function() { _orig(); push(); }`), funciona apenas em modo não-strict. Em script tag sem `"use strict"` (que é o nosso caso) funciona. Em módulos ES não funciona. **Cuidado se for converter pra módulo.**

### Pitfall #10 — Limite de 1MB por documento Firestore
Se botar tudo (tasks + history + categories + photos base64) num documento só, estoura rápido. **Separar fotos em subcollection**, cada foto seu próprio doc.

---

## 5. FLUXO DE SETUP DETALHADO (3 etapas, ~25min)

### Etapa 1: Firebase (gratuito, sem cartão)
1. firebase.google.com → Adicionar projeto → "tarefas-tiago" → desabilitar Analytics
2. Menu lateral: **"Bancos de dados e armazenamento"** → Firestore Database → Criar
3. Wizard: **Edição Standard** (não Enterprise!) → ID `(default)` + região `southamerica-east1` → **Modo de teste**
4. Aba **Regras**: colar as rules da seção #3, publicar
5. Voltar ao painel inicial → **+ Adicionar app** → Web (`</>`) → apelido → registrar
6. **Copiar o `firebaseConfig`** que aparece (objeto JS inteiro)

### Etapa 2: GitHub Pages
1. github.com/signup (grátis)
2. **+ New repository** → nome qualquer, **Public**, add README → criar
3. **Add file → Upload files** → arrastar todos os 8 arquivos do app (`tarefas-realizadas.html`, `manifest.json`, `service-worker.js`, 4 ícones PNG, `icon.svg`) → commit
4. **Settings → Pages** → Source: Deploy from branch, main / (root) → Save
5. Esperar 1-2min, copiar URL `https://<usuario>.github.io/<repo>/tarefas-realizadas.html`
6. Abrir URL no Chrome/Safari do desktop
7. Clicar "Sync desativado" → colar `firebaseConfig` + criar código de sync (8+ chars, ex: `tarefas-tiago-2026`) → Conectar

### Etapa 3: iPhone (PWA)
1. Safari no iPhone → abrir a mesma URL
2. Compartilhar → "Adicionar à Tela de Início" → nome "Tarefas" → Adicionar
3. Abrir o ícone novo → Sync desativado → colar **mesmo** firebaseConfig + **mesmo** código de sync
4. Aguardar 5s — todas as tarefas aparecem sincronizadas

---

## 6. CONSIDERAÇÕES DE DESIGN

### Tipografia
- **Interface**: Inter / system fonts sans-serif (`-apple-system`, etc.)
- **Títulos elegantes / capa PDF**: Georgia / Times serif
- **Microtexto/labels**: maiúsculas espaçadas (`letter-spacing: 0.2em`), 11-12px
- **Tabular numerics** em estatísticas (`font-variant-numeric: tabular-nums`)

### Paleta
- Background: `#fafafa` (off-white quente)
- Surface: `#ffffff`
- Borda sutil: `#e5e5e5`
- Texto principal: `#1a1a1a`
- Texto muted: `#6b7280`
- Accent (botões primários): `#2563eb` (azul Tailwind)
- Categorias default: cinza, azul, verde, laranja, vermelho (escala Tailwind 500/600)
- **Marca TC**: dourado `#c9a55c` (com gradiente para `#e5c47a` topo e `#a88243` base) sobre navy `#1a2236`→`#0a0e14`

### Microinterações
- Botões com `transition: 0.15s` em hover
- Sync dot pulsa quando "syncing"
- Tarefas categorizadas têm `border-left: 3px solid <color>`
- Edit/delete buttons aparecem em hover no desktop, sempre visíveis em touch

---

## 7. FUNCIONALIDADES POSSÍVEIS PRA PRÓXIMAS ITERAÇÕES

- Sistema de tags livres além de categorias
- Lembretes/notificações
- Modo escuro (dark mode)
- Busca por texto na lista
- Estatísticas avançadas (gráficos por categoria/mês)
- Exportar para CSV (além de JSON e PDF)
- Múltiplos "diários" (vida pessoal, trabalho, etc.) com seletor
- Autenticação Firebase Auth (pra abandonar a segurança por obscuridade)
- Modo voz / dictado para adicionar tarefas
- Integração com calendário (importar eventos)
- Widget de tela inicial iOS via WebKit (limitado)

---

## 8. SEED DATA (importação inicial)

O HTML embute 154 tarefas iniciais de março/abril 2026 importadas de uma planilha Excel original. Vivem em `const SEED_TASKS = [...]` no JS. Carregadas apenas uma vez (controle via `localStorage['tarefas_seed_loaded'] === SEED_VERSION`).

Para regenerar seed a partir de novo Excel:
1. Ler Excel via openpyxl em Python
2. Limpar dados (corrigir datas inconsistentes pelo nome da aba)
3. Deduplificar por (date, text)
4. Gerar `SEED_TASKS` e `SEED_HISTORY` arrays
5. Injetar no HTML antes do bloco `let tasks = JSON.parse(localStorage...)`

---

## 9. ARQUIVOS DO PROJETO

- `tarefas-realizadas.html` — app completo (HTML/CSS/JS inline)
- `manifest.json` — manifest PWA
- `service-worker.js` — cache offline + bypass Firebase
- `icon.svg` — ícone vetorial (monograma TC)
- `icon-180.png` — para iOS (Apple Touch Icon)
- `icon-192.png` — Android PWA
- `icon-512.png` — alta resolução
- `icon-maskable-512.png` — variante "maskable" com safe zone
- `INSTRUCOES-SETUP.md` — guia passo-a-passo para o usuário
- `PROMPT-MESTRE.md` — este documento

---

## 10. COMANDO PARA UMA NOVA CONVERSA COM IA

Se quiser refazer ou continuar com um novo Claude, comece assim:

> Estou recriando um app pessoal de registro de tarefas realizadas chamado "Tarefas" (TC Development). Leia o documento PROMPT-MESTRE.md em anexo (ou colado abaixo) com todo o contexto, decisões técnicas, armadilhas e arquitetura. Depois me ajude a {OBJETIVO ESPECÍFICO: ex. "recriar do zero", "adicionar funcionalidade X", "corrigir bug Y"}.
>
> Importante: respeite as armadilhas da seção #4 — elas custaram caro de descobrir.

---

*Documento criado em maio/2026 após construção iterativa do app pelo Tiago em parceria com Claude. Mantenha-o atualizado conforme o projeto evolui.*

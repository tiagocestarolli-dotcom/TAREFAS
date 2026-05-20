# Guia de Setup — Tarefas Realizadas

Este guia tem **3 etapas**. Total: ~25 minutos. Faz uma vez e funciona pra sempre.

1. **Criar projeto Firebase** (banco de dados para sync) — ~10 min
2. **Hospedar no GitHub Pages** (URL pública acessível dos 2 dispositivos) — ~10 min
3. **Instalar no iPhone** (vira app na tela inicial) — ~2 min

> **Vai pagar alguma coisa?** Não. Tanto o GitHub Pages quanto o Firebase Firestore (no plano Spark) são gratuitos para sempre dentro dos limites — e seu uso pessoal nem chega perto dos limites. Não precisa cadastrar cartão de crédito em nenhum dos dois.

---

## ETAPA 1 — Criar projeto Firebase (gratuito)

### 1.1. Criar o projeto

1. Acesse https://console.firebase.google.com e faça login com sua conta Google
2. Clique em **"Adicionar projeto"** (ou "Add project")
3. Dê um nome, por exemplo: `tarefas-tiago`
4. Quando perguntar sobre **Google Analytics**, pode **desabilitar** (não precisa)
5. Clique em **Criar projeto** e aguarde

### 1.2. Habilitar o Firestore Database

Na nova interface do Firebase, os produtos estão organizados em categorias no menu lateral.

1. No menu lateral, clique em **"Bancos de dados e armazenamento"** (categoria com seta `>`)
2. Na lista que abre, clique em **Firestore Database**
3. Clique em **Criar banco de dados**
4. **Etapa "Selecionar edição":** escolha **Edição Standard** (já vem marcada) e clique em **Avançar**
5. **Etapa "ID e local":**
   - ID do banco: deixe `(default)`
   - Localização: escolha `southamerica-east1 (São Paulo)`
   - Clique em **Avançar**
6. **Etapa "Configurar":** escolha **"Iniciar no modo de teste"** e clique em **Criar**
7. Aguarde uns segundos até o banco ser provisionado

> **Atenção:** o "modo de teste" deixa as regras de segurança abertas por **30 dias**. Antes desse prazo, configure as regras permanentes da seção 1.4 abaixo.

### 1.3. Registrar um app web (para obter a configuração)

1. Clique em **"Visão geral do projeto"** no topo do menu lateral
2. No painel central, clique no botão **"+ Adicionar app"**
3. Na lista de plataformas, escolha **Web** (ícone `</>`)
4. Dê um apelido, por exemplo `tarefas-web`. **Não** marque "Firebase Hosting"
5. Clique em **Registrar app**
6. Vai aparecer um trecho de código com o objeto `firebaseConfig`:

```js
const firebaseConfig = {
  apiKey: "AIzaSy....",
  authDomain: "tarefas-tiago.firebaseapp.com",
  projectId: "tarefas-tiago",
  storageBucket: "tarefas-tiago.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

7. **Copie esse objeto inteiro** (a parte `{ ... }`). Você vai colar no app daqui a pouco.
8. Clique em **"Continuar no console"**

### 1.4. (Importante — fazer logo) Regras de segurança permanentes

Para o sync continuar funcionando depois dos 30 dias do modo de teste, configure as regras agora:

1. Vá em **"Bancos de dados e armazenamento" → Firestore Database**
2. Clique na aba **Regras** (Rules) no topo
3. Substitua todo o conteúdo por:

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

4. Clique em **Publicar**

> **Como funciona a segurança:** qualquer pessoa que souber seu código de sync consegue acessar suas tarefas. Por isso, escolha um código com pelo menos 8 caracteres, difícil de adivinhar (algo como `tarefas-tiago-2026xyz`).

---

## ETAPA 2 — Hospedar no GitHub Pages

### 2.1. Criar conta GitHub (se ainda não tiver)

1. Acesse https://github.com/signup
2. Crie uma conta (grátis, não pede cartão)

### 2.2. Criar o repositório

1. No canto superior direito, clique em **+ → New repository**
2. Em "Repository name", coloque: `tarefas` (ou qualquer nome)
3. Marque **Public** (precisa ser público para o Pages funcionar grátis)
4. Marque **Add a README file**
5. Clique em **Create repository**

### 2.3. Subir os arquivos

Você tem **8 arquivos** para subir (todos estão na pasta que eu te entreguei):

- `tarefas-realizadas.html`
- `manifest.json`
- `service-worker.js`
- `icon.svg`
- `icon-180.png`
- `icon-192.png`
- `icon-512.png`
- `icon-maskable-512.png`

**Como subir:**

1. Na página do repositório, clique em **Add file → Upload files**
2. Arraste todos os arquivos da pasta para a área de upload
3. Espera carregar (uns 30 segundos)
4. Embaixo, clique em **Commit changes**

### 2.4. Ativar o GitHub Pages

1. No repositório, clique em **Settings** (engrenagem no topo)
2. No menu lateral, clique em **Pages**
3. Em **Source**, escolha **Deploy from a branch**
4. Em **Branch**, escolha **main** e pasta **/(root)**, depois clique em **Save**
5. Aguarde **1-2 minutos**. Vai aparecer uma URL no topo, tipo:
   ```
   https://seu-usuario.github.io/tarefas/
   ```

### 2.5. Acessar o app

Abra essa URL adicionando `/tarefas-realizadas.html` no final:

```
https://seu-usuario.github.io/tarefas/tarefas-realizadas.html
```

Se quiser que abra direto pela URL raiz, renomeie o arquivo para `index.html` antes de subir.

### 2.6. Configurar o sync no desktop

1. Abra a URL no Chrome/Safari/Edge do desktop
2. No canto superior direito do app, clique em **"Sync desativado"**
3. Cole o `firebaseConfig` que você copiou na etapa 1.3
4. Em "Código de sincronização", digite algo que você vai lembrar, **com pelo menos 8 caracteres**, ex: `tarefas-tiago-2026`
5. Clique em **Conectar**
6. Pronto — o indicador vai ficar verde: **Sync ativo · tarefas-tiago-2026**

---

## ETAPA 3 — Instalar no iPhone

### 3.1. Abrir no Safari

1. No iPhone, abra o **Safari** (precisa ser Safari, não Chrome)
2. Acesse a URL: `https://seu-usuario.github.io/tarefas/tarefas-realizadas.html`

### 3.2. Adicionar à tela inicial

1. Toque no ícone de **compartilhar** (quadrado com seta pra cima) na barra inferior
2. Role para baixo e toque em **"Adicionar à Tela de Início"**
3. O nome aparece como "Tarefas". Toque em **Adicionar** no canto superior direito
4. Pronto — você tem um ícone do app na tela inicial do iPhone

### 3.3. Configurar o sync no iPhone

1. Toque no ícone "Tarefas" na tela inicial (abre em tela cheia, sem barras do Safari)
2. No app, toque em **"Sync desativado"** no topo
3. Cole o **mesmo `firebaseConfig`** da etapa 1.3
4. Em "Código de sincronização", digite **exatamente o mesmo código** que você usou no desktop (ex: `tarefas-tiago-2026`)
5. Toque em **Conectar**
6. Em poucos segundos, **todas as tarefas do desktop aparecem aqui**

A partir desse momento:
- Adicione uma tarefa no iPhone → aparece no desktop em ~1s
- Adicione no desktop → aparece no iPhone em ~1s
- Funciona offline também — sincroniza quando voltar a ter internet

---

## Sobre fotos

As fotos são **comprimidas automaticamente para ~800px** antes de subir (ficam com cerca de 50-100KB cada). Elas são salvas dentro do próprio Firestore (sem precisar do Firebase Storage).

**Limites:**
- O Firestore gratuito tem **1 GB de armazenamento total** → cabem cerca de **12.000 fotos** com a compressão do app
- Para uso pessoal de registro de tarefas, é mais que suficiente

**Para usar fotos:** primeiro conecte o sync (etapa 2.6 ou 3.3). Sem sync, as fotos não funcionam (porque elas vivem no Firestore).

---

## Solução de problemas

**"Sync desativado" não vira verde / Erro de sync**
- Verifique se você copiou o `firebaseConfig` inteiro, incluindo as chaves `{` e `}`
- Confira se o Firestore está habilitado no projeto Firebase
- Se as regras estão restritas, certifique-se que o código tem 8+ caracteres

**No iPhone, as tarefas não aparecem**
- Confira se digitou o **exato mesmo código** dos 2 lados (cuidado com espaços extras)
- Confira se o Firebase Config também é o mesmo

**Quero apagar todos os dados e começar do zero**
- Vá em https://console.firebase.google.com → seu projeto → Firestore → exclua o documento dentro da coleção "tarefas"

**Não quero mais sincronizar**
- No app, clique no botão de sync verde → **Desconectar**

**Foto não envia / dá erro**
- Conecte primeiro a sincronização (botão Sync no topo)
- As fotos vivem no Firestore, então sem sync não funcionam
- Se uma foto muito grande não subir, o app vai tentar comprimir mais. Se mesmo assim falhar, tente uma foto menor

**Sobre limites gratuitos**
- Firestore: 50.000 leituras/dia, 20.000 escritas/dia, 1 GB total — seu uso fica em ~1% disso
- GitHub Pages: 1 GB de site, 100 GB de banda/mês — também não vai chegar perto
- **Você nunca vai pagar nada** dentro do uso pessoal

---

Qualquer dúvida ou problema, me chama.

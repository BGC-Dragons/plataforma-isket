# Documentacao Completa de Handoff - Plataforma Isket

> Documento criado para passagem de bastao a novos desenvolvedores.
> Cobre o projeto de ponta a ponta: arquitetura, autenticacao, modulos, services, hooks, deploy e mais.

---

## Indice

1. [Visao Geral do Projeto](#1-visao-geral-do-projeto)
2. [Setup do Ambiente de Desenvolvimento](#2-setup-do-ambiente-de-desenvolvimento)
3. [Arquitetura do Projeto](#3-arquitetura-do-projeto)
4. [Configuracoes e Tooling](#4-configuracoes-e-tooling)
5. [Sistema de Autenticacao](#5-sistema-de-autenticacao)
6. [Roteamento](#6-roteamento)
7. [Gerenciamento de Estado](#7-gerenciamento-de-estado)
8. [Camada de Servicos (API)](#8-camada-de-servicos-api)
9. [Modulos de Feature](#9-modulos-de-feature)
10. [Componentes Reutilizaveis (Library)](#10-componentes-reutilizaveis-library)
11. [Hooks Customizados](#11-hooks-customizados)
12. [Helpers e Utilitarios](#12-helpers-e-utilitarios)
13. [Tipos e Interfaces Principais](#13-tipos-e-interfaces-principais)
14. [Sistema de Creditos](#14-sistema-de-creditos)
15. [Tema e Design System](#15-tema-e-design-system)
16. [Deploy e CI/CD](#16-deploy-e-cicd)
17. [Integracoes Externas](#17-integracoes-externas)
18. [Padroes de Codigo e Convencoes](#18-padroes-de-codigo-e-convencoes)
19. [Troubleshooting e Dicas](#19-troubleshooting-e-dicas)
20. [Glossario de Termos de Negocio](#20-glossario-de-termos-de-negocio)

---

## 1. Visao Geral do Projeto

### O que e a Isket

A Isket e uma **plataforma SaaS (Software as a Service) de tecnologia imobiliaria** (proptech) voltada para imobiliarias e corretores de imoveis no Brasil. A plataforma oferece ferramentas para:

- **Pesquisa de imoveis** com filtros avancados e visualizacao em mapa (Google Maps)
- **Captacao (sourcing)** de imoveis e contatos via pipeline Kanban
- **Avaliacao de imoveis** com comparacao, graficos e geracao de relatorios PDF/Excel
- **Analises de mercado** com heatmaps de demanda/oferta e rankings de bairros/agencias
- **Gestao de equipe** com convites, roles e limites de creditos por usuario
- **Pesquisa de proprietarios/moradores** (resident search) com sistema de creditos

### Publico-Alvo

- Imobiliarias (plano BUSINESS)
- Corretores individuais (plano PERSONAL)
- Equipes de captacao de imoveis

### Stack Tecnologica

| Categoria | Tecnologia | Versao |
|-----------|-----------|--------|
| Framework | React | 19.1 |
| Linguagem | TypeScript | 5.8 |
| Bundler | Vite | 7.0 |
| Roteamento | React Router | 7.7 |
| UI Library | Material-UI (MUI) | 7.2 |
| CSS-in-JS | Emotion | 11.14 |
| State Management | React Context API | - |
| Data Fetching | SWR | 2.3 |
| HTTP Client | Axios | 1.11 |
| Drag & Drop | Atlaskit Pragmatic DnD | 1.7 |
| Mapas | Google Maps API | - |
| Auth | Google OAuth (@react-oauth/google) | 0.12 |
| PDF | jsPDF + jspdf-autotable | 3.0 / 5.0 |
| Excel | xlsx (SheetJS) | 0.18 |
| Analytics | Smartlook | 10.0 |
| Package Manager | pnpm | - |

### Estatisticas do Projeto

- **~200 arquivos** TypeScript/TSX
- **75 service files** (chamadas API)
- **12 helpers** de transformacao/utilidade
- **7 modulos de feature** (access-manager, city-selection, filter-selection, search, sourcing, evaluation, analyses)
- **12 componentes reutilizaveis** na library
- **3+ hooks customizados** + diversos hooks SWR
- **13+ paginas** (8 publicas, 5+ privadas)

---

## 2. Setup do Ambiente de Desenvolvimento

### Pre-requisitos

- **Node.js** >= 18 (recomendado Node.js 20)
- **pnpm** (package manager utilizado no projeto)

### Instalacao

```bash
# 1. Clonar o repositorio
git clone <url-do-repositorio>
cd plataforma-isket

# 2. Instalar dependencias
pnpm install
```

### Configuracao do `.env`

Crie um arquivo `.env` na raiz do projeto com as seguintes variaveis:

```bash
# Ambiente da API: "local" | "dev" | "prod"
# - local: aponta para http://localhost:5001
# - dev: aponta para https://api-staging.isket.com.br
# - prod: aponta para https://api.isket.com.br
VITE_API_ENV=dev

# Ambiente do Node: "development" | "production"
VITE_NODE_ENV=development

# Chave da API do Google Maps (obrigatoria para funcionar o mapa)
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...

# Client ID do Google OAuth (obrigatorio para login com Google)
VITE_GOOGLE_CLIENT_ID=680610574923-...

# Chave do Smartlook (opcional - gravacao de sessoes)
VITE_SMARTLOOK_API_KEY=6d07c003...
```

**IMPORTANTE:** O arquivo `.env` esta no `.gitignore`. Nunca commitar credenciais.

### Ambientes da API

| Ambiente | URL da API | Uso |
|----------|-----------|-----|
| `local` | `http://localhost:5001` | Desenvolvimento local com backend rodando localmente |
| `dev` | `https://api-staging.isket.com.br` | Ambiente de staging/homologacao |
| `prod` | `https://api.isket.com.br` | Producao |

### Scripts Disponiveis

```bash
pnpm dev                  # Inicia servidor de desenvolvimento (Vite, porta 5173)
pnpm build:development    # Build para ambiente de desenvolvimento (tsc + vite build --mode development)
pnpm build:production     # Build para producao (tsc + vite build --mode production)
pnpm lint                 # Executa ESLint em todo o projeto
pnpm preview              # Preview do build de producao localmente
pnpm deploy               # Deploy para GitHub Pages (roda predeploy automaticamente)
```

### Rodando o Projeto

```bash
# Desenvolvimento
pnpm dev
# Acesse http://localhost:5173

# Build + Preview
pnpm build:development && pnpm preview
```

---

## 3. Arquitetura do Projeto

### Arvore de Diretorios

```
plataforma-isket/
|
|-- src/
|   |-- main.tsx                          # Entry point do React
|   |-- App.tsx                           # Componente raiz (providers)
|   |-- App.css                           # Estilos globais do app
|   |-- index.css                         # Estilos globais base
|   |-- vite-env.d.ts                     # Tipos do Vite
|   |
|   |-- assets/                           # Imagens e assets estaticos
|   |   |-- isket.svg                     # Logo principal
|   |   |-- simbolo-isket.svg            # Logo icone
|   |   |-- favicon.svg                   # Favicon
|   |   |-- google.svg                    # Icone Google
|   |   |-- property-placeholder-image.tsx # Placeholder de imovel
|   |   +-- react.svg
|   |
|   |-- config/
|   |   +-- env-var.ts                    # Variaveis de ambiente (Smartlook)
|   |
|   |-- theme/
|   |   +-- index.ts                      # Tema customizado do MUI
|   |
|   |-- types/
|   |   +-- atlaskit-flourish.d.ts        # Declaracoes de modulos AtlasKit
|   |
|   |-- services/                         # CAMADA DE SERVICOS (API)
|   |   |-- clients/
|   |   |   +-- isket-api.client.ts       # Cliente Axios configurado
|   |   |-- helpers/
|   |   |   |-- endpoint.constant.ts      # URLs da API por ambiente
|   |   |   |-- axios-interceptor.function.ts  # Interceptors (auth + refresh)
|   |   |   |-- clear-swr-cache.function.ts    # Limpeza de cache SWR
|   |   |   |-- get-header-function.ts         # Builder de headers
|   |   |   |-- mock-adapter.function.ts       # Mock adapter
|   |   |   |-- map-filters-to-api.helper.ts   # Filtros UI -> API
|   |   |   |-- map-filters-to-search-map.helper.ts  # Filtros -> mapa
|   |   |   |-- map-api-to-property-data.helper.ts   # API -> dados UI
|   |   |   |-- map-api-to-property-details.helper.ts # API -> detalhes UI
|   |   |   |-- map-api-property-type-to-modal.helper.ts
|   |   |   |-- map-property-type-to-api.helper.ts
|   |   |   +-- upload-profile-photo.helper.ts
|   |   |-- models/
|   |   |   |-- error-response.interface.ts
|   |   |   +-- success-response.interface.ts
|   |   +-- [75 service files]            # Um arquivo por endpoint da API
|   |
|   +-- scripts/
|       |-- config/
|       |   |-- routes/
|       |   |   +-- index.tsx             # Configuracao de rotas (React Router)
|       |   |-- environmental.constant.ts # Config de ambiente (API_ENV, NODE_ENV)
|       |   +-- google.constant.ts        # Config Google (CLIENT_ID, MAPS_API_KEY)
|       |
|       |-- library/                      # COMPONENTES REUTILIZAVEIS
|       |   |-- components/
|       |   |   |-- private-layout.tsx     # Layout das paginas privadas
|       |   |   |-- floating-top-menu.tsx  # Menu superior fixo
|       |   |   |-- sidebar-menu.tsx       # Menu lateral
|       |   |   |-- custom-text-field.tsx  # TextField customizado
|       |   |   |-- custom-pagination.tsx  # Paginacao customizada
|       |   |   |-- city-select.tsx        # Seletor de cidades
|       |   |   |-- google-button.tsx      # Botao de login Google
|       |   |   |-- animated-isket-logo.tsx # Logo animado (loading)
|       |   |   |-- complete-profile-modal.tsx
|       |   |   |-- subscription-blocked-modal.tsx
|       |   |   |-- add-cities-modal.tsx
|       |   |   +-- edit-city-modal.tsx
|       |   |-- hooks/
|       |   |   |-- use-effective-credits.ts  # Creditos efetivos
|       |   |   |-- use-viewport-height.ts    # Altura do viewport
|       |   |   +-- useGoogleAuth.ts          # Fluxo Google OAuth
|       |   +-- helpers/
|       |       |-- create-required-context.function.ts
|       |       |-- convert-city-description-to-code.helper.ts
|       |       +-- validate-password.helper.ts
|       |
|       |-- modules/                      # MODULOS DE FEATURE
|       |   |-- access-manager/           # Autenticacao e guards
|       |   |-- city-selection/           # Selecao de cidades
|       |   |-- filter-selection/         # Estado de filtros
|       |   |-- search/                   # Pesquisa de imoveis
|       |   |-- sourcing/                 # Captacao (Kanban)
|       |   |-- evaluation/              # Avaliacao de imoveis
|       |   +-- analyses/                 # Analytics e heatmaps
|       |
|       +-- pages/
|           |-- public/                   # Paginas sem autenticacao
|           |   |-- Login.tsx
|           |   |-- SignUp.tsx
|           |   |-- ForgotPassword.tsx
|           |   |-- ResetPassword.tsx
|           |   |-- EmailVerification.tsx
|           |   |-- CompleteSignUp.tsx
|           |   |-- CompleteProfile.tsx
|           |   |-- InviteAccept.tsx
|           |   +-- Error404.tsx
|           +-- private/                  # Paginas autenticadas
|               |-- search/
|               |-- sourcing/
|               |-- evaluation/
|               |-- analyses/
|               +-- management/
|
|-- public/                               # Assets estaticos publicos
|   |-- .htaccess
|   |-- favicon.svg
|   +-- robots.txt
|
|-- package.json
|-- pnpm-lock.yaml
|-- vite.config.ts
|-- tsconfig.json
|-- tsconfig.app.json
|-- tsconfig.node.json
|-- eslint.config.js
|-- biome.json
|-- vercel.json                           # Config deploy Vercel
|-- app.yaml                              # Config deploy Google App Engine
|-- index.html                            # Entry point HTML
+-- .env                                  # Variaveis de ambiente (nao commitado)
```

### Padrao Arquitetural

A aplicacao segue o padrao **SPA (Single Page Application)** com:

- **React Context API** para estado global (auth, cidades, filtros)
- **SWR** para data fetching com cache
- **Service layer** para encapsular chamadas API
- **Helpers de transformacao** para converter dados entre API e UI

### Fluxo de Dados

```
[UI (Componente)]
    |
    v
[Context (useState)] --> [Service (Axios)] --> [API Backend]
    |                          |
    v                          v
[SWR Cache]            [Interceptors (auth token)]
    |
    v
[Helpers de Transformacao (mapApi...)]
    |
    v
[UI (renderiza dados)]
```

### Provider Hierarchy (Cadeia de Providers)

```
index.html
  +-- main.tsx (setupAxiosInterceptors + ReactDOM.createRoot)
      +-- App.tsx
          +-- GoogleOAuthProvider (clientId)
              +-- ThemeProvider (tema MUI)
                  +-- CssBaseline
                  +-- AppRouter
                      +-- BrowserRouter
                          +-- AuthProvider
                              +-- CitySelectionProvider
                                  +-- FilterSelectionProvider
                                      +-- Routes (publicas + privadas)
```

**Ordem de inicializacao:**
1. `main.tsx`: Configura interceptors do Axios (injecao de token, refresh automatico)
2. `App.tsx`: Inicializa Smartlook (se configurado), monta providers
3. `AuthProvider`: Valida token do localStorage, restaura sessao
4. `CitySelectionProvider`: Restaura cidades selecionadas do localStorage
5. `FilterSelectionProvider`: Inicializa filtros com valores padrao
6. Rotas sao renderizadas

---

## 4. Configuracoes e Tooling

### Vite (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // Aceita conexoes externas (util para testar no celular)
    port: 5173,       // Porta do dev server
  },
});
```

- Build tool: Vite 7.0
- Plugin: @vitejs/plugin-react (Fast Refresh, JSX transform)
- Variaveis de ambiente: prefixo `VITE_` (acessiveis via `import.meta.env.VITE_*`)

### TypeScript

**`tsconfig.json`** - Config raiz (referencia app e node configs)

**`tsconfig.app.json`** - Config da aplicacao:
- Target: ES2022
- Strict mode habilitado
- JSX: react-jsx (transformacao automatica, sem import React)
- noUnusedLocals e noUnusedParameters habilitados
- Module resolution: bundler

**`tsconfig.node.json`** - Config para ferramentas de build:
- Target: ES2023

### ESLint (`eslint.config.js`)

- ESLint v9 com flat config (formato moderno)
- Plugins: `typescript-eslint`, `react-hooks`, `react-refresh`
- Regras de hooks do React habilitadas
- Regras de refresh do React habilitadas

### Biome (`biome.json`)

- Formatter alternativo (mais rapido que Prettier)
- Largura de linha: 100 caracteres
- Indentacao: 2 espacos
- Aspas simples

### Tema MUI (`src/theme/index.ts`)

O tema customizado do Material-UI define:

**Cores da marca:**
```
PRIMARY:    #262353 (roxo escuro)
SECONDARY:  #E3003A (vermelho)
ACCENT:     #C70033 (vermelho escuro)
DARK:       #A6002A (vermelho muito escuro)
LIGHT:      #F8F9FA (cinza claro)
WHITE:      #FFFFFF
BORDER:     #E0E0E0
TEXT_PRIMARY: #333333
```

**Gradients:**
- `gradient`: `linear-gradient(135deg, #E3003A, #C70033)` - Botoes primarios
- `gradientHover`: `linear-gradient(135deg, #C70033, #A6002A)` - Hover

**Shadows customizados:**
- `shadow`: Elevacao padrao
- `shadowHover`: Hover em cards
- `shadowFocus`: Focus em inputs
- `shadowButton`: Botoes primarios
- `shadowButtonHover`: Botoes em hover

**Component overrides:**
- `MuiButton`: Fundo vermelho (#E3003A), texto branco, borderRadius 8, textTransform none
- `MuiTextField`: borderRadius 8, borda cinza, focus roxo
- `MuiSelect`: borderRadius 8, scrollbar customizado
- `MuiMenuItem`: Hover com vermelho sutil
- `MuiMenu`: Shadow, borda, maxHeight 200px, scrollbar customizado
- `MuiCssBaseline`: Scrollbar customizado global (6px, cinza)

**Extensao do Palette:**
O tema estende o `Palette` do MUI com um objeto `brand` contendo todas as cores e shadows da marca. Acesse via `theme.palette.brand.*`.

---

## 5. Sistema de Autenticacao

### Visao Geral

O sistema suporta dois metodos de autenticacao:
1. **Email/Senha** (login tradicional)
2. **Google OAuth** (fluxo auth-code)

Ambos resultam em **JWT tokens** (access + refresh) armazenados no `localStorage`.

### Fluxo de Login - Email/Senha

```
1. Usuario acessa /login
2. Preenche email e senha
3. Frontend chama postAuthLogin(email, password)
4. Backend retorna { accessToken, refreshToken }
5. Frontend chama getAuthMe(accessToken) para buscar dados do usuario
6. Verifica se usuario esta ativo e se assinatura nao expirou
7. Se assinatura expirada (403): exibe SubscriptionBlockedModal
8. Se sucesso: armazena tokens e user no localStorage, redireciona para /pesquisar-anuncios
```

### Fluxo de Login - Google OAuth

```
1. Usuario clica no botao "Entrar com Google"
2. useGoogleAuth() inicia fluxo com flow: "auth-code"
3. Google retorna um code (de uso unico)
4. Frontend envia code + redirectUri para postAuthGoogle()
5. Backend troca code por tokens Google, cria/busca usuario
6. Backend retorna { accessToken, refreshToken } ou { newAccount: {...} }
7. Se newAccount: redireciona para /complete-profile
8. Se tokens: busca dados com getAuthMe(), faz login
9. Se 403: exibe modal de assinatura bloqueada
```

### Fluxo de Registro

```
1. /cadastro: Usuario informa email
2. postAuthSendVerificationCode(email) - envia codigo por email
3. /email-verification: Usuario digita codigo de 4 digitos
4. postAuthVerifyCode(email, code) - valida codigo
5. /complete-signup: Usuario preenche nome, senha, cidade
6. postAuthRegister(dados) - cria conta
7. postAuthLogin(email, password) - login automatico
8. getAuthMe(token) - busca dados do usuario
9. Redireciona para /pesquisar-anuncios
```

### Token Management

**Armazenamento (localStorage):**
```
auth_token         -> JWT access token (curta duracao)
auth_refresh_token -> JWT refresh token (longa duracao)
auth_user          -> JSON string com dados do usuario (cache local)
```

### Axios Interceptors (`src/services/helpers/axios-interceptor.function.ts`)

**Request Interceptor:**
- Automaticamente adiciona header `Authorization: Bearer <token>` em todas as requests
- Busca token do `localStorage.getItem("auth_token")`

**Response Interceptor (Token Refresh Automatico):**

Quando uma resposta retorna **401 (Unauthorized)**:

```
1. Verifica se nao e um retry (_retry flag) e nao e a propria request de refresh
2. Se ja esta refreshing: adiciona request a fila (failedQueue)
3. Se nao esta refreshing:
   a. Marca isRefreshing = true
   b. Busca refreshToken do localStorage
   c. Se nao tem refresh token: redireciona para /login
   d. Chama postAuthRefreshToken({ refreshToken })
   e. Atualiza tokens no localStorage
   f. Processa fila: todas as requests pendentes recebem o novo token
   g. Retries a request original com novo token
4. Se refresh falha:
   a. Processa fila com erro
   b. Limpa localStorage (token, refresh_token, user)
   c. Redireciona para /login
```

**Sistema de Fila:**
Quando multiplas requests recebem 401 simultaneamente, apenas UMA request de refresh e feita. As demais ficam em uma fila (`failedQueue`) e sao retried apos o refresh completar.

### AuthContext (`src/scripts/modules/access-manager/auth.context.tsx`)

**Estado:**
```typescript
interface IAuthStore {
  token: string | null;
  refreshToken: string | null;
  user: IAuthUser | null;
  subscriptionBlocked: boolean;
}

interface IAuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;     // URL da foto de perfil
  sub?: string;         // Google ID
}
```

**Metodos expostos (IAuth):**
```typescript
interface IAuth {
  store: IAuthStore;
  login(tokens, user, redirect?) -> void    // Login manual
  loginWithGoogle(googleResponse) -> Promise // Login Google
  isLogged: boolean                          // true se token existe e nao esta validando
  logout() -> void                          // Limpa tudo, redireciona /login
  refreshAuth() -> Promise<boolean>         // Renova tokens manualmente
  isValidating: boolean                     // true durante validacao inicial
  clearSubscriptionBlocked() -> void        // Limpa flag de assinatura bloqueada
}
```

**Inicializacao:**
Na montagem do AuthProvider, ele verifica se existem tokens no localStorage. Se existem, chama `getAuthMe(token)` para validar. Se o token e valido e o usuario esta ativo, restaura a sessao. Se nao, limpa o localStorage.

**Smartlook Integration:**
Quando o usuario loga, o AuthProvider chama `smartlookClient.identify(userId, { name, email })` para associar a sessao ao usuario no Smartlook.

### AccessManager (`src/scripts/modules/access-manager/access-manager.component.tsx`)

Componente HOC que protege rotas privadas:

```typescript
<AccessManager component={MinhaPage} requireAuth={true} />
```

- Se `isValidating`: exibe `<AnimatedIsketLogo />` (loading)
- Se `requireAuth && !isLogged`: redireciona para `/login?redirect=<path_atual>`
- Se autenticado: renderiza o componente

### Roles e Permissoes

| Role | Acesso |
|------|--------|
| `OWNER` | Tudo: perfil, seguranca, empresa, colaboradores, assinatura, upgrade |
| `ADMIN` | Perfil, seguranca, colaboradores |
| `MEMBER` | Apenas perfil |

A verificacao de role acontece no modulo de Management para exibir/ocultar secoes da sidebar.

---

## 6. Roteamento

### Configuracao (`src/scripts/config/routes/index.tsx`)

O roteamento usa **React Router v7** com `BrowserRouter`.

### Tabela Completa de Rotas

#### Rotas Publicas (sem autenticacao)

| Rota | Componente | Descricao |
|------|-----------|-----------|
| `/login` | `Login` | Pagina de login (email/senha + Google) |
| `/cadastro` | `SignUp` | Inicio do cadastro (coleta email) |
| `/email-verification` | `EmailVerification` | Verificacao de codigo de 4 digitos |
| `/complete-signup` | `CompleteSignUp` | Completar registro (nome, senha, cidade) |
| `/complete-profile` | `CompleteProfile` | Completar perfil apos Google OAuth |
| `/esqueceu-senha` | `ForgotPassword` | Solicitar recuperacao de senha |
| `/reset-password/:token` | `ResetPassword` | Redefinir senha com token |
| `/invite/:token` | `InviteAccept` | Aceitar convite de equipe |
| `*` | `Error404` | Pagina nao encontrada |

#### Rotas Privadas (protegidas por AccessManager)

| Rota | Componente | Descricao |
|------|-----------|-----------|
| `/` | Redirect -> `/pesquisar-anuncios` | Redireciona para pesquisa |
| `/pesquisar-anuncios` | `SearchComponent` | Pesquisa e listagem de imoveis |
| `/pesquisar-anuncios/:propertyId` | `SearchComponent` | Detalhes de imovel especifico |
| `/captacao` | `SourcingComponent` | Pipeline de captacao (Kanban) |
| `/avaliacao` | `EvaluationComponent` | Avaliacao de imoveis |
| `/analises` | `AnalysesComponent` | Analytics e heatmaps |
| `/configuracoes` | `ManagementComponent` | Configuracoes e gerenciamento |

#### Parametros de Rota

- `:propertyId` - ID do imovel para exibir detalhes
- `:token` - Token de reset de senha ou convite de equipe

### Provider Nesting nas Rotas

Todas as rotas (publicas e privadas) estao dentro de:
```
BrowserRouter > AuthProvider > CitySelectionProvider > FilterSelectionProvider > Routes
```

Isso significa que mesmo paginas publicas tem acesso ao contexto de auth (para verificar se ja esta logado e redirecionar).

### Paginas Privadas - Wrapper

Cada pagina privada e envolvida por `PrivateLayout`, que adiciona o menu superior fixo (`FloatingTopMenu`) e o layout padrao.

```tsx
function PesquisarAnunciosPage() {
  return (
    <PrivateLayout>
      <SearchComponent />
    </PrivateLayout>
  );
}
```

---

## 7. Gerenciamento de Estado

### Contextos Globais

O projeto usa **3 contextos React** para estado global:

#### 7.1 AuthContext

**Arquivo:** `src/scripts/modules/access-manager/auth.context.tsx`
**Hook:** `useAuth()`

**Estado:** token, refreshToken, user, subscriptionBlocked
**Persistencia:** localStorage (`auth_token`, `auth_refresh_token`, `auth_user`)
**Detalhes:** Ver secao 5 (Sistema de Autenticacao)

#### 7.2 CitySelectionContext

**Arquivo:** `src/scripts/modules/city-selection/city-selection.context.tsx`
**Hook:** `useCitySelection()`

**Estado:**
```typescript
{
  cities: string[]  // Array de codigos de cidade (ex: ["curitiba_pr", "sao_paulo_sp"])
}
```

**Persistencia:** localStorage (`isket_selected_cities`)
**Metodos:** `setCities(cities)`, `clearCities()`

**Uso:** As cidades selecionadas determinam o escopo de busca em todas as features (pesquisa, captacao, analytics).

#### 7.3 FilterSelectionContext

**Arquivo:** `src/scripts/modules/filter-selection/filter-selection.context.tsx`
**Hook:** `useFilterSelection()`

**Estado (FilterState):** 30+ campos incluindo:
```typescript
{
  search: string;                    // Texto de busca
  cities: string[];                  // Cidades filtradas
  neighborhoods: string[];           // Bairros filtrados
  addressCoordinates?: { lat, lng }; // Coordenadas de endereco
  addressZoom?: number;              // Zoom do mapa
  drawingGeometries?: Array<...>;    // Poligonos/circulos desenhados
  venda: boolean;                    // Filtro venda
  aluguel: boolean;                  // Filtro aluguel
  residencial: boolean;              // Filtro residencial
  comercial: boolean;                // Filtro comercial
  industrial: boolean;
  agricultura: boolean;
  // 30+ tipos de imovel (apartamento_padrao, casa, sobrado, etc.)
  quartos: number | null;
  banheiros: number | null;
  suites: number | null;
  garagem: number | null;
  area_min: number;
  area_max: number;
  preco_min: number;
  preco_max: number;
  proprietario_direto: boolean;
  imobiliaria: boolean;
  portal: boolean;
  lancamento: boolean;
  propertyFeatures: string[];
}
```

**Persistencia:** Nenhuma (estado transiente, resetado ao recarregar pagina)
**Metodos:** `setFilters(partial)`, `clearFilters()`

### SWR para Data Fetching

O projeto usa **SWR (stale-while-revalidate)** para buscar e cachear dados da API.

**Padrao de uso:**
```typescript
// Cache key inclui userId para evitar cache compartilhado entre usuarios
const cacheKey = auth.store.user?.id
  ? ["/api/path", auth.store.user.id]
  : null;  // null = nao busca enquanto nao tem usuario

return useSWR(cacheKey, () => fetcher().then(r => r.data), {
  revalidateOnMount: true,
});
```

**Invalidacao de cache:**
```typescript
// Invalida cache especifica
mutate("/api/path");

// Invalida cache com filtro
mutate((key) => Array.isArray(key) && key[0] === "/api/path");
```

**Cache global clear (login/logout):**
A funcao `clearAllUserDataCache()` (`src/services/helpers/clear-swr-cache.function.ts`) invalida TODO o cache SWR. Usada no `login()` e `logout()` para evitar vazamento de dados entre usuarios.

### Padrao createRequiredContext

Helper factory para criar contextos com validacao automatica:

```typescript
// src/scripts/library/helpers/create-required-context.function.ts
const [Context, useRequiredContext] = createRequiredContext<T>();
```

Se o hook for usado fora do Provider, lanca erro: `"useRequiredContext must be used within a Provider"`.

---

## 8. Camada de Servicos (API)

### Arquitetura da Camada

```
[Componente] --> [Hook SWR] --> [Service Function] --> [Axios Client] --> [API]
                                                           |
                                                    [Interceptors]
                                                    - Request: inject auth token
                                                    - Response: auto-refresh 401
```

### Cliente Axios (`src/services/clients/isket-api.client.ts`)

```typescript
import axios from "axios";
import { endpoints } from "../helpers/endpoint.constant";

export const isketApiClient = axios.create({
  baseURL: endpoints.api,  // URL baseada no ambiente (VITE_API_ENV)
});
```

### Padrao de Service File (4 Camadas)

Cada endpoint da API segue este padrao:

```typescript
// 1. CONSTANTE DE PATH (cache key para SWR)
export const getAuthMePATH = "/auth/me";

// 2. FUNCAO RAW (chamada Axios direta)
export const getAuthMe = (token: string) => {
  return isketApiClient.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// 3. WRAPPER AUTENTICADO (para uso com SWR)
export const useAuthedGetAuthMe = () => {
  const auth = useAuth();
  return useCallback(
    () => getAuthMe(auth.store.token as string),
    [auth]
  );
};

// 4. HOOK SWR (data fetching com cache)
export const useGetAuthMe = () => {
  const fetcher = useAuthedGetAuthMe();
  const auth = useAuth();
  const cacheKey = auth.store.user?.id
    ? [getAuthMePATH, auth.store.user.id]
    : null;
  return useSWR(cacheKey, () => fetcher().then(r => r.data), {
    revalidateOnMount: true,
  });
};

// BONUS: Funcao de invalidacao de cache
export const clearAuthMeCache = () => {
  mutate(getAuthMePATH);
  mutate((key) => Array.isArray(key) && key[0] === getAuthMePATH);
};
```

**Nota:** Nem todos os services tem as 4 camadas. Endpoints de mutacao (POST/PATCH/DELETE) geralmente so tem a camada 2 (funcao raw).

### Catalogo Completo de Services

#### Autenticacao (11 services)

| Arquivo | Metodo | Endpoint | Descricao |
|---------|--------|----------|-----------|
| `post-auth-login.service.ts` | POST | `/auth/login` | Login email/senha |
| `post-auth-google.service.ts` | POST | `/auth/google` | Login Google OAuth |
| `post-auth-register.service.ts` | POST | `/auth/register` | Registrar novo usuario |
| `post-auth-register-with-invite.service.ts` | POST | `/auth/register-with-invite` | Registrar via convite |
| `post-auth-refresh-token.service.ts` | POST | `/auth/refreshToken` | Renovar tokens |
| `post-auth-send-verification-code.service.ts` | POST | `/auth/send-verification-code` | Enviar codigo de verificacao |
| `post-auth-verify-code.service.ts` | POST | `/auth/verify-code` | Validar codigo de verificacao |
| `post-auth-verify-change-password.service.ts` | POST | `/auth/verify-change-password` | Redefinir senha com token |
| `post-auth-recovery-password.service.ts` | POST | `/auth/recovery-password` | Solicitar recuperacao de senha |
| `get-auth-me.service.ts` | GET | `/auth/me` | Buscar dados do usuario logado |
| `patch-auth-profile.service.ts` | PATCH | `/auth/profile` | Atualizar perfil do usuario |

#### Usuarios (9 services)

| Arquivo | Metodo | Endpoint | Descricao |
|---------|--------|----------|-----------|
| `get-user.service.ts` | GET | `/auth/users/:id` | Buscar usuario por ID |
| `get-users.service.ts` | GET | `/auth/users` | Listar usuarios da empresa |
| `patch-user.service.ts` | PATCH | `/auth/users/:id` | Atualizar usuario |
| `delete-user.service.ts` | DELETE | `/auth/users/:id` | Remover usuario |
| `get-user-invites.service.ts` | GET | `/auth/users/invites` | Listar convites pendentes |
| `post-users-invite.service.ts` | POST | `/auth/users/invite` | Enviar convite |
| `delete-user-invite.service.ts` | DELETE | `/auth/users/invites/:id` | Cancelar convite |
| `get-user-credit-limits.service.ts` | GET | `/auth/users/:id/credit-limits` | Buscar limites de credito |
| `put-user-credit-limit.service.ts` | PUT | `/auth/users/:id/credit-limits` | Definir limite de credito |

#### Pesquisa de Imoveis (5 services)

| Arquivo | Metodo | Endpoint | Descricao |
|---------|--------|----------|-----------|
| `post-property-ad-search.service.ts` | POST | `/property-ad/search` | Busca de imoveis (listagem) |
| `post-property-ad-search-map.service.ts` | POST | `/property-ad/search/map` | Busca para mapa |
| `post-property-ad-search-statistics.service.ts` | POST | `/property-ad/search/statistics` | Estatisticas de busca |
| `get-property-ad-view.service.ts` | GET | `/property-ad/:id` | Detalhes de imovel |
| `get-property-ad-features.service.ts` | GET | `/property-ad/features` | Features disponiveis |

#### Localizacao (6 services)

| Arquivo | Metodo | Endpoint | Descricao |
|---------|--------|----------|-----------|
| `get-locations-cities.service.ts` | GET | `/locations/cities` | Listar cidades |
| `get-locations-city-by-code.service.ts` | GET | `/locations/cities/:code` | Buscar cidade por codigo |
| `get-locations-neighborhoods.service.ts` | GET | `/locations/neighborhoods` | Listar bairros |
| `get-locations-neighborhood-by-name.service.ts` | GET | `/locations/neighborhoods/:name` | Buscar bairro |
| `post-locations-cities-find-many.service.ts` | POST | `/locations/cities/find-many` | Buscar varias cidades |
| `post-locations-neighborhoods-find-many-by-cities.service.ts` | POST | `/locations/neighborhoods/find-many-by-cities` | Bairros por cidades |

#### Analytics (6 services)

| Arquivo | Metodo | Endpoint | Descricao |
|---------|--------|----------|-----------|
| `post-analytics-agency-ranking.service.ts` | POST | `/analytics/agency-ranking` | Ranking de agencias |
| `post-analytics-supply-by-property-type.service.ts` | POST | `/analytics/supply-by-property-type` | Oferta por tipo |
| `post-analytics-supply-heatmap.service.ts` | POST | `/analytics/supply-heatmap` | Heatmap de oferta |
| `post-analytics-supply-neighborhood-ranking.service.ts` | POST | `/analytics/supply-neighborhood-ranking` | Ranking bairros (oferta) |
| `post-analytics-search-demand-heatmap.service.ts` | POST | `/analytics/search-demand-heatmap` | Heatmap de demanda |
| `post-analytics-search-demand-neighborhood-ranking.service.ts` | POST | `/analytics/search-demand-neighborhood-ranking` | Ranking bairros (demanda) |

#### Captacao / Sourcing (16 services)

| Arquivo | Metodo | Endpoint | Descricao |
|---------|--------|----------|-----------|
| `get-property-listing-acquisitions.service.ts` | GET | `/property-listing-acquisitions` | Listar captacoes |
| `get-property-listing-acquisition-by-id.service.ts` | GET | `/property-listing-acquisitions/:id` | Detalhes da captacao |
| `post-property-listing-acquisition.service.ts` | POST | `/property-listing-acquisitions` | Criar captacao |
| `patch-property-listing-acquisition.service.ts` | PATCH | `/property-listing-acquisitions/:id` | Atualizar captacao |
| `delete-property-listing-acquisition.service.ts` | DELETE | `/property-listing-acquisitions/:id` | Remover captacao |
| `get-property-listing-acquisitions-stages.service.ts` | GET | `/property-listing-acquisitions/stages` | Listar estagios |
| `get-property-listing-acquisitions-stage-by-id.service.ts` | GET | `/property-listing-acquisitions/stages/:id` | Detalhes do estagio |
| `post-property-listing-acquisitions-stage.service.ts` | POST | `/property-listing-acquisitions/stages` | Criar estagio |
| `patch-property-listing-acquisitions-stage.service.ts` | PATCH | `/property-listing-acquisitions/stages/:id` | Atualizar estagio |
| `delete-property-listing-acquisitions-stage.service.ts` | DELETE | `/property-listing-acquisitions/stages/:id` | Remover estagio |
| `get-property-listing-acquisition-contacts.service.ts` | GET | `.../contacts` | Listar contatos |
| `post-property-listing-acquisition-contact.service.ts` | POST | `.../contacts` | Criar contato |
| `get-property-listing-acquisitions-contact-history.service.ts` | GET | `.../contact-history` | Historico de contato |
| `post-property-listing-acquisition-contact-history.service.ts` | POST | `.../contact-history` | Criar historico |
| `patch-property-listing-acquisition-contact-history.service.ts` | PATCH | `.../contact-history/:id` | Atualizar historico |
| `delete-property-listing-acquisition-contact-history.service.ts` | DELETE | `.../contact-history/:id` | Remover historico |

Mais services de sourcing:
- `post-property-listing-acquisition-contact-history-note.service.ts` - Notas no historico
- `patch-property-listing-acquisition-contact-history-note.service.ts` - Atualizar notas
- `delete-property-listing-acquisition-contact-history-note.service.ts` - Remover notas
- `get-property-listing-acquisition-contact-history-by-id.service.ts` - Historico por ID
- `get-property-listing-acquisitions-revealed-properties.service.ts` - Imoveis revelados

#### Pesquisa de Proprietarios (6 services)

| Arquivo | Metodo | Endpoint | Descricao |
|---------|--------|----------|-----------|
| `get-property-owner-finder-by-address.service.ts` | GET | `/property-owner-finder/by-address` | Buscar por endereco |
| `get-property-owner-finder-by-details.service.ts` | GET | `/property-owner-finder/by-details` | Buscar por detalhes |
| `get-property-owner-finder-by-national-id.service.ts` | GET | `/property-owner-finder/by-national-id` | Buscar por CPF |
| `get-property-owner-finder-companies-by-address.service.ts` | GET | `.../companies/by-address` | Empresas por endereco |
| `get-property-owner-finder-companies-by-details.service.ts` | GET | `.../companies/by-details` | Empresas por detalhes |
| `get-property-owner-finder-company-by-registration-number.service.ts` | GET | `.../company/by-cnpj` | Empresa por CNPJ |

#### Compras e Assinatura (4 services)

| Arquivo | Metodo | Endpoint | Descricao |
|---------|--------|----------|-----------|
| `get-purchases.service.ts` | GET | `/purchases` | Buscar assinaturas/compras |
| `post-purchases-add-city.service.ts` | POST | `/purchases/add-city` | Adicionar cidade ao plano |
| `put-purchases-update-city.service.ts` | PUT | `/purchases/update-city` | Atualizar cidade |
| `put-purchases-update-default-city.service.ts` | PUT | `/purchases/update-default-city` | Definir cidade padrao |

#### Empresa (2 services)

| Arquivo | Metodo | Endpoint | Descricao |
|---------|--------|----------|-----------|
| `get-my-company.service.ts` | GET | `/companies/me` | Buscar dados da empresa |
| `patch-my-company.service.ts` | PATCH | `/companies/me` | Atualizar empresa |

#### Armazenamento (2 services)

| Arquivo | Metodo | Endpoint | Descricao |
|---------|--------|----------|-----------|
| `post-storage-generate-signed-url.service.ts` | POST | `/storage/signed-url` | Gerar URL assinada para upload |
| `post-storage-make-object-public.service.ts` | POST | `/storage/make-public` | Tornar objeto publico |

#### Outros (3 services)

| Arquivo | Metodo | Endpoint | Descricao |
|---------|--------|----------|-----------|
| `get-dashboard-user.service.ts` | GET | `/dashboard/users/:id` | Dados de dashboard |
| `get-properties-by-id.service.ts` | GET | `/properties/:id` | Buscar propriedade por ID |
| `post-properties.service.ts` | POST | `/properties` | Criar propriedade |

### Helpers de Transformacao

| Arquivo | Funcao | Descricao |
|---------|--------|-----------|
| `map-filters-to-api.helper.ts` | `mapFiltersToApi()` | Converte FilterState da UI para formato da API (query params, pagination, sorting) |
| `map-filters-to-search-map.helper.ts` | `mapFiltersToSearchMap()` | Converte filtros para busca especifica do mapa |
| `map-api-to-property-data.helper.ts` | `mapApiToPropertyData()` | Converte resposta da API para modelo de UI (cards) |
| `map-api-to-property-details.helper.ts` | `mapApiToPropertyDetails()` | Converte resposta para modelo de detalhes |
| `map-api-property-type-to-modal.helper.ts` | `mapApiPropertyTypeToModal()` | Tipo de imovel API -> display no modal |
| `map-property-type-to-api.helper.ts` | `mapPropertyTypeToApi()` | Tipo de imovel UI -> API |
| `upload-profile-photo.helper.ts` | `uploadProfilePhoto()` | Upload de foto de perfil (signed URL + upload) |
| `get-header-function.ts` | `getHeader()` | Builder de headers HTTP (Content-Type + Auth) |
| `clear-swr-cache.function.ts` | `clearAllUserDataCache()` | Invalida todo cache SWR do usuario |
| `mock-adapter.function.ts` | - | Configuracao do mock adapter para testes |

---

## 9. Modulos de Feature

### 9.1 Search (Pesquisa de Imoveis)

**Rota:** `/pesquisar-anuncios`
**Diretorio:** `src/scripts/modules/search/` + `src/scripts/pages/private/search/`

#### Componentes

| Componente | Arquivo | Descricao |
|-----------|---------|-----------|
| `SearchComponent` | `pages/private/search/search.component.tsx` | Pagina principal (orquestra tudo) |
| `FilterBar` | `modules/search/filter/filter-bar.tsx` | Barra de filtros superior |
| `FilterModal` | `modules/search/filter/filter-modal.tsx` | Modal de filtros avancados |
| `MapComponent` | `modules/search/map/map.tsx` | Mapa Google Maps com marcadores |
| `PropertiesCard` | `modules/search/properties-card.tsx` | Card de imovel na listagem |
| `PropertyDetails` | `modules/search/property-details/property-details.tsx` | Modal de detalhes |
| `PropertyGallery` | `modules/search/property-details/property-gallery.tsx` | Galeria de imagens |
| `FullscreenGallery` | `modules/search/property-details/fullscreen-gallery.tsx` | Galeria fullscreen |
| `PropertyInformation` | `modules/search/property-details/property-information.tsx` | Info do imovel |
| `PropertyLocalization` | `modules/search/property-details/property-localization.tsx` | Localizacao no mapa |

#### Filtros Disponíveis

**Modelo de Negocio:** Venda, Aluguel

**Finalidade:** Residencial, Comercial, Industrial, Agricultura

**Tipos de Imovel (30+):**
- Apartamentos: Padrao, Flat, Loft, Studio, Duplex, Triplex, Cobertura
- Comerciais: Sala, Casa, Ponto, Galpao, Loja, Predio, Clinica, Coworking, Sobreloja
- Casas: Casa, Sobrado, Sitio, Chale, Chacara, Edicula
- Terrenos: Terreno, Fazenda
- Outros: Garagem, Quarto, Resort, Republica, Box, Tombado, Granja, Haras

**Filtros Numericos:** Quartos, Banheiros, Suites, Vagas, Area (min/max), Preco (min/max)

**Outros:** Tipo de anunciante, Lancamento, Keywords, Bairros, Desenho no mapa

#### Map Integration

- **Google Maps** com `@react-google-maps/api`
- Marcadores individuais por imovel
- InfoWindow com resumo ao clicar
- Drawing Manager para desenhar poligonos/circulos de area de busca
- Busca por endereco com geocodificacao
- Conversao de overlays para GeoJSON (`map-utils.ts`)

#### Data Flow

```
FilterBar/FilterModal -> setFilters() -> FilterSelectionContext
     |
     v
mapFiltersToApi(filters, cityCodeMap, page, size, sortBy, sortOrder)
     |
     v
postPropertyAdSearch(apiParams)
     |
     v
mapApiToPropertyData(response) -> PropertiesCard
```

#### Paginacao e Ordenacao

- **18 itens por pagina**
- Ordenacao: Relevancia, Preco (asc/desc), Preco/m2 (asc/desc), Area (asc/desc)
- Componente `CustomPagination` com first/prev/next/last

---

### 9.2 Sourcing (Captacao)

**Rota:** `/captacao`
**Diretorio:** `src/scripts/modules/sourcing/` + `src/scripts/pages/private/sourcing/`

#### Componentes

| Componente | Arquivo | Descricao |
|-----------|---------|-----------|
| `SourcingComponent` | `pages/private/sourcing/sourcing.component.tsx` | Pagina principal |
| `Kanban` | `modules/sourcing/kanban.component.tsx` | Board Kanban com DnD |
| `KanbanCards` | `modules/sourcing/kanban-cards.component.tsx` | Cards do Kanban |
| `ListView` | `modules/sourcing/list-view.component.tsx` | Vista em lista (accordion) |
| `ButtonsBar` | `modules/sourcing/buttons-bar.tsx` | Barra de acoes |
| `SourcingTypeModal` | `modules/sourcing/sourcing-type-modal.tsx` | Escolha tipo de captacao |
| `PropertySourcingModal` | `modules/sourcing/property-sourcing-modal.tsx` | Form captacao por imovel |
| `ContactSourcingModal` | `modules/sourcing/contact-sourcing-modal.tsx` | Form captacao por contato |
| `PropertySourcingDetails` | `modules/sourcing/property-sourcing-details.component.tsx` | Detalhes captacao imovel |
| `ContactSourcingDetails` | `modules/sourcing/contact-sourcing-details.tsx` | Detalhes captacao contato |
| `ResidentSearchModal` | `modules/sourcing/resident-search-modal.tsx` | Busca de moradores |
| `SearchResidentResultModal` | `modules/sourcing/search-resident-result-modal.tsx` | Resultados busca |
| `RevealContactModal` | `modules/sourcing/reveal-contact-modal.tsx` | Revelar contato (creditos) |
| `CreateContactModal` | `modules/sourcing/create-contact-modal.tsx` | Criar contato manual |
| `CreatePropertyCaptureModal` | `modules/sourcing/create-property-capture-modal.tsx` | Capturar imovel manual |

#### Kanban Board

- Usa **Atlaskit Pragmatic Drag and Drop** para drag-and-drop acessivel
- Colunas configuraveis (stages customizaveis via API)
- **Colunas padrao:**
  - Captacao por Imovel (verde #C8E6C9)
  - Captacao por Contato (azul #BBDEFB)
  - Prospeccao (rosa #F8BBD0)
  - Visita (laranja #FFE0B2)
- Auto-scroll horizontal durante drag
- Reordenacao de cards dentro da mesma coluna
- Movimentacao entre colunas atualiza status via API

#### Tipos de Captacao

1. **Captacao por Imovel:** endereco, numero, complemento, tipo, titulo
2. **Captacao por Contato:** nome, CPF, email, telefone, titulo

#### Pesquisa de Moradores

Funcionalidade que permite buscar proprietarios/moradores de um endereco:
1. Usuario informa endereco/CPF/detalhes
2. API retorna lista de moradores (dados parciais)
3. Para ver dados completos, usuario "revela" contato (consome credito RESIDENT_SEARCH)
4. Dados revelados podem ser convertidos em captacao automaticamente

#### Status da Captacao

- `IN_ACQUISITION` - Em processo de captacao
- `DECLINED` - Recusada
- `ACQUIRED` - Captada com sucesso

---

### 9.3 Evaluation (Avaliacao)

**Rota:** `/avaliacao`
**Diretorio:** `src/scripts/modules/evaluation/` + `src/scripts/pages/private/evaluation/`

#### Componentes

| Componente | Arquivo | Descricao |
|-----------|---------|-----------|
| `EvaluationComponent` | `pages/private/evaluation/evaluation.component.tsx` | Pagina principal |
| `EvaluationPropertyCard` | `modules/evaluation/evaluation-property-card.tsx` | Card com checkbox |
| `EvaluationActionBar` | `modules/evaluation/evaluation-action-bar.tsx` | Barra de acoes |
| `MetricCards` | `modules/evaluation/metric-cards.tsx` | Cards de metricas |
| `AnalysisSummaryDrawer` | `modules/evaluation/analysis-summary-drawer.tsx` | Drawer de analise |
| `GenerateReportModal` | `modules/evaluation/generate-report-modal.tsx` | Modal gerar relatorio |
| `ReportTemplate` | `modules/evaluation/report-template.tsx` | Template do PDF |
| `PriceDistributionChart` | `modules/evaluation/charts/price-distribution-chart.tsx` | Grafico preco |
| `PricePerM2ComparisonChart` | `modules/evaluation/charts/price-per-m2-comparison-chart.tsx` | Grafico preco/m2 |
| `PropertyTypesChart` | `modules/evaluation/charts/property-types-chart.tsx` | Grafico tipos |
| `ListViewImageCarousel` | `modules/evaluation/list-view-image-carousel.tsx` | Carrossel de imagens |

#### Funcionalidades

- **Selecao multipla** de imoveis para comparacao
- **Filtros avancados** (mesmos do Search)
- **Graficos de analise:** distribuicao de preco, preco/m2, tipos de imovel
- **Geracao de relatorio PDF** com jsPDF + jspdf-autotable
- **Exportacao Excel** com xlsx (SheetJS)
- **Drawer de resumo** com metricas calculadas
- **Metric cards:** preco medio, area media, preco/m2 medio

#### Helpers de Avaliacao (`evaluation-helpers.ts`)

- Calculos de preco medio, area media
- Traducao de tipos de imovel
- Formatacao de valores monetarios

---

### 9.4 Analyses (Analises)

**Rota:** `/analises`
**Diretorio:** `src/scripts/modules/analyses/` + `src/scripts/pages/private/analyses/`

#### Componentes

| Componente | Arquivo | Descricao |
|-----------|---------|-----------|
| `AnalysesComponent` | `pages/private/analyses/analyses.component.tsx` | Pagina principal |
| `AnalyticsTabs` | `modules/analyses/analytics-tabs.tsx` | Tabs (Demanda/Oferta/Insights) |
| `HeatmapToggle` | `modules/analyses/heatmap-toggle.tsx` | Toggle tipo de heatmap |
| `HeatmapLegend` | `modules/analyses/heatmap-legend.tsx` | Legenda do heatmap |
| `RankingDemandAccordion` | `modules/analyses/ranking-demand-accordion.tsx` | Ranking bairros (demanda) |
| `RankingSupplyAccordion` | `modules/analyses/ranking-supply-accordion.tsx` | Ranking bairros (oferta) |
| `SupplyByTypeAccordion` | `modules/analyses/supply-by-type-accordion.tsx` | Oferta por tipo |
| `OpportunityInsightsAccordion` | `modules/analyses/opportunity-insights-accordion.tsx` | Oportunidades |
| `AgencyRankingAccordion` | `modules/analyses/agency-ranking-accordion.tsx` | Ranking agencias |
| `AgencyRankingTable` | `modules/analyses/tables/agency-ranking-table.tsx` | Tabela agencias |
| `SupplyByTypeChart` | `modules/analyses/charts/supply-by-type-chart.tsx` | Grafico oferta |

#### Funcionalidades

- **Heatmaps** de demanda e oferta no mapa
- **Toggle** entre modos de visualizacao do heatmap
- **Rankings de bairros** por demanda e oferta (com dados de 3 meses)
- **Ranking de agencias/imobiliarias**
- **Insights de oportunidade** (bairros com alta demanda e baixa oferta)
- **Graficos** de oferta por tipo de imovel

---

### 9.5 Management (Configuracoes)

**Rota:** `/configuracoes`
**Diretorio:** `src/scripts/pages/private/management/`

#### Estrutura

```
management/
|-- management.component.tsx       # Pagina principal com sidebar
|-- profile/
|   +-- profile.component.tsx      # Edicao de perfil
|-- security/
|   +-- security.component.tsx     # Alteracao de senha
|-- subscription/
|   +-- subscription.component.tsx # Detalhes do plano
|-- upgrade/
|   +-- upgrade.component.tsx      # Upgrade de plano
|-- company/
|   +-- company.component.tsx      # Dados da empresa
+-- collaborators/
    |-- collaborators.component.tsx # Lista de colaboradores
    +-- user-details.component.tsx  # Detalhes do colaborador
```

#### Secoes e Visibilidade por Role

| Secao | URL Param | OWNER | ADMIN | MEMBER |
|-------|-----------|-------|-------|--------|
| Perfil | `?section=profile` | Sim | Sim | Sim |
| Seguranca | `?section=security` | Sim | Sim | Sim |
| Empresa | `?section=company` | Sim (BUSINESS) | Nao | Nao |
| Colaboradores | `?section=collaborators` | Sim (BUSINESS) | Sim | Nao |
| Meu Plano | `?section=subscription` | Sim | Nao | Nao |
| Upgrade | `?section=upgrade` | Sim | Nao | Nao |

#### Perfil
- Edicao de nome, email, telefone
- Upload de foto de perfil (via signed URL)
- Visualizacao de CPF

#### Seguranca
- Alteracao de senha (senha atual + nova + confirmacao)
- Validacao de senha forte

#### Empresa (Plano BUSINESS)
- CNPJ, Razao Social, Nome Fantasia
- Endereco, Telefone, Email corporativo

#### Colaboradores (Plano BUSINESS)
- Lista de membros da equipe
- Convite por email (envia convite que o usuario aceita em `/invite/:token`)
- Gerenciamento de roles (OWNER, ADMIN, MEMBER)
- Limites de creditos individuais por tipo (avaliacao, busca de moradores, radars)
- Ativar/desativar colaboradores

---

## 10. Componentes Reutilizaveis (Library)

**Diretorio:** `src/scripts/library/components/`

### PrivateLayout (`private-layout.tsx`)

Wrapper para todas as paginas autenticadas. Adiciona:
- `FloatingTopMenu` (menu superior fixo)
- Estrutura de layout padrao
- Hook `useViewportHeight` para ajuste mobile

### FloatingTopMenu (`floating-top-menu.tsx`)

Menu superior fixo presente em todas as paginas privadas:

- **Logo Isket** (link para /pesquisar-anuncios)
- **Botoes de navegacao:**
  - Analises (`/analises`)
  - Pesquisar Anuncios (`/pesquisar-anuncios`)
  - Captacao (`/captacao`)
  - Avaliacao (`/avaliacao`)
- **Botao Configuracoes** (`/configuracoes`)
- **Menu do usuario** (avatar, nome, email, role, logout)
- **Popups de creditos:** Avaliacao de Imoveis e Busca de Moradores (exibe remaining/total)
- **Botao de upgrade** (se aplicavel)
- **Responsivo:** Items se adaptam em telas menores

### SidebarMenu (`sidebar-menu.tsx`)

Menu lateral alternativo (usado no Management):
- Secoes organizadas por categoria (CONTA, EMPRESA, FATURAMENTO)
- Indicador visual da secao ativa
- Responsivo (drawer no mobile)

### CustomTextField (`custom-text-field.tsx`)

Wrapper do MUI TextField com:
- Toggle de visibilidade de senha (icone de olho)
- Props padrao aplicadas

### CustomPagination (`custom-pagination.tsx`)

Componente de paginacao com:
- Botoes: Primeiro, Anterior, Proximo, Ultimo
- Indicador de pagina atual / total
- Callback `onChange(page)`

### CitySelect (`city-select.tsx`)

Dropdown para selecao de cidade:
- Busca cidades via API (`getLocationsCities`)
- Autocomplete com busca
- Retorna codigo da cidade

### GoogleButton (`google-button.tsx`)

Botao estilizado para login/cadastro com Google:
- Icone do Google
- Texto configuravel ("Entrar com Google" / "Cadastrar com Google")
- Integra com `useGoogleAuth`

### AnimatedIsketLogo (`animated-isket-logo.tsx`)

Logo animado usado como loading screen:
- Exibido durante validacao de auth
- Animacao CSS

### CompleteProfileModal (`complete-profile-modal.tsx`)

Modal exibido quando perfil esta incompleto:
- Campos: nome, cidade
- Validacao de campos obrigatorios

### SubscriptionBlockedModal (`subscription-blocked-modal.tsx`)

Modal exibido quando assinatura esta expirada:
- Mensagem informativa
- Botao de contato/upgrade
- Bloqueia acesso a features

### AddCitiesModal (`add-cities-modal.tsx`)

Modal para adicionar cidades:
- Lista de cidades disponiveis
- Multi-selecao
- Busca por nome

### EditCityModal (`edit-city-modal.tsx`)

Modal para editar cidades selecionadas:
- Remover cidades
- Trocar cidade padrao

---

## 11. Hooks Customizados

### useAuth()

**Arquivo:** `src/scripts/modules/access-manager/auth.hook.ts`
**Retorna:** `IAuth` (store, login, loginWithGoogle, isLogged, logout, refreshAuth, isValidating, clearSubscriptionBlocked)
**Uso:** Acessar dados de autenticacao em qualquer componente dentro do AuthProvider.

### useCitySelection()

**Arquivo:** `src/scripts/modules/city-selection/city-selection.hook.ts`
**Retorna:** `{ cities, setCities, clearCities }`
**Uso:** Gerenciar cidades selecionadas globalmente.

### useFilterSelection()

**Arquivo:** `src/scripts/modules/filter-selection/filter-selection.hook.ts`
**Retorna:** `{ filters, setFilters, clearFilters }`
**Uso:** Gerenciar estado dos filtros de pesquisa.

### useViewportHeight()

**Arquivo:** `src/scripts/library/hooks/use-viewport-height.ts`
**Retorna:** void (side effect)
**Uso:** Define CSS variable `--app-height` com a altura real do viewport. Resolve problema de teclado virtual no mobile (iOS/Android) que altera o viewport.
**Como funciona:**
- Escuta `resize` e `scroll` do `window.visualViewport`
- Atualiza `document.documentElement.style.setProperty('--app-height', '...')`

### useEffectiveCredits(unitType)

**Arquivo:** `src/scripts/library/hooks/use-effective-credits.ts`
**Parametro:** `unitType: "PROPERTY_VALUATION" | "RESIDENT_SEARCH" | "RADARS"`
**Retorna:**
```typescript
{
  remaining: number;         // Creditos restantes
  total: number;             // Total de creditos
  consumed: number;          // Creditos consumidos
  hasIndividualLimit: boolean; // Se tem limite individual
  isLoading: boolean;
}
```
**Logica:**
1. Busca limites individuais do usuario (`getUserCreditLimits`)
2. Busca creditos da conta (`getPurchases`)
3. Se usuario tem limite individual para o tipo: usa dados do limite
4. Se nao tem: usa creditos gerais da conta

### useAllEffectiveCredits()

**Arquivo:** Mesmo arquivo acima
**Retorna:** `{ propertyValuation, residentSearch, radars }` (cada um e um EffectiveCredits)
**Uso:** Obter todos os tipos de credito de uma vez (usado no FloatingTopMenu).

### useGoogleAuth(onSuccess, onError?)

**Arquivo:** `src/scripts/library/hooks/useGoogleAuth.ts`
**Parametros:**
- `onSuccess: (response: { code: string }) => void | Promise<void>` - Callback com o auth code
- `onError?: (error: string) => void` - Callback de erro
**Retorna:** `{ loginWithGoogle, isLoading, error, clearError }`
**Uso:** Gerencia o fluxo completo de login Google OAuth (auth-code flow).

### Hooks SWR (Data Fetching)

Cada service que tem dados a serem cacheados expoe um hook SWR:

| Hook | Dados |
|------|-------|
| `useGetAuthMe()` | Perfil do usuario logado |
| `useGetPurchases()` | Assinaturas/compras |
| `useGetUsers()` | Lista de colaboradores |
| `useGetUser(id)` | Detalhes de um usuario |
| `useGetUserCreditLimits(userId)` | Limites de credito |
| `useGetPropertyListingAcquisitionsStages()` | Estagios do Kanban |
| `useGetMyCompany()` | Dados da empresa |
| `useGetUserInvites()` | Convites pendentes |

---

## 12. Helpers e Utilitarios

### mapFiltersToApi()

**Arquivo:** `src/services/helpers/map-filters-to-api.helper.ts`
**Descricao:** Converte o estado de filtros da UI (FilterState) para o formato esperado pela API.
**Parametros:** `(filters, cityCodeMap, page, size, sortBy, sortOrder, sortType)`
**Responsabilidades:**
- Mapeia tipos de imovel booleanos para array de strings da API
- Converte sliders de preco/area para min/max
- Inclui geometrias de desenho no mapa
- Aplica paginacao e ordenacao
- Mapeia codigos de cidade

### mapFiltersToSearchMap()

**Arquivo:** `src/services/helpers/map-filters-to-search-map.helper.ts`
**Descricao:** Versao simplificada do mapFiltersToApi para busca no mapa (sem paginacao).

### mapApiToPropertyData()

**Arquivo:** `src/services/helpers/map-api-to-property-data.helper.ts`
**Descricao:** Converte resposta da API para modelo de dados da UI (cards de imovel).

### mapApiToPropertyDetails()

**Arquivo:** `src/services/helpers/map-api-to-property-details.helper.ts`
**Descricao:** Converte resposta da API para modelo detalhado (modal de detalhes).

### mapApiPropertyTypeToModal()

**Arquivo:** `src/services/helpers/map-api-property-type-to-modal.helper.ts`
**Descricao:** Traduz tipo de imovel da API para label legivel no modal de filtros.

### mapPropertyTypeToApi()

**Arquivo:** `src/services/helpers/map-property-type-to-api.helper.ts`
**Descricao:** Traduz tipo de imovel da UI para valor da API.

### convertCityDescriptionToCode()

**Arquivo:** `src/scripts/library/helpers/convert-city-description-to-code.helper.ts`
**Descricao:** Converte descricao de cidade para codigo.
**Exemplo:** `"Curitiba, PR, Brasil"` -> `"curitiba_pr"`
**Logica:** Remove acentos, converte para lowercase, separa por virgula, junta com underscore.

### validatePassword()

**Arquivo:** `src/scripts/library/helpers/validate-password.helper.ts`
**Descricao:** Valida senha e retorna array de erros.
**Regras:**
- Minimo 8 caracteres
- Pelo menos 1 letra minuscula
- Pelo menos 1 letra maiuscula
- Pelo menos 1 numero
- Pelo menos 1 caractere especial

### uploadProfilePhoto()

**Arquivo:** `src/services/helpers/upload-profile-photo.helper.ts`
**Descricao:** Upload de foto de perfil usando signed URL.
**Fluxo:**
1. Gera signed URL via `postStorageGenerateSignedUrl`
2. Faz upload do arquivo para a signed URL
3. Torna objeto publico via `postStorageMakeObjectPublic`

### clearAllUserDataCache()

**Arquivo:** `src/services/helpers/clear-swr-cache.function.ts`
**Descricao:** Invalida TODO o cache SWR. Chamada no login e logout.
**Caches invalidados:** authMe, purchases, myCompany, users, e todas as rotas dinamicas.

### createRequiredContext()

**Arquivo:** `src/scripts/library/helpers/create-required-context.function.ts`
**Descricao:** Factory para criar Context + Hook com validacao automatica.
**Retorna:** `[Context, useRequiredContext]`
**Erro se usado fora do Provider:** `"useRequiredContext must be used within a Provider"`

### getHeader()

**Arquivo:** `src/services/helpers/get-header-function.ts`
**Descricao:** Builder de headers HTTP (Content-Type + Authorization).

---

## 13. Tipos e Interfaces Principais

### Autenticacao

```typescript
// src/scripts/modules/access-manager/auth.interface.ts
interface IAuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;     // URL da foto de perfil
  sub?: string;         // Google ID
}

interface IAuthStore {
  token: string | null;
  refreshToken: string | null;
  user: IAuthUser | null;
  subscriptionBlocked: boolean;  // true quando getAuthMe retorna 403
}

// src/scripts/modules/access-manager/auth-context.types.ts
interface IAuth {
  store: IAuthStore;
  login(tokens: { accessToken; refreshToken }, user: IAuthUser, redirect?: string): void;
  loginWithGoogle(googleResponse: { code?; idToken?; accessToken? }): Promise<void>;
  isLogged: boolean;
  logout(): void;
  refreshAuth(): Promise<boolean>;
  isValidating: boolean;
  clearSubscriptionBlocked(): void;
}
```

### Filtros

```typescript
// Estado completo dos filtros (30+ campos)
interface FilterState {
  search: string;
  cities: string[];
  neighborhoods: string[];
  addressCoordinates?: { lat: number; lng: number };
  addressZoom?: number;
  drawingGeometries?: Array<GeoJSON>;
  venda: boolean;
  aluguel: boolean;
  residencial: boolean;
  comercial: boolean;
  industrial: boolean;
  agricultura: boolean;
  // Tipos de imovel (cada um e boolean)
  apartamento_padrao: boolean;
  apartamento_flat: boolean;
  // ... 28+ tipos
  quartos: number | null;
  banheiros: number | null;
  suites: number | null;
  garagem: number | null;
  area_min: number;
  area_max: number;
  preco_min: number;
  preco_max: number;
  proprietario_direto: boolean;
  imobiliaria: boolean;
  portal: boolean;
  lancamento: boolean;
  propertyFeatures: string[];
}
```

### Enums de Imovel

```typescript
// Modelo de negocio
type BusinessModel = "SALE" | "RENTAL" | "EXCHANGE" | "LEASE" | ...;

// Finalidade
type PropertyPurpose = "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "AGRICULTURAL" | ...;

// Tipo de imovel
type PropertyType = "APARTMENT" | "HOUSE" | "COMMERCIAL_ROOM" | "LAND" | "LOFT" | ...;

// Status do anuncio
type AdStatus = "PUBLISHED" | "PENDING" | "WITHDRAWN" | "EXPIRED" | "PRICE_REDUCED" | "NEW_LISTING";

// Status do imovel
type PropertyStatus = "AVAILABLE" | "SOLD" | "UNDER_CONTRACT" | "OFF_MARKET";

// Tipo de anunciante
type AdvertiserType = "REAL_ESTATE" | "INDIVIDUAL" | "PORTAL";
```

### Compras/Assinaturas

```typescript
// Tipos de unidade de credito
type ProductUnitType = "USERS" | "CITIES" | "PROPERTY_VALUATION" | "RESIDENT_SEARCH" | "RADARS";

// Tipos de plano
type ProductType = "FIXED_PLAN" | "CUSTOM_PLAN" | "TRIAL_PLAN" | "CREDIT_PACKAGE";

// Creditos restantes
interface IRemainingUnit {
  type: ProductUnitType;
  unitsRemaining: number;
}
```

### Respostas da API

```typescript
// Wrapper de sucesso
interface SuccessResponse<D> {
  data: D;
  message?: string;
}

// Wrapper de erro
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
```

### Creditos Efetivos

```typescript
interface EffectiveCredits {
  remaining: number;
  total: number;
  consumed: number;
  hasIndividualLimit: boolean;
  isLoading: boolean;
}
```

---

## 14. Sistema de Creditos

### Visao Geral

O sistema de creditos controla o acesso a funcionalidades pagas:

| Tipo de Credito | Codigo | Uso |
|----------------|--------|-----|
| Avaliacao de Imoveis | `PROPERTY_VALUATION` | Gerar relatorios de avaliacao |
| Busca de Moradores | `RESIDENT_SEARCH` | Revelar dados de proprietarios |
| Radares | `RADARS` | Funcionalidade de radares |

### Hierarquia de Limites

```
Conta (Plano/Assinatura)
  |-- Creditos globais (compartilhados entre todos os usuarios)
  |
  +-- Usuario Individual
      +-- Limite individual (opcional, definido pelo OWNER/ADMIN)
```

**Logica de prioridade (useEffectiveCredits):**
1. Se o usuario tem **limite individual** para o tipo: usa o limite individual
2. Se **nao tem limite individual**: usa creditos globais da conta

### Onde os Creditos Aparecem na UI

1. **FloatingTopMenu:** Popup ao lado dos botoes mostra `remaining/total` para cada tipo
2. **RevealContactModal (Sourcing):** Mostra creditos antes de revelar contato
3. **Management > Collaborators:** OWNER pode definir limites individuais por usuario
4. **Subscription:** Exibe total de creditos do plano

---

## 15. Tema e Design System

### Cores

```
#262353  - PRIMARY (roxo escuro) - Fundo do menu, textos principais
#E3003A  - SECONDARY (vermelho) - Botoes, acentos, CTAs
#C70033  - ACCENT (vermelho escuro) - Hover em botoes
#A6002A  - DARK (vermelho muito escuro) - Hover intenso
#F8F9FA  - LIGHT (cinza claro) - Fundo de cards
#FFFFFF  - WHITE - Fundo geral
#E0E0E0  - BORDER - Bordas de inputs
#333333  - TEXT_PRIMARY - Texto principal
```

### Gradients

- **Botao primario:** `linear-gradient(135deg, #E3003A, #C70033)`
- **Botao hover:** `linear-gradient(135deg, #C70033, #A6002A)`

### Shadows

- **shadow:** `0 25px 50px -12px rgba(0, 0, 0, 0.25)` - Elevacao padrao
- **shadowHover:** `0 8px 25px rgba(38, 35, 83, 0.15)` - Hover em cards
- **shadowFocus:** `0 8px 25px rgba(227, 0, 58, 0.2)` - Focus em inputs
- **shadowButton:** `0 8px 25px rgba(227, 0, 58, 0.3)` - Botoes
- **shadowButtonHover:** `0 12px 35px rgba(227, 0, 58, 0.4)` - Botoes hover

### Component Overrides

- **Botoes:** Fundo vermelho, texto branco, borderRadius 8, sem textTransform, padding 12px 24px
- **TextFields:** borderRadius 8, borda cinza, focus roxo (#262353)
- **Selects:** borderRadius 8, scrollbar fino
- **MenuItems:** Hover vermelho sutil (8% opacity)
- **Menus:** maxHeight 200px, scrollbar fino, shadow pesado
- **Scrollbar global:** 6px largura, cinza, arredondado

### Responsividade

**Breakpoints MUI:**
- `xs`: 0-599px (mobile)
- `sm`: 600-899px (tablet)
- `md`: 900-1199px (desktop pequeno)
- `lg`: 1200px+ (desktop)

**Comportamentos responsivos:**
- FloatingTopMenu: botoes de menu se adaptam, upgrade button oculto abaixo de 1084px
- Search: mapa oculto no mobile, apenas cards
- Management: sidebar como drawer no mobile
- Cards: empilham verticalmente no mobile
- Modals: largura total no mobile, centrados no desktop

### Acessando o Tema em Componentes

```typescript
import { useTheme } from "@mui/material/styles";

const theme = useTheme();
// Cores: theme.palette.brand.primary, theme.palette.brand.secondary
// Shadows: theme.palette.brand.shadow, theme.palette.brand.shadowHover
// Gradients: theme.palette.brand.gradient
```

---

## 16. Deploy e CI/CD

### Build

```bash
# Development
pnpm build:development   # tsc -b && vite build --mode development

# Production
pnpm build:production    # tsc -b && vite build --mode production
```

**Output:** diretorio `dist/` com arquivos estaticos (HTML, JS, CSS, assets)

### Vercel (`vercel.json`)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- SPA rewrite: todas as rotas redirecionam para `index.html`
- O React Router assume a navegacao client-side

### Google App Engine (`app.yaml`)

```yaml
runtime: nodejs20

handlers:
  - url: /(.*\.(js|css|ico|png|jpg|svg|json|txt|html))$
    static_files: dist/\1
    upload: dist/.*\.(js|css|ico|png|jpg|svg|json|txt|html)

  - url: /.*
    static_files: dist/index.html
    upload: dist/index.html
```

- Runtime: Node.js 20
- Arquivos estaticos servidos diretamente
- Demais rotas: `index.html` (SPA)

### GitHub Pages

```bash
pnpm deploy   # Executa predeploy (build) e gh-pages -d dist
```

### Variavel de Ambiente no Build

O `VITE_API_ENV` determina qual URL de API sera usada no build:
- `--mode development`: usa `.env.development` (se existir) ou `.env`
- `--mode production`: usa `.env.production`

---

## 17. Integracoes Externas

### Google OAuth

**Pacote:** `@react-oauth/google` v0.12.2
**Config:** `src/scripts/config/google.constant.ts`

```typescript
GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
}
```

**Fluxo:** auth-code (nao implicit)
1. Frontend obtem `code` do Google
2. Backend troca `code` por tokens do Google
3. Backend cria/busca usuario e retorna JWT proprios

**Pre-requisitos no Google Console:**
- Dominio autorizado para OAuth
- Redirect URI configurado
- Client ID com permissoes corretas

### Google Maps

**Pacotes:** `@react-google-maps/api` + `@googlemaps/js-api-loader`
**API Key:** `VITE_GOOGLE_MAPS_API_KEY`

**Uso no projeto:**
- Exibicao de imoveis no mapa com marcadores
- InfoWindow com detalhes do imovel
- Drawing Manager para desenhar poligonos/circulos
- Busca por endereco (geocoding)
- Heatmaps de demanda/oferta (analytics)
- Clusters de marcadores para performance
- Estilizacao personalizada do mapa

**APIs do Google necessarias:**
- Maps JavaScript API
- Drawing Library
- Geocoding API (se busca por endereco)
- Visualization Library (heatmaps)

### Smartlook

**Pacote:** `smartlook-client` v10.0.0
**API Key:** `VITE_SMARTLOOK_API_KEY` (opcional)

**Uso:**
- Gravacao de sessoes de usuario
- Identificacao de usuario por ID, nome e email
- Inicializado no `App.tsx` se a chave estiver configurada
- Identificacao atualizada no `AuthProvider` quando usuario loga

### Axios Mock Adapter

**Pacote:** `axios-mock-adapter` v2.1.0
**Uso:** Mock de respostas da API para testes e desenvolvimento.
**Config:** `src/services/helpers/mock-adapter.function.ts`

---

## 18. Padroes de Codigo e Convencoes

### Naming Conventions

| Tipo | Convencao | Exemplo |
|------|-----------|---------|
| Arquivo de componente | kebab-case | `property-details.tsx` |
| Arquivo de pagina | PascalCase | `Login.tsx` |
| Arquivo de service | kebab-case com verbo | `post-auth-login.service.ts` |
| Arquivo de hook | camelCase com `use` | `useGoogleAuth.ts` |
| Arquivo de helper | kebab-case | `validate-password.helper.ts` |
| Arquivo de constante | kebab-case | `endpoint.constant.ts` |
| Arquivo de interface | kebab-case | `auth.interface.ts` |
| Componente React | PascalCase | `FilterBar`, `PropertyDetails` |
| Hook | camelCase com `use` | `useAuth`, `useEffectiveCredits` |
| Funcao de service | camelCase com verbo HTTP | `postAuthLogin`, `getAuthMe` |
| Constante | SCREAMING_SNAKE_CASE | `GOOGLE_CONFIG`, `COLORS` |
| Interface | PascalCase com `I` | `IAuthUser`, `IAuthStore` |
| Tipo | PascalCase | `FilterState`, `UnitType` |

### Estrutura de um Service File

```
[verbo]-[dominio]-[acao].service.ts

Exemplos:
  post-auth-login.service.ts
  get-property-ad-view.service.ts
  patch-property-listing-acquisition.service.ts
  delete-user.service.ts
```

### Estrutura de um Context

```
modulo/
  |-- modulo.context.tsx              # Provider com useState e localStorage
  |-- modulo-context-definition.tsx   # createContext + tipagem
  |-- modulo.hook.ts                  # useModulo() hook
  +-- modulo.interface.ts             # Interfaces (se necessario)
```

### Estrutura de uma Pagina

```tsx
// pages/private/feature/feature.component.tsx
function FeatureComponent() {
  // hooks (auth, filtros, dados)
  // estado local
  // handlers
  // return JSX
}

// config/routes/index.tsx
function FeaturePage() {
  return (
    <PrivateLayout>
      <FeatureComponent />
    </PrivateLayout>
  );
}

// Rota
<Route path="/feature" element={
  <AccessManager component={FeaturePage} requireAuth={true} />
} />
```

### Error Handling

- **API errors:** Respostas seguem `ErrorResponse { error, message, statusCode }`
- **Auth errors:** 401 -> auto-refresh; 403 -> subscription blocked
- **Inactive users:** `"INACTIVE_USER"` error message tratado no login Google
- **Network errors:** Interceptor faz retry ou redireciona para login
- **Form validation:** Validacao sincrona com mensagens de erro inline

### TypeScript

- **Strict mode** habilitado
- **noUnusedLocals** e **noUnusedParameters** habilitados
- Interfaces com prefixo `I` para interfaces de dados
- Types sem prefixo para union types e aliases
- `as const` para objetos imutaveis (configs)

---

## 19. Troubleshooting e Dicas

### Problemas Comuns

#### "Token expirado" / Redirect loop para /login

**Causa:** Refresh token tambem expirou
**Solucao:**
1. Limpe localStorage manualmente: `localStorage.clear()`
2. Recarregue a pagina
3. Faca login novamente

#### Mapa nao carrega

**Causa:** API key do Google Maps invalida ou sem permissao
**Solucao:**
1. Verifique `VITE_GOOGLE_MAPS_API_KEY` no `.env`
2. Confirme que a key tem Maps JavaScript API habilitada no Google Console
3. Verifique dominio autorizado (localhost:5173 para dev)

#### Login Google nao funciona

**Causa:** Client ID invalido ou dominio nao autorizado
**Solucao:**
1. Verifique `VITE_GOOGLE_CLIENT_ID` no `.env`
2. No Google Console: confirme redirect URIs e dominios autorizados
3. Para dev local: `http://localhost:5173` deve estar na lista
4. Verifique console do browser para erros CORS

#### Dados desatualizados (cache SWR)

**Causa:** SWR serve dados stale do cache
**Solucao:**
1. Force revalidacao: `mutate('/api/path')`
2. Use `revalidateOnMount: true` no hook SWR
3. Apos mutacoes (POST/PATCH/DELETE), invalide o cache correspondente

#### Build falha com erros de tipo

**Causa:** TypeScript strict mode encontrou inconsistencias
**Solucao:**
1. Execute `npx tsc --noEmit` para ver todos os erros
2. Corrija erros de tipo antes do build
3. Nunca use `@ts-ignore` sem justificativa

#### CORS errors na API

**Causa:** Backend nao aceita origem do frontend
**Solucao:**
1. Verifique se o backend esta rodando e acessivel
2. Confirme que `VITE_API_ENV` aponta para o ambiente correto
3. Para dev local: backend deve aceitar `http://localhost:5173`

### Dicas de Desenvolvimento

1. **Use `pnpm dev`** ao inves de `npm` ou `yarn` - o projeto usa pnpm
2. **Verifique o `.env`** sempre que trocar de ambiente (local/dev/prod)
3. **SWR cache keys** incluem userId - nao se preocupe com vazamento entre usuarios
4. **interceptors** sao configurados uma unica vez no `main.tsx` - nao reconfigure
5. **Contexts** seguem o padrao `createRequiredContext` - use os hooks, nao acesse o Context diretamente
6. **Filtros** tem muitos campos booleanos - use `setFilters(partial)` para atualizar parcialmente
7. **Services** com hook SWR retornam `{ data, error, isLoading, mutate }` - use destructuring
8. **Ao adicionar nova rota** privada: envolver com `AccessManager` e `PrivateLayout`
9. **Ao adicionar novo service:** seguir o padrao de 4 camadas (ver secao 8)
10. **Ao criar novo contexto:** usar `createRequiredContext()` e seguir o padrao existente

---

## 20. Glossario de Termos de Negocio

| Termo (PT-BR) | Termo (EN) | Descricao |
|---------------|-----------|-----------|
| Captacao | Sourcing/Acquisition | Processo de encontrar e captar imoveis para venda/locacao |
| Prospeccao | Prospecting | Fase inicial de contato com proprietario |
| Avaliacao | Evaluation/Valuation | Analise de valor de mercado de um imovel |
| Pesquisa de Moradores | Resident Search | Busca de dados de proprietarios/moradores de um endereco |
| Creditos | Credits | Unidades de uso que limitam acesso a funcionalidades pagas |
| Assinatura | Subscription | Plano pago do usuario (PERSONAL ou BUSINESS) |
| Imobiliaria | Real Estate Agency | Empresa de intermediacao imobiliaria |
| Corretor | Real Estate Agent/Broker | Profissional que intermedia compra/venda/locacao |
| Proprietario | Property Owner | Dono do imovel |
| Anunciante | Advertiser | Quem publica o anuncio (proprietario, imobiliaria ou portal) |
| Bairro | Neighborhood | Subdivisao de uma cidade |
| Heatmap | Heatmap | Mapa de calor que mostra intensidade de dados geograficamente |
| Kanban | Kanban | Metodo de gestao visual com colunas e cards |
| Estagio | Stage | Fase do pipeline de captacao (coluna do Kanban) |
| Lancamento | New Development | Imovel novo, em construcao ou recem-lancado |
| Radares | Radars | Feature de monitoramento automatico de oportunidades |
| Upgrade | Upgrade | Mudanca para um plano superior |
| Colaborador | Collaborator/Team Member | Membro da equipe de uma imobiliaria |
| OWNER | Owner | Proprietario da conta (acesso total) |
| ADMIN | Admin | Administrador (gerencia equipe) |
| MEMBER | Member | Membro comum (acesso basico) |
| Venda | Sale | Modelo de negocio de venda de imovel |
| Aluguel | Rental | Modelo de negocio de locacao de imovel |

---

## Apendice: Mapa de Arquivos Criticos

Se voce precisa encontrar algo rapidamente, estes sao os arquivos mais importantes:

| O que voce procura | Arquivo |
|-------------------|---------|
| Entry point | `src/main.tsx` |
| Componente raiz | `src/App.tsx` |
| Todas as rotas | `src/scripts/config/routes/index.tsx` |
| Tema/cores | `src/theme/index.ts` |
| Auth provider | `src/scripts/modules/access-manager/auth.context.tsx` |
| Auth guard | `src/scripts/modules/access-manager/access-manager.component.tsx` |
| Interceptors Axios | `src/services/helpers/axios-interceptor.function.ts` |
| URLs da API | `src/services/helpers/endpoint.constant.ts` |
| Cliente Axios | `src/services/clients/isket-api.client.ts` |
| Filtros context | `src/scripts/modules/filter-selection/filter-selection.context.tsx` |
| Cidades context | `src/scripts/modules/city-selection/city-selection.context.tsx` |
| Menu superior | `src/scripts/library/components/floating-top-menu.tsx` |
| Layout privado | `src/scripts/library/components/private-layout.tsx` |
| Creditos hook | `src/scripts/library/hooks/use-effective-credits.ts` |
| Cache clear | `src/services/helpers/clear-swr-cache.function.ts` |
| Env vars | `src/config/env-var.ts` + `src/scripts/config/environmental.constant.ts` |
| Google config | `src/scripts/config/google.constant.ts` |
| Deploy Vercel | `vercel.json` |
| Deploy GCP | `app.yaml` |

---

> Ultima atualizacao: Fevereiro 2025
